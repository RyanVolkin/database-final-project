require('dotenv').config(); // Load environment variables
const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

console.log(`Server is starting on port: ${port}`);
console.log(process.env.DB_USER)

app.use(express.json()); // Enable JSON body parsing

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Example API route
app.get('/api/items', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM items');
        res.json(result.rows);
        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});