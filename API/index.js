const express = require('express');
const cors = require('cors');
const pool = require('./db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json()); 

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



const PORT = process.env.PORT || 6005;
app.listen(PORT, () => {
    console.log(`Connected Successfully...on PORT ${PORT}`)
});