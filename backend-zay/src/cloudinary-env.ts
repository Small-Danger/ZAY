/**
 * Le SDK Cloudinary lit CLOUDINARY_URL au `import`.
 * Railway met souvent des guillemets → crash "Invalid CLOUDINARY_URL protocol".
 * À importer AVANT tout `import 'cloudinary'`.
 */
function sanitizeCloudinaryUrl() {
  let raw = (process.env.CLOUDINARY_URL ?? '').trim();
  raw = raw.replace(/^["']+|["']+$/g, '').trim();
  if (/^CLOUDINARY_URL=/i.test(raw)) {
    raw = raw.replace(/^CLOUDINARY_URL=/i, '').trim();
    raw = raw.replace(/^["']+|["']+$/g, '').trim();
  }
  if (raw.startsWith('cloudinary://')) {
    process.env.CLOUDINARY_URL = raw;
    return;
  }
  delete process.env.CLOUDINARY_URL;
}

sanitizeCloudinaryUrl();
