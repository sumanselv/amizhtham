import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'app.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// --- Schema (used only when the database is created for the first time) ---
db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
                                         id          INTEGER PRIMARY KEY AUTOINCREMENT,
                                         title       TEXT NOT NULL,
                                         description TEXT NOT NULL,
                                         body        TEXT NOT NULL DEFAULT '',
                                         image_url   TEXT NOT NULL,
                                         created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
                                            id          INTEGER PRIMARY KEY AUTOINCREMENT,
                                            name        TEXT NOT NULL,
                                            email       TEXT NOT NULL,
                                            message     TEXT NOT NULL,
                                            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );
`);

// --- Migration: add "body" to a database that already existed before
// this column was introduced. Safe to run every startup — it only
// alters the table the first time it finds the column missing.
const existingColumns = db.prepare('PRAGMA table_info(cards)').all();
const hasBodyColumn = existingColumns.some((col) => col.name === 'body');

if (!hasBodyColumn) {
    db.exec("ALTER TABLE cards ADD COLUMN body TEXT NOT NULL DEFAULT ''");
    console.log('Migrated: added "body" column to cards table.');
}

// --- Seed (only if empty) ---
const { count } = db.prepare('SELECT COUNT(*) AS count FROM cards').get();

if (count === 0) {
    db.prepare(
        'INSERT INTO cards (title, description, body, image_url) VALUES (?, ?, ?, ?)'
    ).run(
        'பூசணி விதை',
        'பூசணி விதைகள் (பெபிட்டா) புரதம், ஆரோக்கியமான கொழுப்புகள், மக்னீசியம், மற்றும் வைட்டமின்கள் நிறைந்த ஒரு சிறிய சூப்பர் உணவாகும்.',
        'பூசணி விதைகளில் அதிக அளவு மெக்னீசியம் உள்ளது, இது இதய ஆரோக்கியத்தையும் தூக்கத்தையும் மேம்படுத்த உதவுகிறது. தினமும் ஒரு சிறிய கைப்பிடி அளவு சாப்பிடலாம்.',
        'https://experiencelife.lifetime.life/wp-content/uploads/2021/03/tiny-and-mighty-1024x577.jpg'
    );
    console.log('Seeded database with initial card.');
}

export default db;