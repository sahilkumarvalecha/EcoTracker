require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const pool = new Pool({
  user: 'postgres', 
  host: 'localhost',
  database: 'EcoTracker',
  password: 'abc.123',
  port: 5432,
});

// 2. Then configure the session store
const pgStore = new pgSession({
  pool: pool,
  tableName: 'user_sessions'
});
const app = express();





app.use(session({
  store: new pgSession({
    pool: pool, // Your existing pg pool
    tableName: 'user_sessions' // Will create automatically
  }),
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax', // Change back to 'lax'
    maxAge: 24 * 60 * 60 * 1000
  }
}));

const cors = require("cors");
// Middleware
app.use(cors({
  origin: 'http://127.0.0.1:5500',  // Or your exact client origin
  credentials: true,
  exposedHeaders: ['set-cookie']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from WEB folder
app.use(express.static(path.join(__dirname, '../WEB')));



app.use((req, res, next) => {
  console.log('Incoming session:', req.session);
  console.log('Session ID:', req.sessionID);
  next();
});

// Setup multer for local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../WEB/uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, "../WEB/uploads")));

app.get('/check-session', (req, res) => {
  res.json({
    authenticated: !!req.session.user_id,
    user_id: req.session.user_id,
    session: req.session
  });
});
// HTML routes
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'WEB', 'signup.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'WEB', 'login.html'));
});

app.get('/rsvp', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events LIMIT 1');
    const event = result.rows[0];
    if (!event) {
      return res.send('No event found.');
    }

    const today = new Date();
    const eventDate = new Date(event.date);

    if (eventDate >= today.setHours(0, 0, 0, 0)) {
      res.sendFile(path.join(__dirname, '..', 'WEB', 'events.html'));
    } else {
      res.send('Event is done. Thank you!');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// User routes
app.get("/api/user", async (req, res) => {
  if (!req.session.user_id) return res.status(401).json({ error: "Not logged in" });

  const result = await pool.query("SELECT name, email, avatar FROM users WHERE user_id = $1", [req.session.user_id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

  res.json(result.rows[0]);
});

app.post("/api/avatar", async (req, res) => {
  if (!req.session.user_id) return res.status(401).json({ error: "Not logged in" });

  const { avatar } = req.body;
  await pool.query("UPDATE users SET avatar = $1 WHERE id = $2", [avatar, req.session.userId]);

  res.json({ success: true });
});

// Auth routes
app.post('/signup', async (req, res) => {
  const { name, email, password_hash } = req.body;

  if (!name || !email || !password_hash) {
    return res.status(400).json({ message: 'Please fill all fields!' });
  }

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists!' });
    }

    await pool.query('INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)', [name, email, password_hash]);
    res.status(201).json({ message: 'User Registered Successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password_hash } = req.body;

  if (!email || !password_hash) {
    return res.status(400).json({ message: 'Please enter email and password' });
  }

    const result = await pool.query(
      'SELECT name, password_hash, user_id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    if (user.password_hash !== password_hash) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const isAdmin = email.endsWith('@ecotracker.pk');

  req.session.user_id = user.user_id;
  req.session.email = email;
  req.session.name = user.name;
  req.session.isAdmin = isAdmin;

  // Force save the session before responding
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.status(500).json({ message: 'Session error' });
    }
    
    // Set cookie manually for extra assurance
    res.cookie('connect.sid', req.sessionID, {
      httpOnly: true,
      sameSite: 'none',
      secure: false,  // true in production
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      name: user.name,
      isAdmin
    });
  });
});
// Middleware to check if user is logged in
function checkAuth(req, res, next) {
  if (req.session.user_id) {
    next();
  } else {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ redirect: '/login' });
    }
    res.redirect('/login');
  }
}

app.get('/api/check-auth', (req, res) => {
  res.json({ isAuthenticated: !!req.session.user_id });
});

app.get(['/', '/dashboard'], checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'WEB', 'index.html'));
});

// Middleware to protect admin routes
function isAdminMiddleware(req, res, next) {
  if (req.session && req.session.email && req.session.email.endsWith('@ecotracker.pk')) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied: Admins only' });
  }
}

app.get('/admin-dashboard', isAdminMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'WEB', 'admin-dashboard.html'));
});

function requireLogin(req, res, next) {
  console.log('Session in middleware:', req.session); // Debug line
  if (!req.session.user_id) {
    console.log('Missing user_id in session'); // Debug
    return res.status(401).json({ 
      error: 'Login required',
      sessionId: req.sessionID // For debugging
    });
  }
  next();
}


// Report submission page
app.get('/api/reports', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'WEB', 'report-incident.html'));
});

