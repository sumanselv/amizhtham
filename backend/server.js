import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import cardsRouter from './routes/cards.js';
import uploadRouter from './routes/upload.js';
import messagesRouter from './routes/messages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve uploaded images as static files, e.g. GET /uploads/169999-image.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.json({ message: 'Card API is running' }));
app.use('/api/cards', cardsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/messages', messagesRouter);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));