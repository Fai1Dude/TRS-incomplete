const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

console.log('Attempting to connect to database with:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
  // Not logging password for security
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1212',
  database: process.env.DB_NAME || 'train_reservation_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (err) {
    console.error('Error connecting to the database:', err.message);
    console.error('Please check your database credentials in .env file');
  }
};

testConnection();

module.exports = pool;