import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 Mo

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  readonly rootDir = join(process.cwd(), 'uploads');

  constructor() {
    this.ensureDir(this.rootDir);
    this.ensureDir(join(this.rootDir, 'categories'));
    this.ensureDir(join(this.rootDir, 'subcategories'));
    this.ensureDir(join(this.rootDir, 'products'));
    if (this.useCloudinary) {
      this.logger.log('Uploads → Cloudinary');
    } else {
      this.logger.log('Uploads → disque local /uploads');
    }
  }

  private get useCloudinary() {
    return Boolean(process.env.CLOUDINARY_URL?.trim());
  }

  /**
   * Enregistre une image et retourne l’URL publique :
   * Cloudinary (`https://res.cloudinary.com/...`) si CLOUDINARY_URL est défini,
   * sinon `/uploads/...` servi par Nest.
   */
  async saveImage(
    file: Express.Multer.File,
    folder: 'categories' | 'subcategories' | 'products',
  ): Promise<string> {
    this.assertImage(file);

    if (this.useCloudinary) {
      return this.uploadToCloudinary(file, folder);
    }

    const ext = this.extensionFor(file);
    const filename = `${randomUUID()}${ext}`;
    const dir = join(this.rootDir, folder);
    this.ensureDir(dir);

    writeFileSync(join(dir, filename), file.buffer);

    return `/uploads/${folder}/${filename}`;
  }

  async deleteIfOwned(publicPath: string | null | undefined) {
    if (!publicPath) return;

    if (publicPath.includes('res.cloudinary.com')) {
      const publicId = this.cloudinaryPublicId(publicPath);
      if (!publicId) return;
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        this.logger.warn(
          `Cloudinary destroy ignoré: ${err instanceof Error ? err.message : err}`,
        );
      }
      return;
    }

    if (!publicPath.startsWith('/uploads/')) return;

    const relative = publicPath.replace(/^\//, '');
    const absolute = join(process.cwd(), relative);

    if (existsSync(absolute)) {
      try {
        unlinkSync(absolute);
      } catch {
        // ignore
      }
    }
  }

  private uploadToCloudinary(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `zay/${folder}`,
          resource_type: 'image',
          unique_filename: true,
          overwrite: false,
        },
        (err, result) => {
          if (err || !result?.secure_url) {
            reject(err ?? new Error('Upload Cloudinary échoué'));
            return;
          }
          resolve(result.secure_url);
        },
      );
      stream.end(file.buffer);
    });
  }

  /** `zay/products/abc` depuis une URL res.cloudinary.com */
  private cloudinaryPublicId(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.endsWith('cloudinary.com')) return null;
      const afterUpload = parsed.pathname.split('/upload/')[1];
      if (!afterUpload) return null;
      return afterUpload.replace(/^v\d+\//, '').replace(/\.[a-zA-Z0-9]+$/, '');
    } catch {
      return null;
    }
  }

  private assertImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier image fourni');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Format non supporté. Utilisez JPEG, PNG, WEBP ou GIF.',
      );
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('Image trop lourde (max 5 Mo).');
    }
  }

  private extensionFor(file: Express.Multer.File): string {
    const fromName = extname(file.originalname || '').toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fromName)) {
      return fromName === '.jpeg' ? '.jpg' : fromName;
    }
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    return map[file.mimetype] || '.png';
  }

  private ensureDir(dir: string) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}
