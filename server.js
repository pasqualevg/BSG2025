const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/log', async (req, res) => {
  const { name, timestamp } = req.body;
  if (!name || !timestamp) return res.status(400).json({ error: 'Dati mancanti' });
  try {
    await pool.query('INSERT INTO logs (name, timestamp) VALUES ($1, $2)', [name, timestamp]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Errore DB' });
  }
});

app.get('/admin', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM logs ORDER BY timestamp DESC');
    const logs = result.rows;
    let html = `<!DOCTYPE html><html><head><title>Log</title><style>body{font-family:sans-serif;max-width:800px;margin:50px auto;padding:20px;background:#f5f5f5;}h1

