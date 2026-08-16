import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

function isCorrectPassword(req) {
    return req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD;
}

// GET /api/cards — public
router.get('/', (req, res) => {
    const cards = db.prepare('SELECT * FROM cards ORDER BY id DESC').all();
    res.json(cards);
});

// POST /api/cards/verify-password — protected, no side effects
router.post('/verify-password', (req, res) => {
    if (!isCorrectPassword(req)) {
        return res.status(401).json({ error: 'Incorrect password' });
    }
    res.json({ ok: true });
});

// GET /api/cards/:id — public
router.get('/:id', (req, res) => {
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    res.json(card);
});

// POST /api/cards — protected
router.post('/', (req, res) => {
    if (!isCorrectPassword(req)) {
        return res.status(401).json({ error: 'Incorrect password' });
    }

    const { title, description, body = '', image_url } = req.body;

    if (!title || !description || !image_url) {
        return res.status(400).json({ error: 'title, description, and image_url are required' });
    }

    const result = db
        .prepare('INSERT INTO cards (title, description, body, image_url) VALUES (?, ?, ?, ?)')
        .run(title, description, body, image_url);

    const newCard = db.prepare('SELECT * FROM cards WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newCard);
});

// PUT /api/cards/:id — protected
router.put('/:id', (req, res) => {
    if (!isCorrectPassword(req)) {
        return res.status(401).json({ error: 'Incorrect password' });
    }

    const existing = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Card not found' });

    const title = req.body.title ?? existing.title;
    const description = req.body.description ?? existing.description;
    const body = req.body.body ?? existing.body;
    const image_url = req.body.image_url ?? existing.image_url;

    db.prepare(
        `UPDATE cards
     SET title = ?, description = ?, body = ?, image_url = ?, updated_at = datetime('now')
     WHERE id = ?`
    ).run(title, description, body, image_url, req.params.id);

    res.json(db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id));
});

// DELETE /api/cards/:id — protected
router.delete('/:id', (req, res) => {
    if (!isCorrectPassword(req)) {
        return res.status(401).json({ error: 'Incorrect password' });
    }

    const existing = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Card not found' });

    db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id);
    res.status(204).send();
});

export default router;