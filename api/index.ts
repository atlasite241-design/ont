import express from "express";
import pg from "pg";
import cors from "cors";
import dns from "dns";

dns.setDefaultResultOrder('ipv4first');

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.kdyqivtjmcfdhstjsokr:ontfinderrayyan@aws-1-eu-central-1.pooler.supabase.com:6543/postgres";

const maskedUrl = DATABASE_URL.replace(/:([^@]+)@/, (match, p1) => {
  const masked = p1.length > 4 ? p1.substring(0, 2) + "****" + p1.substring(p1.length - 2) : "****";
  console.log(`Password detected (length: ${p1.length})`);
  return `:${masked}@`;
});
console.log("Database connection initialized using:", process.env.DATABASE_URL ? "Environment Variable" : "Hardcoded String");
if (process.env.VERCEL) {
  console.log("Running on Vercel environment");
}
console.log("Connection string (masked):", maskedUrl);

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const initDb = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database connection test successful");
  } catch (err) {
    console.error("CRITICAL: Database connection test failed!");
    console.error("Error details:", err instanceof Error ? err.message : String(err));
    console.error("Check your DATABASE_URL environment variable in the Settings menu.");
    if (err instanceof Error && err.message.includes("password authentication failed")) {
      console.error("The password provided in the connection string is incorrect.");
    }
    // We don't throw here to allow the server to start, but it will fail on requests
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS utilisateurs (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'User',
        security_question TEXT,
        security_answer TEXT,
        is_blocked BOOLEAN DEFAULT false,
        is_approved BOOLEAN DEFAULT false,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
    `);
    await pool.query(`
      ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
    `);
    await pool.query(`
      ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS ip_address TEXT;
    `);
    await pool.query(`
      ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS city TEXT;
    `);
    await pool.query(`
      ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS user_agent TEXT;
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS connection_logs (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        ip_address TEXT,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        duration_seconds INTEGER DEFAULT 0
      );
    `);
    await pool.query(`
      ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ont_records (
        id TEXT PRIMARY KEY,
        msan TEXT,
        location TEXT,
        sn TEXT,
        version TEXT,
        vendor_id TEXT,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create default admin if not exists
    const adminCheck = await pool.query("SELECT * FROM utilisateurs WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
      await pool.query(
        "INSERT INTO utilisateurs (username, password, role, is_approved) VALUES ($1, $2, $3, $4)",
        ["admin", "admin", "PROPRIÉTAIRE/PDG", true]
      );
      console.log("Default admin created with OWNER/CEO role");
    } else {
      // Update existing admin to the new requested role if it's different, and ensure they are approved
      await pool.query("UPDATE utilisateurs SET role = 'PROPRIÉTAIRE/PDG', is_approved = true WHERE username = 'admin'");
    }
    
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
};

console.log("API router initialized");
const router = express.Router();

router.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

router.options(/.*/, cors());
router.use(express.json());

// API Health check
router.get("/health", (req, res) => {
  res.status(200).send("ONT Finder Pro API is running");
});

// Auth Routes
router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM utilisateurs WHERE username = $1 AND password = $2",
      [username, password]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (user.is_blocked) {
        return res.status(403).json({ success: false, message: "Ce compte est bloqué" });
      }
      
      const isApproved = user.is_approved || user.username === 'admin' || user.role === 'Super Admin' || user.role === 'PROPRIÉTAIRE/PDG';
      if (!isApproved) {
        return res.status(403).json({ success: false, message: "Ce compte n'est pas encore approuvé par l'administrateur" });
      }
      
      // Update last_active on login
      await pool.query("UPDATE utilisateurs SET last_active = CURRENT_TIMESTAMP WHERE username = $1", [username]);
      
      // Record connection log
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      await pool.query(
        "INSERT INTO connection_logs (username, ip_address) VALUES ($1, $2)",
        [username, Array.isArray(ip) ? ip[0] : ip]
      );
      
      res.json({ success: true, user: { username: user.username, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: "Identifiant ou mot de passe incorrect" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.get("/auth/status/:username", async (req, res) => {
  const { username } = req.params;
  try {
    // Update last_active timestamp
    await pool.query("UPDATE utilisateurs SET last_active = CURRENT_TIMESTAMP WHERE username = $1", [username]);
    
    // Update latest log duration
    await pool.query(`
      UPDATE connection_logs 
      SET last_active = CURRENT_TIMESTAMP,
          duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - login_time))
      WHERE id = (
        SELECT id FROM connection_logs 
        WHERE username = $1 
        ORDER BY login_time DESC 
        LIMIT 1
      )
    `, [username]);
    
    const result = await pool.query("SELECT is_blocked, is_approved FROM utilisateurs WHERE username = $1", [username]);
    if (result.rows.length > 0) {
      res.json({ success: true, is_blocked: result.rows[0].is_blocked, is_approved: result.rows[0].is_approved });
    } else {
      res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }
  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.get("/users/active/count", async (req, res) => {
  try {
    // Count users active in the last 1 minute
    const result = await pool.query("SELECT COUNT(*) FROM utilisateurs WHERE last_active >= NOW() - INTERVAL '1 minute'");
    res.json({ success: true, count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Active users count error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.get("/users/active/list", async (req, res) => {
  try {
    const result = await pool.query("SELECT username FROM utilisateurs WHERE last_active >= NOW() - INTERVAL '1 minute'");
    res.json({ success: true, users: result.rows.map(r => r.username) });
  } catch (err) {
    console.error("Active users list error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.post("/auth/register/bulk", async (req, res) => {
  const { users } = req.body;
  try {
    await pool.query("BEGIN");
    for (const user of users) {
      const { username, password, role } = user;
      await pool.query(
        "INSERT INTO utilisateurs (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING",
        [username, password, role || 'User']
      );
    }
    await pool.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Bulk register error:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la création groupée" });
  }
});

router.post("/auth/register", async (req, res) => {
  const { username, password, role, securityQuestion, securityAnswer, is_approved } = req.body;
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  if (Array.isArray(ip)) {
    ip = ip[0];
  } else if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  const userAgent = req.headers['user-agent'] || '';
  let city = 'Inconnue';
  try {
    // If it's a local IP, don't try to geolocate
    if (ip && ip !== '::1' && ip !== '127.0.0.1') {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      const geoData = await geoRes.json();
      if (geoData.status === 'success') {
        city = geoData.city + ', ' + geoData.country;
      }
    }
  } catch (e) {
    console.error("GeoIP error:", e);
  }

  try {
    const approvedStatus = is_approved !== undefined ? is_approved : false;
    await pool.query(
      "INSERT INTO utilisateurs (username, password, role, security_question, security_answer, is_approved, ip_address, city, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [username, password, role || 'User', securityQuestion, securityAnswer, approvedStatus, ip, city, userAgent]
    );
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(400).json({ success: false, message: "Ce nom d'utilisateur est déjà pris" });
    } else {
      console.error("Register error:", err);
      res.status(500).json({ success: false, message: "Erreur lors de la création du compte" });
    }
  }
});

router.post("/auth/recovery/question", async (req, res) => {
  const { username } = req.body;
  try {
    const result = await pool.query("SELECT security_question FROM utilisateurs WHERE username = $1", [username]);
    if (result.rows.length > 0) {
      res.json({ success: true, question: result.rows[0].security_question });
    } else {
      res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }
  } catch (err) {
    console.error("Recovery question error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.post("/auth/recovery/verify", async (req, res) => {
  const { username, answer } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM utilisateurs WHERE username = $1 AND security_answer = $2",
      [username, answer]
    );
    if (result.rows.length > 0) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Réponse incorrecte" });
    }
  } catch (err) {
    console.error("Recovery verify error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.post("/auth/recovery/reset", async (req, res) => {
  const { username, password } = req.body;
  try {
    await pool.query(
      "UPDATE utilisateurs SET password = $1 WHERE username = $2",
      [password, username]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Recovery reset error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.post("/auth/change-password", async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  try {
    const userCheck = await pool.query(
      "SELECT * FROM utilisateurs WHERE username = $1 AND password = $2",
      [username, currentPassword]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Mot de passe actuel incorrect" });
    }

    await pool.query(
      "UPDATE utilisateurs SET password = $1 WHERE username = $2",
      [newPassword, username]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// User Management Routes
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT username, role, is_blocked, is_approved, ip_address, city, user_agent, created_at as \"createdAt\" FROM utilisateurs ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.delete("/users/:username", async (req, res) => {
  const { username } = req.params;
  if (username === 'admin') {
    return res.status(403).json({ success: false, message: "Impossible de supprimer l'administrateur par défaut" });
  }
  try {
    await pool.query("DELETE FROM utilisateurs WHERE username = $1", [username]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.patch("/users/:username/role", async (req, res) => {
  const { username } = req.params;
  const { role } = req.body;
  if (username === 'admin') {
    return res.status(403).json({ success: false, message: "Impossible de modifier le rôle de l'administrateur par défaut" });
  }
  try {
    await pool.query("UPDATE utilisateurs SET role = $1 WHERE username = $2", [role, username]);
    res.json({ success: true });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.patch("/users/:username/approve", async (req, res) => {
  const { username } = req.params;
  try {
    await pool.query("UPDATE utilisateurs SET is_approved = true WHERE username = $1", [username]);
    res.json({ success: true });
  } catch (err) {
    console.error("Approve user error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.patch("/users/:username/block", async (req, res) => {
  const { username } = req.params;
  const { is_blocked } = req.body || {};
  if (username === 'admin') {
    return res.status(403).json({ success: false, message: "Impossible de bloquer l'administrateur par défaut" });
  }
  if (is_blocked === undefined) {
    return res.status(400).json({ success: false, message: "Champ is_blocked manquant" });
  }
  try {
    await pool.query("UPDATE utilisateurs SET is_blocked = $1 WHERE username = $2", [is_blocked, username]);
    res.json({ success: true });
  } catch (err) {
    console.error("Block user error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// Debug Route
router.get("/db-debug", async (req, res) => {
  try {
    const source = process.env.DATABASE_URL ? "Environment Variable" : "Hardcoded String";
    const result = await pool.query("SELECT 1 as connected");
    res.json({ 
      success: true, 
      connected: result.rows[0].connected === 1,
      source: source,
      maskedUrl: maskedUrl
    });
  } catch (err) {
    const source = process.env.DATABASE_URL ? "Environment Variable" : "Hardcoded String";
    res.status(500).json({ 
      success: false, 
      error: err instanceof Error ? err.message : String(err),
      source: source,
      maskedUrl: maskedUrl
    });
  }
});

// ONT Records Routes
router.get("/ont-data", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, msan, location, sn, version, vendor_id as \"vendorId\", status FROM ont_records");
    res.json({ records: result.rows, lastUpdated: new Date().toLocaleString() });
  } catch (err) {
    console.error("Get ONT data error:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la récupération des données" });
  }
});

router.post("/ont-data", async (req, res) => {
  const { records } = req.body;
  try {
    await pool.query("BEGIN");
    // For simplicity, we clear and re-insert. In a real app, we'd do upserts.
    await pool.query("DELETE FROM ont_records");
    for (const record of records) {
      await pool.query(
        "INSERT INTO ont_records (id, msan, location, sn, version, vendor_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [record.id, record.msan, record.location, record.sn, record.version, record.vendorId, record.status]
      );
    }
    await pool.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Save ONT data error:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la sauvegarde des données" });
  }
});

router.delete("/ont-data", async (req, res) => {
  try {
    await pool.query("DELETE FROM ont_records");
    res.json({ success: true });
  } catch (err) {
    console.error("Delete ONT data error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// Logs Route
router.get("/logs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.*, 
        u.role 
      FROM connection_logs l
      LEFT JOIN utilisateurs u ON l.username = u.username
      ORDER BY l.login_time DESC 
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Get logs error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// Initialize DB on first load for Vercel (optional, handled in server.ts)
// initDb().catch(console.error);

export default router;
