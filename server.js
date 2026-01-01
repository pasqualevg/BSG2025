const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve public/index.html [web:82][web:143]

const LOG_FILE = path.join(__dirname, 'logs.json');

// Salva nome + timestamp
app.post('/log', (req, res) => {
  const { name, timestamp } = req.body;
  if (!name || !timestamp) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }

  let logs = [];
  try {
    if (fs.existsSync(LOG_FILE)) {
      logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8') || '[]');
    }
  } catch (e) {
    logs = [];
  }

  logs.push({ name, timestamp });
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));

  res.json({ ok: true });
});

// Pagina admin
app.get('/admin', (req, res) => {
  let logs = [];
  try {
    if (fs.existsSync(LOG_FILE)) {
      logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8') || '[]');
    }
  } catch (e) {
    logs = [];
  }

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Log Capodanno</title>
      <style>
        body{font-family:sans-serif;max-width:800px;margin:50px auto;padding:20px;background:#f5f5f5;}
        h1{color:#ff6b6b;}
        ul{list-style:none;padding:0;}
        li{padding:10px;background:white;margin:5px 0;border-radius:5px;box-shadow:0 2px 5px rgba(0,0,0,0.1);}
      </style>
    </head>
    <body>
      <h1>📋 Log Nomi Inseriti</h1>
      <p><a href="/">← Torna alla pagina principale</a></p>
      <ul>`;

  logs.forEach(entry => {
    html += `<li>${entry.name} <small>(${new Date(entry.timestamp).toLocaleString('it-IT')})</small></li>`;
  });

  html += `</ul><p>Totale: ${logs.length} invii</p></body></html>`;

  res.send(html);
});

// Avvio server
app.listen(PORT, () => {
  console.log(`Server attivo sulla porta ${PORT}`);
});
