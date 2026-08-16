import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads');

// Make sure the uploads folder exists before multer tries to write into it.
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

function isCorrectPassword(req) {
    return req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD;
}

// Configure where files go and how they're named.
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        // Unique name so two uploads never overwrite each other.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null, true);
    },
});

const router = Router();

// POST /api/upload — protected. Expects a multipart/form-data request
// with a single field named "image". Returns the public URL to use
// as a card's image_url.
router.post(
    '/',
    (req, res, next) => {
        if (!isCorrectPassword(req)) {
            return res.status(401).json({ error: 'Incorrect password' });
        }
        next();
    },
    (req, res) => {
        upload.single('image')(req, res, (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            if (!req.file) {
                return res.status(400).json({ error: 'No image file received' });
            }

            // Build a full URL back to this server, so the frontend can use it
            // directly as an <img src> without knowing the backend's address itself.
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            res.status(201).json({ url: fileUrl });
        });
    }
);

export default router;