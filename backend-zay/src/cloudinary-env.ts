/**
 * Le SDK Cloudinary lit CLOUDINARY_URL au `import`.
 * Railway met souvent des guillemets ou `CLOUDINARY_URL=` dans la valeur.
 * À importer AVANT tout `import 'cloudinary'`.
 */
function sanitizeCloudinaryUrl() {
  let raw = (process.env.CLOUDINARY_URL ?? '')
    .replace(/^\uFEFF/, '')
    .replace(/[\u201C\u201D\u2018\u2019]/g, '"')
    .replace(/\r?\n/g, '')
    .trim();
  raw = raw.replace(/^["']+|["']+$/g, '').trim();
  if (/^CLOUDINARY_URL=/i.test(raw)) {
    raw = raw.replace(/^CLOUDINARY_URL=/i, '').trim();
    raw = raw.replace(/^["']+|["']+$/g, '').trim();
  }
  raw = raw.replace(/\/+$/, '');
  if (raw.startsWith('cloudinary://')) {
    process.env.CLOUDINARY_URL = raw;
    return;
  }
  delete process.env.CLOUDINARY_URL;
}

sanitizeCloudinaryUrl();
