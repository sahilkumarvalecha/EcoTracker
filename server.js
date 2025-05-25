const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'API', '.env') });

console.log('🔥 server.js is running');
console.log('🌐 DATABASE_URL:', process.env.DATABASE_URL);

const app = express();
const port = process.env.PORT || 5055;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ Database connection failed:', err.message));

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



// Get filtered incidents
app.get('/api/incidents', async (req, res) => {
  const { lat, lng, category } = req.query;

  try {
    if (!lat || !lng || !category) {
      return res.status(400).json({ error: 'Missing lat, lng, or category' });
    }

    const delta = 0.01;
    const values = [
      parseFloat(lat) - delta,
      parseFloat(lat) + delta,
      parseFloat(lng) - delta,
      parseFloat(lng) + delta,
      category
    ];

    const query = `
      SELECT r.title, c.name AS category, l.latitude, l.longitude
      FROM reports r
      JOIN categories c ON r.category_id = c.category_id
      JOIN locations l ON r.location_id = l.location_id
      WHERE l.latitude BETWEEN $1 AND $2
        AND l.longitude BETWEEN $3 AND $4
        AND c.name ILIKE $5
    `;

    console.log('🧭 Query values:', values);

    const result = await pool.query(query, values);

    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.json({ message: 'No such issue reported at the selected location.' });
    }

  } catch (err) {
    console.error('❌ Error in /api/incidents:', err);
    res.status(500).json({ error: 'Database query failed.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});



