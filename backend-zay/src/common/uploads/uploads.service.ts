import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import '../../cloudinary-env';
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
      const parsed = this.parseCloudinaryUrl(process.env.CLOUDINARY_URL!);
      if (parsed) {
        cloudinary.config({
          cloud_name: parsed.cloudName,
          api_key: parsed.apiKey,
          api_secret: parsed.apiSecret,
          secure: true,
        });
      }
      this.logger.log('Uploads → Cloudinary');
    } else {
      this.logger.log('Uploads → disque local /uploads');
    }
  }

  private get useCloudinary() {
    return (process.env.CLOUDINARY_URL ?? '').startsWith('cloudinary://');
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

  private async uploadToCloudinary(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    try {
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: `zay/${folder}`,
        resource_type: 'image',
        unique_filename: true,
        overwrite: false,
      });
      if (!result.secure_url) {
        throw new Error('Cloudinary n’a pas renvoyé d’URL');
      }
      return result.secure_url;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Upload Cloudinary échoué';
      this.logger.error(message);
      throw new BadRequestException(message);
    }
  }

  private parseCloudinaryUrl(url: string): {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  } | null {
    const body = url.replace(/^cloudinary:\/\//, '');
    const at = body.lastIndexOf('@');
    if (at < 0) return null;
    const creds = body.slice(0, at);
    const cloudName = body.slice(at + 1);
    const colon = creds.indexOf(':');
    if (colon < 0 || !cloudName) return null;
    return {
      apiKey: creds.slice(0, colon),
      apiSecret: creds.slice(colon + 1),
      cloudName,
    };
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