// Handle report submission
app.post("/api/reports", requireLogin, upload.single("image"), async (req, res) => {
  const {
    title,
    description,
    category_id,
    location_id,
    is_anonymous,
    severity_level,
  } = req.body;

  // Input validation
  if (
    !title ||
    !description ||
    isNaN(category_id) ||
    isNaN(location_id) ||
    !severity_level
  ) {
    return res
      .status(400)
      .json({ error: "Missing or invalid required fields" });
  }

  const anonymous = is_anonymous === 'on';

  // Check session if not anonymous
  if (!anonymous) {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ error: "You must be logged in to submit a non-anonymous report." });
    }
  }

  const user_id = anonymous ? null : req.session.user_id;

  // Generate unique report ID
  const report_id = uuidv4();
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const created_at = new Date();

  try {
    await pool.query(
      `INSERT INTO reports (
        report_id, user_id, title, description,
        category_id, location_id,
        image_url, is_anonymous, severity_level, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        report_id,
        user_id,
        title,
        description,
        parseInt(category_id),
        parseInt(location_id),
        image_url,
        anonymous,
        severity_level,
        created_at,
      ]
    );

    res.status(200).json({ success: true, message: "Report submitted successfully" });

  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
});



app.get('/api/session', (req, res) => {
  if (req.session.user_id && req.session.name && req.session.email) {
    const { name, email } = req.session;
    res.json({
      name,
      isAdmin: email.endsWith('@ecotracker.pk'),
    });
  } else {
    res.status(401).json({ error: 'User not logged in' });
  }
});

// Get report count
app.get("/api/report-count", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM reports");
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error("Error fetching report count:", error);
    res.status(500).json({ error: "Failed to fetch count" });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Logout failed");
    res.redirect('/login.html');
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.clearCookie('connect.sid');
    res.json({ message: "Logged out" });
  });
});

app.post('/rsvp', async (req, res) => {
  const eventId = req.body.event_id;
  const userId = req.session.user_id;

  if (!userId) {
    return res.json({ error: 'Please log in first' });
  }

  const sql = 'INSERT INTO rsvp (user_id, event_id) VALUES ($1, $2)';
  try {
    await pool.query(sql, [userId, eventId]);
    res.json({ message: 'RSVP successfully saved!' });
  } catch (err) {
    console.error(err);
    res.json({ error: 'Failed to save RSVP' });
  }
});

// Start the server
const PORT = process.env.PORT || 5055;
app.listen(PORT, () => console.log(`connected successfully....on port ${PORT}`));

// Get all categories (for dropdown if needed)
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT category_id, name FROM categories');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch categories:', err.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Analytics Route
app.get('/api/analytics', async (req, res) => {
  try {
    const reportsByLocation = await pool.query(`
      SELECT l.neighborhood AS location, COUNT(*) 
      FROM reports r 
      JOIN locations l ON r.location_id = l.location_id 
      GROUP BY l.neighborhood
    `);

    const reportsByCategory = await pool.query(`
      SELECT c.name AS category, COUNT(*) 
      FROM reports r 
      JOIN categories c ON r.category_id = c.category_id 
      GROUP BY c.name
    `);

    const locationData = {};
    const categoryData = {};

    reportsByLocation.rows.forEach(row => {
      locationData[row.location] = parseInt(row.count);
    });

    reportsByCategory.rows.forEach(row => {
      categoryData[row.category] = parseInt(row.count);
    });

    res.json({
      reportsByLocation: locationData,
      reportsByCategory: categoryData
    });

  } catch (err) {
    console.error('❌ Failed to fetch analytics data:', err);
    res.status(500).json({ error: 'Analytics query failed' });
  }
});

// Filtered Incidents for Map
app.get('/api/incidents', async (req, res) => {
  const { lat, lng, category } = req.query;

  try {
    let query = `
      SELECT r.report_id, r.title, c.name AS category, 
             l.latitude, l.longitude, l.neighborhood
      FROM reports r
      JOIN categories c ON r.category_id = c.category_id
      JOIN locations l ON r.location_id = l.location_id
      WHERE 1=1
    `;

    const values = [];
    
    if (lat && lng) {
      query += ` AND l.latitude BETWEEN $${values.length + 1} AND $${values.length + 2}
                AND l.longitude BETWEEN $${values.length + 3} AND $${values.length + 4}`;
      values.push(
        parseFloat(lat) - 0.05,  // Wider search radius
        parseFloat(lat) + 0.05,
        parseFloat(lng) - 0.05,
        parseFloat(lng) + 0.05
      );
    }

    if (category) {
      query += ` AND c.name ILIKE $${values.length + 1}`;
      values.push(`%${category}%`);
    }

    const result = await pool.query(query, values);
    
    // Always return an array, even if empty
    res.json(result.rows || []);

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json([]); // Return empty array on error
  }
});

