import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

function isCorrectPassword(req) {
    return req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD;
}

// POST /api/messages — public. Anyone visiting /contact can submit,
// no password needed here (that's the whole point of a contact form).
router.post('/', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'name, email, and message are required' });
    }

    const result = db
        .prepare('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)')
        .run(name, email, message);

    const newMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newMessage);
});

// GET /api/messages — protected. Only the admin should be able to
// read what people submitted.
router.get('/', (req, res) => {
    if (!isCorrectPassword(req)) {
        return res.status(401).json({ error: 'Incorrect password' });
    }

    const messages = db.prepare('SELECT * FROM messages ORDER BY id DESC').all();
    res.json(messages);
});

// DELETE /api/messages/:id — protected.
router.delete('/:id', (req, res) => {
    if (!isCorrectPassword(req)) {
        return res.status(401).json({ error: 'Incorrect password' });
    }

    const existing = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Message not found' });

    db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
    res.status(204).send();
});

export default router;