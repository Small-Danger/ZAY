import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import '../../cloudinary-env';
import { v2 as cloudinary } from 'cloudinary';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 Mo

type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  readonly rootDir = join(process.cwd(), 'uploads');
  private readonly credentials: CloudinaryCredentials | null;

  constructor(private readonly prisma: PrismaService) {
    this.ensureDir(this.rootDir);
    this.ensureDir(join(this.rootDir, 'categories'));
    this.ensureDir(join(this.rootDir, 'subcategories'));
    this.ensureDir(join(this.rootDir, 'products'));
    this.credentials = this.resolveCredentials();
    if (this.credentials) {
      this.applyCloudinaryConfig(this.credentials);
      this.logger.log(
        `Uploads → Cloudinary (${this.credentials.cloudName}, key ${this.credentials.apiKey.length}c, secret ${this.credentials.apiSecret.length}c)`,
      );
    } else {
      this.logger.log('Uploads → Postgres (Cloudinary absent)');
    }
  }

  get driver(): 'cloudinary' | 'disk' {
    return this.credentials ? 'cloudinary' : 'disk';
  }

  /**
   * Cloudinary si la signature passe, sinon Postgres (survit aux redeploys).
   */
  async saveImage(
    file: Express.Multer.File,
    folder: 'categories' | 'subcategories' | 'products',
  ): Promise<string> {
    this.assertImage(file);

    if (this.credentials) {
      try {
        return await this.uploadToCloudinary(file, folder);
      } catch (err) {
        const message = this.cloudinaryErrorMessage(err);
        this.logger.error(
          `Cloudinary refusé (${this.credentials.cloudName}): ${message} — repli Postgres`,
        );
      }
    }

    return this.saveToDatabase(file);
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

    if (publicPath.includes('/api/media/')) {
      const id = publicPath.split('/api/media/')[1]?.split(/[/?#]/)[0];
      if (id) {
        await this.prisma.mediaFile.delete({ where: { id } }).catch(() => undefined);
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
    if (!this.credentials) {
      throw new Error('Cloudinary non configuré');
    }
    this.applyCloudinaryConfig(this.credentials);

    const result = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      {
        folder: `zay/${folder}`,
        resource_type: 'image',
      },
    );

    if (!result.secure_url) {
      throw new Error('Cloudinary n’a pas renvoyé d’URL');
    }
    return result.secure_url;
  }

  private async saveToDatabase(file: Express.Multer.File): Promise<string> {
    const created = await this.prisma.mediaFile.create({
      data: {
        mimeType: file.mimetype,
        data: new Uint8Array(file.buffer),
      },
    });
    return `/api/media/${created.id}`;
  }

  private saveToDisk(
    file: Express.Multer.File,
    folder: 'categories' | 'subcategories' | 'products',
  ): string {
    const ext = this.extensionFor(file);
    const filename = `${randomUUID()}${ext}`;
    const dir = join(this.rootDir, folder);
    this.ensureDir(dir);
    writeFileSync(join(dir, filename), file.buffer);
    return `/uploads/${folder}/${filename}`;
  }

  private applyCloudinaryConfig(creds: CloudinaryCredentials) {
    cloudinary.config({
      cloud_name: creds.cloudName,
      api_key: creds.apiKey,
      api_secret: creds.apiSecret,
      secure: true,
    });
  }

  private resolveCredentials(): CloudinaryCredentials | null {
    const fromParts = this.clean(process.env.CLOUDINARY_CLOUD_NAME);
    const apiKey = this.clean(process.env.CLOUDINARY_API_KEY);
    const apiSecret = this.clean(process.env.CLOUDINARY_API_SECRET);
    if (fromParts && apiKey && apiSecret) {
      return { cloudName: fromParts, apiKey, apiSecret };
    }
    return this.parseCloudinaryUrl(process.env.CLOUDINARY_URL);
  }

  private parseCloudinaryUrl(
    raw: string | undefined,
  ): CloudinaryCredentials | null {
    let url = this.clean(raw);
    if (/^CLOUDINARY_URL=/i.test(url)) {
      url = this.clean(url.replace(/^CLOUDINARY_URL=/i, ''));
    }
    if (!url.startsWith('cloudinary://')) return null;

    const body = url.slice('cloudinary://'.length).replace(/\/+$/, '');
    const at = body.lastIndexOf('@');
    if (at < 0) return null;
    const creds = body.slice(0, at);
    const cloudName = body.slice(at + 1).split(/[/?#]/)[0];
    const colon = creds.indexOf(':');
    if (colon < 0 || !cloudName) return null;

    let apiKey = creds.slice(0, colon);
    let apiSecret = creds.slice(colon + 1);
    if (apiKey.includes('%')) {
      try {
        apiKey = decodeURIComponent(apiKey);
      } catch {
        /* garder brut */
      }
    }
    if (apiSecret.includes('%')) {
      try {
        apiSecret = decodeURIComponent(apiSecret);
      } catch {
        /* garder brut */
      }
    }
    if (!apiKey || !apiSecret) return null;
    return { cloudName, apiKey, apiSecret };
  }

  private clean(value: string | undefined): string {
    return (value ?? '')
      .replace(/^\uFEFF/, '')
      .replace(/[\r\n]/g, '')
      .trim()
      .replace(/^["']+|["']+$/g, '')
      .trim();
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
