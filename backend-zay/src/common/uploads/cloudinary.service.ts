import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * Même circuit qu’Afrikraga (Laravel CloudinaryService) :
 * parse CLOUDINARY_URL comme PHP parse_url → upload HTTP signé SHA1 v1
 * (qualité auto, max 1200×1200) → on ne garde que secure_url.
 * Pas de SDK Node : il signe en v2 par défaut, d’où Invalid Signature.
 */
export type MediaFolder =
  | 'categories'
  | 'subcategories'
  | 'products'
  | 'products/images';

type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

const ROOT_FOLDER = 'zay';
const TRANSFORMATION = 'c_limit,f_auto,h_1200,q_auto,w_1200';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly credentials: CloudinaryCredentials | null;

  constructor() {
    this.credentials = this.resolveCredentials();
    if (this.credentials) {
      this.logger.log(
        `Cloudinary prêt (${this.credentials.cloudName}, key ${this.credentials.apiKey.length}c, secret ${this.credentials.apiSecret.length}c)`,
      );
    } else {
      this.logger.warn('CLOUDINARY_URL / clés absentes — pas d’upload CDN');
    }
  }

  get isConfigured(): boolean {
    return this.credentials != null;
  }

  get cloudName(): string | null {
    return this.credentials?.cloudName ?? null;
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: MediaFolder,
  ): Promise<string> {
    if (!this.credentials) {
      throw new Error('Cloudinary non configuré');
    }

    const targetFolder = `${ROOT_FOLDER}/${folder}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const signed = {
      folder: targetFolder,
      timestamp,
      transformation: TRANSFORMATION,
    };
    const signature = this.signV1(signed, this.credentials.apiSecret);

    const form = new FormData();
    const filename = file.originalname?.trim() || 'image.jpg';
    const bytes = new Uint8Array(file.buffer);
    form.append(
      'file',
      new File([bytes], filename, { type: file.mimetype }),
    );
    form.append('api_key', this.credentials.apiKey);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);
    form.append('folder', targetFolder);
    form.append('transformation', TRANSFORMATION);

    const endpoint = `https://api.cloudinary.com/v1_1/${this.credentials.cloudName}/image/upload`;
    const response = await fetch(endpoint, { method: 'POST', body: form });
    const payload = (await response.json()) as {
      secure_url?: string;
      error?: { message?: string };
    };

    if (!response.ok || payload.error) {
      throw new Error(payload.error?.message || `HTTP ${response.status}`);
    }
    if (!payload.secure_url) {
      throw new Error('Cloudinary n’a pas renvoyé d’URL');
    }

    this.logger.log(`Upload OK → ${payload.secure_url}`);
    return payload.secure_url;
  }

  async deleteByUrl(url: string): Promise<void> {
    if (!this.credentials) return;

    const publicId = this.publicIdFromUrl(url);
    if (!publicId) {
      this.logger.warn(`public_id introuvable dans ${url}`);
      return;
    }

    const resourceType = url.includes('/video/') ? 'video' : 'image';
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.signV1(
      { public_id: publicId, timestamp },
      this.credentials.apiSecret,
    );

    const form = new FormData();
    form.append('public_id', publicId);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);
    form.append('api_key', this.credentials.apiKey);

    const endpoint = `https://api.cloudinary.com/v1_1/${this.credentials.cloudName}/${resourceType}/destroy`;
    const response = await fetch(endpoint, { method: 'POST', body: form });
    const payload = (await response.json()) as {
      result?: string;
      error?: { message?: string };
    };

    if (!response.ok || payload.error) {
      throw new Error(payload.error?.message || `HTTP ${response.status}`);
    }
  }

  /** SHA1 v1 = PHP Cloudinary (pas encode_param / signature_version 2). */
  private signV1(
    params: Record<string, string | number>,
    secret: string,
  ): string {
    const toSign = Object.keys(params)
      .filter((key) => params[key] !== '' && params[key] != null)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    return createHash('sha1').update(toSign + secret).digest('hex');
  }

  /**
   * `zay/categories/abc` depuis https://res.cloudinary.com/.../upload/v123/zay/categories/abc.jpg
   * (Afrikraga passait souvent l’URL brute à destroy — fichiers orphelins.)
   */
  private publicIdFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.endsWith('cloudinary.com')) return null;
      const match = parsed.pathname.match(/\/v\d+\/(.+)$/);
      if (!match?.[1]) return null;
      return decodeURIComponent(match[1]).replace(/\.[a-zA-Z0-9]+$/, '');
    } catch {
      return null;
    }
  }

  private resolveCredentials(): CloudinaryCredentials | null {
    const cloudName = this.clean(process.env.CLOUDINARY_CLOUD_NAME);
    const apiKey = this.clean(process.env.CLOUDINARY_API_KEY);
    const apiSecret = this.clean(process.env.CLOUDINARY_API_SECRET);
    if (cloudName && apiKey && apiSecret) {
      return { cloudName, apiKey, apiSecret };
    }
    return this.parseCloudinaryUrl(process.env.CLOUDINARY_URL);
  }

  /** Équivalent PHP parse_url($cloudinaryUrl) → user / pass / host. */
  private parseCloudinaryUrl(
    raw: string | undefined,
  ): CloudinaryCredentials | null {
    let url = this.clean(raw);
    if (/^CLOUDINARY_URL=/i.test(url)) {
      url = this.clean(url.replace(/^CLOUDINARY_URL=/i, ''));
    }
    const match = url.match(
      /^cloudinary:\/\/([^:/]+):([^@]+)@([^/:?#]+)/i,
    );
    if (!match) return null;

    const apiKey = this.maybeDecode(match[1]);
    const apiSecret = this.maybeDecode(match[2]);
    const cloudName = match[3];
    if (!apiKey || !apiSecret || !cloudName) return null;
    return { cloudName, apiKey, apiSecret };
  }

  private maybeDecode(value: string): string {
    if (!value.includes('%')) return value;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private clean(value: string | undefined): string {
    return (value ?? '')
      .replace(/^\uFEFF/, '')
      .replace(/[\u201C\u201D\u2018\u2019]/g, '"')
      .replace(/[\r\n]/g, '')
      .trim()
      .replace(/^["']+|["']+$/g, '')
      .trim();
  }
}
