import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './app.js';
import { logger } from './logger.js';

// Load .env from current directory or root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const app = createApp();

app.listen(port, () => {
  logger.info(`HoldOn API server listening on port ${port}`);
});
