require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const app = express();

// Serve static files from WEB folder
app.use(express.static(path.join(__dirname, '../WEB')));


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.post("/api/reports", upload.single("image"), async (req, res) => {
    
  const { title, description, category_id, location_id, is_anonymous } = req.body;

  const categoryId = parseInt(category_id);
  const locationId = parseInt(location_id);

if (!title || !description || isNaN(categoryId) || isNaN(locationId)) {
  return res.status(400).json({ error: "Missing or invalid required fields" });
}

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'WEB', 'signup.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'WEB', 'login.html'));
});

// signup
app.post('/signup', async(req, res) => {
    const {name, email, password_hash} = req.body;

     // Validation: ensure fields are present
    if (!name || !email || !password_hash) {
        return res.status(400).json({ message: 'Please fill all fields!' });
    }

    try{
        // check if user exist
        const userExists = await pool.query('select * from users where email = $1', [email]);
        console.log("heloo")
        if(userExists.rows.length > 0){
            return res.status(400).json({ message: 'User already exists!'});
        }


        // insert user
        await pool.query('insert into users (name, email, password_hash) values ($1, $2, $3)', [name, email, password_hash]);
        res.status(201).json({ message: 'User Registered Successfully'})
    }catch(err){
        console.error(err.message);
    res.status(500).json({ message: 'Server error' });
    }
})

// login
app.post('/login', async (req, res) => {
  const { email, password_hash } = req.body;

  if (!email || !password_hash) {
    return res.status(400).json({ message: 'Please enter email and password' });
  }

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.rows[0].password_hash !== password_hash) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});



  const report_id = uuidv4();
  const user_id = null; // Optional if not logged-in user
  const status_id = 1;  // Default to "Pending"
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const created_at = new Date();

  try {
    await pool.query(`
    INSERT INTO reports (
        user_id, title, description,
        category_id, status_id, location_id,
        image_url, is_anonymous, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING report_id
      
    `,[
        user_id, title, description,
        categoryId, status_id, locationId,
        image_url, is_anonymous === "on", created_at
      ]);

      
      res.redirect('/index.html?submitted=true');
    } catch (err) {
      console.error(err);
      res.status(500).send("Database error");
    }
  });

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, "../WEB/uploads")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
