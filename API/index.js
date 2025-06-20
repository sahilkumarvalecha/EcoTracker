const express = require('express');
const path = require('path');
const app = express();
const session = require('express-session');
require('dotenv').config();
const { Pool } = require('pg');
const pgSession = require('connect-pg-simple')(session);
const multer = require("multer");
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');


// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Configure session middleware ONCE
app.use(
  session({
    store: new pgSession({
      pool: pool, // Use your pool instance here
      tableName: 'user_sessions' // Optional custom table name
    }),
    name: "connect.sid",
    secret: "your-secret-key", // Use env variable
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      sameSite: 'lax'
    }
  })
);


app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Improved session logging middleware
app.use((req, res, next) => {
  // Log session data more clearly
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Session ID:', req.sessionID);
  console.log('Full session data:', req.session);  // Log everything for debugging

  // Check authentication status
  if (req.session.user) {
    console.log('Authenticated user:', {
      id: req.session.user.id,
      name: req.session.user.name,
      isAdmin: req.session.user.isAdmin
    });
  } else {
    console.log('No authenticated user');
  }

  next();
});

// Setup multer for local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../public/uploads");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }); // ✅ fixes the error
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });


// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, "../public/uploads")));
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));


// HTML routes
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login.html'));
});


// signup 

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill all fields!' });
  }

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists!' });
    }

    await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) returning *',
      [name, email, password]
    );
    res.status(201).json({ message: 'User Registered Successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});


// login

app.post('/login', async (req, res) => {
  const { email, password_hash } = req.body;

  if (!email || !password_hash) {
    return res.status(400).json({ message: 'Please enter email and password' });
  }

  try {
    const result = await pool.query(
      'SELECT user_id, name, password_hash FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // In production, use bcrypt.compare() instead of direct comparison
    if (user.password_hash !== password_hash) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Regenerate session to prevent fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({ message: 'Session error' });
      }

      const isAdmin = email.endsWith('@ecotracker.pk');

      // Set session data
      req.session.user = {
        id: user.user_id,
        email: email.toLowerCase().trim(),
        name: user.name,
        isAdmin: isAdmin,
        authenticatedAt: new Date()
      };

      // Save session before sending response
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({
            success: false,
            message: 'Login failed'
          });
        }
        console.log('User from DB:', user);
        console.log('Calculated isAdmin:', isAdmin);

        // Successful login response
        res.status(200).json({
          success: true,
          message: "Login successful",
          user: {
            id: user.user_id,
            name: user.name,
            email: email.toLowerCase().trim(),
            isAdmin: isAdmin
          }
        });
      });
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// Middleware to check if user is logged in
function checkAuth(req, res, next) {
  if (req.session.user.id) {
    next();
  } else {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ redirect: '/login' });
    }
    res.redirect('/login');
  }
}

app.get("/api/check-session", (req, res) => {
  if (req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user
    });
  } else {
    res.status(401).json({
      authenticated: false,
      message: "Not authenticated"
    });
  }
});

app.get('/api/check-auth', (req, res) => {
  res.json({ isAuthenticated: !!req.session.user.id });
});


app.get(['/', '/dashboard'], checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});


function requireLogin(req, res, next) {
  if (!req.session.user.id) {
    return res.status(401).json({ error: 'Login required' });
  }
  next();
}


// Report submission page
app.get('/api/reports', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '/API/public/report-incident.html'));
});

// Handle report submission
app.post("/api/reports", upload.single("image"), async (req, res) => {

  const {
    title,
    description,
    category_id,
    location_id,
    is_anonymous,
    severity_level,
  } = req.body;

  console.log("Received POST /api/reports request");
  console.log("Body:", req.body);
  console.log("File:", req.file);
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
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "You must be logged in to submit a non-anonymous report." });
    }
  }

  const user_id = anonymous ? null : req.session.user.id;


  // Generate unique report ID
  const report_id = uuidv4();
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const created_at = new Date();

  if (!image_url) {
    console.warn("No image uploaded. req.file is:", req.file);
  }
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

    res.status(200).json({
      success: true,
      message: "Report submitted successfully",
      report_id: report_id
    });

  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

//handle session
app.get('/api/session', (req, res) => {
  if (req.session.user.id && req.session.name && req.session.email) {
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
    const count = result.rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error("Error fetching report count:", error);
    res.status(500).json({ error: "Failed to fetch count" });
  }
});

