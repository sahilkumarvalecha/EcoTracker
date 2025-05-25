require("dotenv").config();
const multer = require("multer");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const session = require('express-session');
const express = require("express");
const cors = require("cors");
const app = express();

// CORS Configuration
const allowedOrigins = ['http://localhost:5500', 'http://127.0.0.1:5500'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Manual OPTIONS handler - avoids path-to-regexp issue
app.options(/.*/, (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.sendStatus(200);
});

app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.path}`);
  next();
});


app.use(session({
  secret: 'your_secret_key',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Apply authentication middleware to all routes
app.use(checkAuth);
// Serve static files from WEB folder
app.use(express.static(path.join(__dirname, '../WEB'), {
  index: false, // Don't serve index.html for directories
  extensions: ['html', 'htm'] // Only serve these extensions
}));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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

// Serve static files from WEB folder (update this)
app.use('/WEB', express.static(path.join(__dirname, '../WEB'), {
  index: false,
  extensions: ['html', 'htm']
}));

// Serve uploads separately
app.use('/WEB/uploads', express.static(path.join(__dirname, '../WEB/uploads')));

// Signup route
app.get('/signup', (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/WEB/index.html');
  }
  res.sendFile(path.join(__dirname, '../WEB/signup.html'));
});

// Login route
app.get('/login', (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/WEB/index.html');
  }
  res.sendFile(path.join(__dirname, '../WEB/login.html'));
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

  try {
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

    res.status(200).json({
      success: true,
      name: user.name,
      isAdmin
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});
// Middleware to check if user is logged in
// Updated checkAuth middleware
// Enhanced authentication middleware
// Enhanced checkAuth middleware
// Updated checkAuth middleware
function checkAuth(req, res, next) {
  // Always allow login/signup pages and static assets
  const publicRoutes = [
    '/WEB/login.html',
    '/WEB/signup.html',
    '/api/login',
    '/api/signup',
    '/api/check-auth'
  ];

  // Allow static assets
  const isStaticAsset = /\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2|ttf|eot)$/.test(req.path);
  
  // Skip auth check for public routes and static assets
  if (publicRoutes.includes(req.path) || isStaticAsset) {
    return next();
  }

  // Check session for authentication
  if (req.session.user_id) {
    return next();
  }

  // Handle API requests differently
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Redirect to login for HTML requests
  res.redirect('/WEB/login.html');
}

// Update your /api/check-auth endpoint
app.get('/api/check-auth', (req, res) => {
  res.json({ 
    isAuthenticated: !!req.session.user_id,
    // Include any additional user info needed
    user: req.session.user_id ? {
      name: req.session.name,
      isAdmin: req.session.isAdmin
    } : null
  });
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

// Report submission
app.get('/api/reports', (req, res) => {
  res.sendFile(path.join(__dirname,  '..', 'WEB', 'report-incident.html'));
});

app.post("/api/reports", checkAuth, upload.single("image"), async (req, res) => {
  // Log the incoming request for debugging
  console.log("Request body:", req.body);
  console.log("File:", req.file);
  
  const {
    title,
    description,
    category_id,
    location_id,
    severity_level,
    is_anonymous
  } = req.body;

  // Convert checkbox value to boolean properly
  const isAnonymous = is_anonymous === 'on' || is_anonymous === 'true';

  const user_id = isAnonymous ? null : req.session.user_id;

  // Validation
  if (!title || !description || !category_id || !location_id || !severity_level) {
    return res.status(400).json({ 
      error: "Missing required fields",
      details: { title, description, category_id, location_id, severity_level }
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO reports (
        user_id, title, description,
        category_id, location_id,
        image_url, is_anonymous, severity_level, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        user_id,
        title,
        description,
        category_id,
        location_id,
        req.file ? `/uploads/${req.file.filename}` : null,
        isAnonymous,
        severity_level,
        new Date()
      ]
    );

    console.log("Report saved:", result.rows[0]);
    return res.json({ 
      success: true, 
      redirect: '/index.html?submitted=true',
      report: result.rows[0]
    });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ 
      error: "Failed to save report",
      details: error.message 
    });
  }
});
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
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
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send("Logout failed");
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
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
    console.error('❌ Error in /api/incidents:', err);
    res.status(500).json({ error: 'Database query failed.' });
  }
});

// Get all reports for EcoAlerts feed
app.get('/api/ecoalerts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.report_id, 
        r.title, 
        r.description, 
        r.image_url, 
        r.created_at,
        r.severity_level,
        c.name AS category,
        l.neighborhood AS location,
        CASE 
          WHEN r.user_id IS NULL THEN 'Anonymous'
          ELSE u.name 
        END AS user_name,
        CASE
          WHEN r.is_anonymous THEN true
          ELSE false
        END AS is_anonymous
      FROM reports r
      JOIN categories c ON r.category_id = c.category_id
      JOIN locations l ON r.location_id = l.location_id
      LEFT JOIN users u ON r.user_id = u.user_id
      ORDER BY r.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching ecoalerts:", error);
    res.status(500).json({ error: "Failed to fetch ecoalerts" });
  }
});

// Get comments for a specific report
app.get('/api/ecoalerts/:report_id/comments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.comment_id,
        c.text,
        c.image_url,
        c.created_at,
        u.name AS user_name,
        u.user_id
      FROM comments c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.report_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.report_id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Add a new comment to a report
app.post('/api/ecoalerts/:report_id/comments', upload.single("image"), async (req, res) => {
  const { text } = req.body;
  const report_id = req.params.report_id;
  const user_id = req.session.user_id;

  if (!user_id) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO comments (
        report_id, 
        user_id, 
        text, 
        image_url, 
        created_at
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        report_id,
        user_id,
        text,
        req.file ? `/uploads/${req.file.filename}` : null,
        new Date()
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});