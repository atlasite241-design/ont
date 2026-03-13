import express from 'express';
import router, { initDb } from './index.js';

const app = express();
app.use(express.json());

// Initialize DB with better error logging
initDb().catch((err) => {
  console.error("CRITICAL: Database initialization failed:", err);
});

app.use('/api', router);

// Add a global error handler for the API
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("API Error:", err);
  res.status(500).json({ success: false, message: "Erreur serveur interne" });
});

export default app;