//  high severity count
app.get('/api/high-severity-count', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM reports WHERE severity_level ilike 'high'`
    );
    const count = parseInt(result.rows[0].count);
    res.json({ highSeverityCount: count });
  } catch (error) {
    console.error('Error fetching high severity count:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// reports from database
app.get('/api/reportsPage', async (req, res) => {
  try {
    const result = await pool.query('SELECT *, severity_level AS severity  FROM reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reports:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// logout
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

// rsvp get and post
app.get('/api/userRsvps', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const query = 'SELECT event_id FROM rsvp WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    res.json(result.rows); 
  } catch (err) {
    console.error('Fetch RSVP error:', err);
    res.status(500).json({ error: 'Server error fetching RSVPs' });
  }
});

app.post('/api/rsvp', async (req, res) => {
  try {
    const { user_id, event_id } = req.body;
    console.log("Incoming RSVP:", req.body);
    if (!user_id || !event_id) {
      return res.status(400).json({ error: "Missing user_id or event_id" });
    }

    const checkQuery = 'SELECT * FROM rsvp WHERE user_id = $1 AND event_id = $2';
    const result = await pool.query(checkQuery, [user_id, event_id]);

    if (result.rows.length > 0) {
      return res.status(409).json({ success: false, message: "Already RSVPed" });
    }

    const insertQuery = 'INSERT INTO rsvp (user_id, event_id) VALUES ($1, $2)';
    await pool.query(insertQuery, [user_id, event_id]);
    return res.json({ success: true }); 
  } catch (err) {
    console.error("RSVP error:", err);
    return res.status(500).json({ error: "Database error" }); 
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
    console.error('Failed to fetch analytics data:', err);
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

//community chat
app.get('/api/chats', async (req, res) => {
  try {
    const { area } = req.query;
    if (!area) return res.status(400).json({ error: 'Area parameter is required' });

    const result = await pool.query(`
      SELECT chats.message, chats.is_user, users.name AS sender
      FROM chats
      JOIN users ON chats.user_id = users.user_id
      WHERE chats.area = $1
      ORDER BY chats.created_at ASC
    `, [area]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching chats:', err);
    res.status(500).json({ error: 'Failed to load chats' });
  }
});

app.post('/api/chats', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { area, message, is_user = true } = req.body;

    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    if (!area || !message) return res.status(400).json({ error: "Area and message are required" });

    await pool.query(
      'INSERT INTO chats (area, user_id, message, is_user) VALUES ($1, $2, $3, $4)',
      [area, userId, message, is_user]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error saving chat:', err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

// event create
app.post('/api/events', async (req, res) => {
  const { name, location, status, date } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO events (name, location, status, date) VALUES ($1, $2, $3, $4)',
      [name, location, status, date]
    );
    res.status(201).json({ message: "Event created", event: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// fetch events
app.get('/api/eventsFetch', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reports:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// events count
app.get("/api/events-count", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(id) FROM events");
    const count = result.rows[0].count;
    res.json({ count: parseInt(count) }); // Send the count as a number
  } catch (error) {
    console.error("Error fetching report count:", error);
    res.status(500).json({ error: "Failed to fetch count" });
  }
});

//EcoAlert Feed
app.get('/api/reports-feed', async (req, res) => {
  try {
    const userId = req.session.user.id; // Get current user ID

    const result = await pool.query(`
      SELECT 
        r.report_id,
        r.title,
        r.description,
        r.image_url AS image,
        r.created_at,
        r.is_anonymous,
        u.name AS user_name,
        COALESCE(u.avatar, '/API/public/uploads/image.png') AS user_image,
        l.neighborhood AS location,
        c.name AS category,
        r.report_status AS status,
        COUNT(CASE WHEN rv.vote_type = 1 THEN 1 END) AS upvotes,
        COUNT(CASE WHEN rv.vote_type = -1 THEN 1 END) AS downvotes,
        (SELECT vote_type FROM report_votes WHERE user_id = $1 AND report_id = r.report_id) AS user_vote
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN locations l ON r.location_id = l.location_id
      LEFT JOIN categories c ON r.category_id = c.category_id
      LEFT JOIN report_votes rv ON r.report_id = rv.report_id
      GROUP BY r.report_id, u.name, u.avatar, l.neighborhood, c.name, r.image_url, r.created_at, r.is_anonymous, r.report_status
      ORDER BY r.created_at DESC;
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reports feed" });
  }
});


