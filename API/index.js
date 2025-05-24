const express = require('express');
const cors = require('cors');
const pool = require('./db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json()); 

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
        
        if(userExists.rows.length > 0){
            return res.status(400).json({ message: 'User already exists!'});
        }


        // insert user
        await pool.query('insert into users (name, email, password_hash) values ($1, $2, $3)', [name, email, password]);
        res.status(201).json({ message: 'User Registered Successfully'})
    }catch(err){
        console.error(err.message);
    res.status(500).json({ message: 'Server error' });
    }
})

const PORT = process.env.PORT || 6005;
app.listen(PORT, () => {
    console.log(`Connected Successfully...on PORT ${PORT}`)
});