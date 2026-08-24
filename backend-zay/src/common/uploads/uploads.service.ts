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

type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

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
        this.logger.log(`Uploads → Cloudinary (${parsed.cloudName})`);
      } else {
        this.logger.warn(
          'CLOUDINARY_URL présent mais illisible — uploads disque /uploads',
        );
      }
    } else {
      this.logger.log('Uploads → disque local /uploads');
    }
  }

  get driver(): 'cloudinary' | 'disk' {
    return this.useCloudinary && this.parseCloudinaryUrl(process.env.CLOUDINARY_URL ?? '')
      ? 'cloudinary'
      : 'disk';
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

    if (this.driver === 'cloudinary') {
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
    const creds = this.requireCloudinaryCredentials();
    const targetFolder = `zay/${folder}`;
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { folder: targetFolder, timestamp },
      creds.apiSecret,
    );

    const form = new FormData();
    const filename = file.originalname || `image${this.extensionFor(file)}`;
    form.append(
      'file',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
      filename,
    );
    form.append('api_key', creds.apiKey);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);
    form.append('folder', targetFolder);

    let payload: { secure_url?: string; error?: { message?: string } };
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(creds.cloudName)}/image/upload`,
        { method: 'POST', body: form },
      );
      payload = (await res.json()) as typeof payload;
    } catch (err) {
      const message = this.cloudinaryErrorMessage(err);
      this.logger.error(`Cloudinary réseau (${creds.cloudName}): ${message}`);
      throw new BadRequestException(`Upload Cloudinary échoué: ${message}`);
    }

    if (!payload.secure_url) {
      const message =
        payload.error?.message || 'Cloudinary n’a pas renvoyé d’URL';
      this.logger.error(`Cloudinary API (${creds.cloudName}): ${message}`);
      throw new BadRequestException(`Upload Cloudinary échoué: ${message}`);
    }

    return payload.secure_url;
  }

  private requireCloudinaryCredentials(): CloudinaryCredentials {
    const parsed = this.parseCloudinaryUrl(process.env.CLOUDINARY_URL ?? '');
    if (!parsed) {
      throw new BadRequestException(
        'CLOUDINARY_URL invalide. Valeur attendue : cloudinary://clé:secret@cloud',
      );
    }
    return parsed;
  }

  private parseCloudinaryUrl(url: string): CloudinaryCredentials | null {
    const cleaned = url.trim().replace(/^["']+|["']+$/g, '');
    if (!cleaned.startsWith('cloudinary://')) return null;

    try {
      const parsed = new URL(cleaned);
      if (parsed.protocol !== 'cloudinary:') return null;
      const cloudName = decodeURIComponent(parsed.hostname || '').trim();
      const apiKey = decodeURIComponent(parsed.username || '').trim();
      const apiSecret = decodeURIComponent(parsed.password || '').trim();
      if (!cloudName || !apiKey || !apiSecret) return null;
      return { cloudName, apiKey, apiSecret };
    } catch {
      const body = cleaned.replace(/^cloudinary:\/\//, '');
      const at = body.lastIndexOf('@');
      if (at < 0) return null;
      const creds = body.slice(0, at);
      const cloudName = body.slice(at + 1).trim();
      const colon = creds.indexOf(':');
      if (colon < 0 || !cloudName) return null;
      return {
        apiKey: creds.slice(0, colon),
        apiSecret: creds.slice(colon + 1),
        cloudName,
      };
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
      if (typeof o.message === 'string' && o.message.trim()) return o.message;
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
