import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

for (const sub of ['posters', 'banners', 'videos', 'trailers']) {
  fs.mkdirSync(path.join(UPLOAD_ROOT, sub), { recursive: true });
}

function destinationFor(fieldname: string): string {
  switch (fieldname) {
    case 'poster':
      return 'posters';
    case 'banner':
      return 'banners';
    case 'trailer':
      return 'trailers';
    case 'video':
    default:
      return 'videos';
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(UPLOAD_ROOT, destinationFor(file.fieldname)));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const ALLOWED_MIME = /^(image\/(png|jpe?g|webp)|video\/(mp4|quicktime|x-matroska|webm))$/;

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB ceiling for raw video
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

export const UPLOAD_ROOT_DIR = UPLOAD_ROOT;
