const express = require('express');
const cors = require('cors');
const pool = require('./db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json()); 


const PORT = process.env.PORT || 6005;
app.listen(PORT, () => {
    console.log(`Connected Successfully...on PORT ${PORT}`)
});