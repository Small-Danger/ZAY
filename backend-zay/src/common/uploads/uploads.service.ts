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
      cloudinary.config(true);
      const cfg = cloudinary.config();
      this.logger.log(
        `Uploads → Cloudinary (${cfg.cloud_name}, key ${String(cfg.api_key || '').length}c, secret ${String(cfg.api_secret || '').length}c)`,
      );
    } else {
      this.logger.log('Uploads → disque local /uploads');
    }
  }

  get driver(): 'cloudinary' | 'disk' {
    return this.useCloudinary ? 'cloudinary' : 'disk';
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
          `Cloudinary destroy ignoré: ${this.cloudinaryErrorMessage(err)}`,
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
    cloudinary.config(true);
    const cfg = cloudinary.config();
    if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) {
      throw new BadRequestException(
        'CLOUDINARY_URL invalide. Valeur attendue : cloudinary://clé:secret@cloud',
      );
    }

    try {
      const result = await new Promise<{ secure_url?: string }>(
        (resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: `zay/${folder}`,
              resource_type: 'image',
            },
            (error, uploaded) => {
              if (error) {
                reject(error);
                return;
              }
              resolve(uploaded ?? {});
            },
          );
          stream.on('error', reject);
          stream.end(file.buffer);
        },
      );

      if (!result.secure_url) {
        throw new Error('Cloudinary n’a pas renvoyé d’URL');
      }
      return result.secure_url;
    } catch (err) {
      const message = this.cloudinaryErrorMessage(err);
      this.logger.error(`Cloudinary (${cfg.cloud_name}): ${message}`);
      throw new BadRequestException(`Upload Cloudinary échoué: ${message}`);
    }
  }

  private cloudinaryErrorMessage(err: unknown, depth = 0): string {
    if (depth > 4 || err == null) return 'erreur inconnue';
    if (typeof err === 'string' && err.trim()) return err;
    if (typeof err === 'object') {
      const o = err as {
        message?: unknown;
        code?: unknown;
        error?: unknown;
        cause?: unknown;
      };
      if (typeof o.code === 'string' && o.code.startsWith('UNABLE_TO')) {
        return String(o.message || o.code);
      }
      if (typeof o.error === 'string' && o.error.trim()) return o.error;
      if (o.error && typeof o.error === 'object') {
        const nested = this.cloudinaryErrorMessage(o.error, depth + 1);
        if (nested !== 'erreur inconnue') return nested;
      }
      if (o.cause) {
        const nested = this.cloudinaryErrorMessage(o.cause, depth + 1);
        if (nested !== 'erreur inconnue') return nested;
      }
      if (typeof o.message === 'string' && o.message.trim()) {
        return o.message.split('.')[0] || o.message;
      }
    }
    return 'erreur inconnue';
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
