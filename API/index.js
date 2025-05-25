    require("dotenv").config();
    const express = require("express");
    const multer = require("multer");
    const { Pool } = require("pg");
    const { v4: uuidv4 } = require("uuid");
    const path = require("path");
    const fs = require("fs");
    const cors = require("cors");
    const app = express();
    const session = require('express-session');

    app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,  // Set to true if using HTTPS
    httpOnly: true,
    sameSite: 'lax'
  },
  proxy: true  // Add this if behind a proxy
}));


    // Middleware
   app.use(cors({
  origin: 'http://127.0.0.1:5500',  // jahan se tum request kar rahe ho (frontend ka address)
  credentials: true
}));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Serve static files from WEB folder
    app.use(express.static(path.join(__dirname, '../WEB')));
    

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

    // Serve uploaded images
    app.use('/uploads', express.static(path.join(__dirname, "../WEB/uploads")));

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

    // Signup
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


    // Login
// index.js (update login route for admin check)
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
  
      req.session.user_id = user.user_id;
      req.session.email = email;
      req.session.name = user.name;
  
      const isAdmin = email.endsWith('@ecotracker.pk');
  
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

    // middle ware to check is user is loginned or not 
   function checkAuth(req, res, next) {
  if (req.session.user_id) {
    next(); // User is logged in
  } else {
    // For API requests, send 401 status
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ redirect: '/login' });
    }
    // For page requests, do server-side redirect
    res.redirect('/login');
  }
}
app.get('/api/check-auth', (req, res) => {
  res.json({ isAuthenticated: !!req.session.user_id });
});

app.get(['/', '/dashboard'], checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'WEB', 'index.html'));
});



    // Report submission
    // Report submission
app.post("/api/reports", upload.single("image"), async (req, res) => {
    const {
      title,
      description,
      category_id,
      location_id,
      is_anonymous,
      severity_level,
    } = req.body;
  
    const categoryId = parseInt(category_id);
    const locationId = parseInt(location_id);
  
    if (!title || !description || isNaN(categoryId) || isNaN(locationId) || !severity_level) {
      return res.status(400).json({ error: "Missing or invalid required fields" });
    }
  
    // ✅ Determine user_id
    let user_id = null;
    if (req.session.user_id && is_anonymous !== "on") {
      user_id = req.session.user_id;
    }
  
    const report_id = uuidv4();
    const status_id = 1; // Default to "Pending"
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const created_at = new Date();
  
    try {
      await pool.query(
        `
        INSERT INTO reports (
          user_id, title, description,
          category_id, status_id, location_id,
          image_url, is_anonymous, severity_level, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
        [
          user_id,
          title,
          description,
          categoryId,
          status_id,
          locationId,
          image_url,
          is_anonymous === "on",
          severity_level,
          created_at,
        ]
      );
  
      res.redirect("/index.html?submitted=true");
    } catch (err) {
      console.error(err);
      res.status(500).send("Database error");
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
