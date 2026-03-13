import express from 'express';
import router, { initDb } from './index.js';

const app = express();
app.use(express.json());

// Initialize DB
await initDb();

app.use(router);

export default app;
