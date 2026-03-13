import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import apiApp, { initDb } from "./api/index.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize DB
  await initDb();

  // Mount the API routes
  app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);
    next();
  });
  app.use("/api", apiApp);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  // Handle SPA fallback for production
  if (process.env.NODE_ENV === "production") {
    app.get(/.*/, (req, res) => {
      res.sendFile("index.html", { root: "dist" });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
