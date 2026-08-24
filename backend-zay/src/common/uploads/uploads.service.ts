import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CloudinaryService,
  type MediaFolder,
} from './cloudinary.service';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {
    this.ensureDir(this.rootDir);
    this.ensureDir(join(this.rootDir, 'categories'));
    this.ensureDir(join(this.rootDir, 'subcategories'));
    this.ensureDir(join(this.rootDir, 'products'));
  }

  get driver(): 'cloudinary' | 'disk' {
    return this.cloudinary.isConfigured ? 'cloudinary' : 'disk';
  }

  /**
   * Cloudinary (CDN) en priorité, comme Afrikraga.
   * Repli Postgres si la signature CDN échoue encore — survit aux redeploys.
   */
  async saveImage(
    file: Express.Multer.File,
    folder: MediaFolder,
  ): Promise<string> {
    this.assertImage(file);

    if (this.cloudinary.isConfigured) {
      try {
        return await this.cloudinary.uploadImage(file, folder);
      } catch (err) {
        const message = this.errorMessage(err);
        this.logger.error(
          `Cloudinary refusé (${this.cloudinary.cloudName}): ${message} — repli Postgres`,
        );
      }
    }

    return this.saveToDatabase(file);
  }

  async deleteIfOwned(publicPath: string | null | undefined) {
    if (!publicPath) return;

    if (publicPath.includes('res.cloudinary.com')) {
      try {
        await this.cloudinary.deleteByUrl(publicPath);
      } catch (err) {
        this.logger.warn(`Cloudinary destroy ignoré: ${this.errorMessage(err)}`);
      }
      return;
    }

    if (publicPath.includes('/api/media/')) {
      const id = publicPath.split('/api/media/')[1]?.split(/[/?#]/)[0];
      if (id) {
        await this.prisma.mediaFile
          .delete({ where: { id } })
          .catch(() => undefined);
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

  private async saveToDatabase(file: Express.Multer.File): Promise<string> {
    const created = await this.prisma.mediaFile.create({
      data: {
        mimeType: file.mimetype,
        data: new Uint8Array(file.buffer),
      },
    });
    return `/api/media/${created.id}`;
  }

  private errorMessage(err: unknown, depth = 0): string {
    if (depth > 4 || err == null) return 'erreur inconnue';
    if (typeof err === 'string' && err.trim()) return err;
    if (err instanceof Error && err.message.trim()) {
      return err.message.split('.')[0] || err.message;
    }
    if (typeof err === 'object') {
      const o = err as { message?: unknown; error?: unknown; cause?: unknown };
      if (typeof o.message === 'string' && o.message.trim()) {
        return o.message.split('.')[0] || o.message;
      }
      if (o.error) return this.errorMessage(o.error, depth + 1);
      if (o.cause) return this.errorMessage(o.cause, depth + 1);
    }
    return 'erreur inconnue';
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

  private ensureDir(dir: string) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}
