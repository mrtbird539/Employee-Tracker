const express = require('express');
// Import and require mysql2
const mysql = require('mysql2');

require("dotenv").config()

const PORT = process.env.PORT || 3001;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to database
const db = mysql.createConnection(
  {
    host: 'localhost',
    // MySQL username,
    user: 'root',
    //Add MySQL password here
    password: process.env.DB_PASS,
    database: 'emp_tracker_db'
  },
  console.log(`Connected to the emp_tracker_db database.`)
);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  