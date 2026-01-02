const express = require('express');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Pool Neon DB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Nodemailer (opzionale, configura env dopo)
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/log', async (req, res) => {
  const { name, timestamp } = req.body;
  if (!name || !timestamp) return res.status(400).json({ error: 'Dati mancanti' });
  
  try {
    await pool.query('INSERT INTO logs (name, timestamp) VALUES ($1, $2)', [name, timestamp]);
    
    if (transporter && process.env.EMAIL_TO) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO,
        subject: '🎉 Nuovo nome registrato!',
        text: `Nome: ${name}\nTimestamp: ${new Date(timestamp).toLocaleString('it-IT')}`
      });
    }
    
    res.json({ ok: true });
  } catch (e) {
    console.error('Errore:', e);
    res.status(500).json({ error: 'Errore DB' });
  }
});

app.get('/admin', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM logs ORDER BY timestamp DESC');
    const logs = result.rows;
    const html = `<!DOCTYPE html>
<html>
<head><title>Log Capodanno</title>
<style>body{font-family:-apple-system,sans-serif;max-width:900px;margin:50px auto;padding:30px;background:#f8f9fa;color:#333;}
h1{font-size:2em;color:#ff6b6b;text-align:center;} a{color:#4ecdc4;text-decoration:none;font-weight:bold;}
ul{list-style:none;padding:0;} li{padding:15px;margin:10px 0;background:white;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1); display:flex;justify-content:space-between;align-items:center;}
small{color:#666;font-size:0.9em;} .totale{text-align:center;font-size:1.2em;font-weight:bold;color:#27ae60;margin-top:20px;}</style>
</head>
<body>
<h1>📊 Log Nomi Inseriti</h1>
<p style="text-align:center;"><a href="/">← Torna alla pagina principale</a> | <button onclick="location.reload()">🔄 Aggiorna</button></p>
<ul>${logs.map(entry => `<li><strong>${entry.name}</strong> <small>${new Date(entry.timestamp).toLocaleString('it-IT')}</small></li>`).join('')}</ul>
<div class="totale">Totale: ${logs.length} nomi 🎊</div>
</body></html>`;
    res.send(html);
  } catch (e) {
    res.status(500).send(`Errore: ${e.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server su porta ${PORT}`);
  console.log('📊 /admin per log');
});