// vote endpoint
app.post('/api/reports/:id/vote', requireLogin, async (req, res) => {
  const reportId = req.params.id;
  const { vote } = req.body;
  const userId = req.session.user.id;

  try {
    await pool.query('BEGIN');

    // Update vote
    await pool.query(`
      INSERT INTO report_votes (user_id, report_id, vote_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, report_id)
      DO UPDATE SET vote_type = EXCLUDED.vote_type
      WHERE report_votes.vote_type != EXCLUDED.vote_type
    `, [userId, reportId, vote]);

    // Get updated counts and status
    const { rows } = await pool.query(`
      SELECT 
        COUNT(CASE WHEN vote_type = 1 THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = -1 THEN 1 END) as downvotes,
        (SELECT report_status FROM reports WHERE report_id = $1) as status
      FROM report_votes 
      WHERE report_id = $1
    `, [reportId]);

    await pool.query('COMMIT');

    res.json({
      success: true,
      upvotes: rows[0].upvotes || 0,
      downvotes: rows[0].downvotes || 0,
      status: rows[0].status
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Voting error:', err);
    res.status(500).json({ error: 'Voting failed' });
  }
});

// user update
app.post('/api/updateUser', async (req, res) => {
  try {
    const { user_id, name, email, password } = req.body;

    // Validate input
    if (!user_id || !name || !email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Update logic here
    const userCheck = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    let updateQuery;
    let queryParams;

    if (password) {
      // Store password directly (assuming it's already hashed or you want plain text)
      updateQuery = `
        UPDATE users 
        SET name = $1, email = $2, password_hash = $3 
        WHERE user_id = $4 
        RETURNING user_id, name, email`;
      queryParams = [name, email, password, user_id];
    } else {
      updateQuery = `
        UPDATE users 
        SET name = $1, email = $2 
        WHERE user_id = $3 
        RETURNING user_id, name, email`;
      queryParams = [name, email, user_id];
    }

    const result = await pool.query(updateQuery, queryParams);

    res.json({
      success: true,
      user: result.rows[0],
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update error:', error);
  }
});

// for user update
app.get('/api/user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all users from the database
app.get('/api/usersLoad', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// delete user
// DELETE a user by ID
app.delete('/api/users/:user_id', async (req, res) => {
  const { user_id } = req.params;

  // Optional: Check if user_id is a valid number (if your DB expects an integer)
  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Delete user from the database
    const result = await pool.query('DELETE FROM users WHERE user_id = $1', [user_id]);

    if (result.rowCount === 0) {
      // No matching user found
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(`Error deleting user with ID ${user_id}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// contact form send message
app.post('/api/contact', async (req, res) => {
  const { email, subject, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required.' });
  }

  try {
    await pool.query(
      'INSERT INTO contact_messages (email, subject, message) VALUES ($1, $2, $3)',
      [email, subject || null, message]
    );
    res.status(200).json({ message: 'Message stored successfully.' });
  } catch (err) {
    console.error('DB insertion error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get message
app.get('/api/messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT email, subject, message, received_at FROM contact_messages ORDER BY received_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//moderate-reports
app.get('/api/moderate-reports', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.report_id,
        r.title,
        r.description,
        r.image_url AS image,
        r.created_at,
        r.is_anonymous,
        u.name AS user_name,
        COALESCE(u.avatar, '/API/public/uploads/image.png') AS user_image,
        l.neighborhood AS location,
        c.name AS category,
        (SELECT COUNT(*) FROM report_votes WHERE report_id = r.report_id AND vote_type = 1) AS upvotes,
        (SELECT COUNT(*) FROM report_votes WHERE report_id = r.report_id AND vote_type = -1) AS downvotes,
        r.report_status AS status,
        (SELECT COUNT(*) FROM comments WHERE report_id = r.report_id) AS comment_count
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN locations l ON r.location_id = l.location_id
      LEFT JOIN categories c ON r.category_id = c.category_id
      WHERE r.report_status IN ('reported', 'inreview')
      ORDER BY r.created_at DESC;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Moderation reports error:', err);
    res.status(500).json({ error: "Failed to fetch reports for moderation" });
  }
});

// Update report status (admin only)
app.post('/api/reports/:id/status', requireAdmin, async (req, res) => {
  const reportId = req.params.id;
  const { status } = req.body;

  if (!['inreview', 'Resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    await pool.query(
      'UPDATE reports SET report_status = $1 WHERE report_id = $2',
      [status, reportId]
    );

    res.json({ success: true, newStatus: status });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

// Middleware to check admin status
function requireAdmin(req, res, next) {
  console.log('requireAdmin called');
  console.log('req.session:', req.session);
  if (!req.session.user || !req.session.user.isAdmin) {
    console.log('Admin access denied');
    return res.status(403).json({ error: 'Admin access required' });
  }
  console.log('Admin access granted');
  next();
}

// analytics charts
app.get('/api/analytics-data', async (req, res) => {
  try {
    const query = `
      SELECT
        r.report_id,
        r.title,
        r.severity_level AS severity,
        c.name AS category,
        l.neighborhood AS area,
        r.created_at
      FROM reports r
      JOIN categories c ON r.category_id = c.category_id
      JOIN locations l ON r.location_id = l.location_id
      WHERE r.report_status != 'deleted'
      ORDER BY r.created_at DESC
    `;

    const { rows } = await pool.query(query);

    // Format data if needed, then send
    res.json(rows);

  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Profile picture upload route
app.post('/api/upload-profile-picture', upload.single('profile'), async (req, res) => {
  try {
    const userId = req.body.user.id;  // now expecting userId
    const file = req.file;

    if (!userId || !file) {
      return res.status(400).json({ success: false, message: "Missing userId or file" });
    }

    const filePath = `http://localhost:5055/uploads/${file.filename}`;

    // Update user's avatar in database by userId
    await pool.query(
      `UPDATE users SET avatar = $1 WHERE user_id = $2`,
      [filePath, userId]
    );

    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Comment Routes
app.get('/api/reports/:reportId/comments', async (req, res) => {
  try {
    const { reportId } = req.params;

    const result = await pool.query(`
          SELECT 
              c.comment_id,
              c.report_id,
              c.content,
              c.created_at,
              u.user_id,
              u.name AS user_name,
              COALESCE(u.avatar, '/default-avatar.png') AS user_image
          FROM comments c
          JOIN users u ON c.user_id = u.user_id
          WHERE c.report_id = $1
          ORDER BY c.created_at DESC
      `, [reportId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/api/reports/:reportId/comments', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { content } = req.body;
    const userId = req.session.user.id;
    console.log('Session:', req.session);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not logged in' });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const result = await pool.query(`
          INSERT INTO comments (report_id, user_id, content)
          VALUES ($1, $2, $3)
          RETURNING *,
              (SELECT name FROM users WHERE user_id = $2) AS user_name,
              (SELECT COALESCE(avatar, '/default-avatar.png') FROM users WHERE user_id = $2) AS user_image
      `, [reportId, userId, content.trim()]);

    // Update comment count in reports table
    await pool.query(`
    UPDATE reports 
    SET comment_count = (SELECT COUNT(*) FROM comments WHERE report_id = $1)
    WHERE report_id = $1
    `, [reportId]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ error: 'Failed to create comment', details: err.message});
  }
});

//stats
// Enhanced stats endpoint with error handling
app.get('/api/report-stats', async (req, res) => {
  try {
    // Get total reports count (only count non-anonymous reports if needed)
    const totalQuery = await pool.query(`
      SELECT COUNT(*) as count 
      FROM reports
    `);

    // Get resolved reports count
    const resolvedQuery = await pool.query(`
      SELECT COUNT(*) as count 
      FROM reports 
      WHERE report_status = 'Resolved' 
    `);

    const total = parseInt(totalQuery.rows[0]?.count || 0);
    const resolved = parseInt(resolvedQuery.rows[0]?.count || 0);
    const percentage = total > 0 ? Math.round((resolved / total) * 100) : 0;

    res.json({
      success: true,
      total,
      resolved,
      percentage,
    });
  } catch (err) {
    console.error('Stats fetch error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      details: err.message
    });
  }
});

// Start the server
const PORT = process.env.PORT || 5055;
app.listen(PORT, () => console.log(`connected successfully....on port ${PORT}`));