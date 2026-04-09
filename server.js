const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const DATA_DIR = path.join(__dirname, 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const BUILD_DIR = path.join(__dirname, 'build');

// Ensure data directory and submissions file exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(SUBMISSIONS_FILE)) fs.writeFileSync(SUBMISSIONS_FILE, '[]');

app.use(cors());
app.use(express.json());

// Serve React production build if available
if (fs.existsSync(BUILD_DIR)) {
  app.use(express.static(BUILD_DIR));
}

// POST /api/sessions — save a session result
app.post('/api/sessions', (req, res) => {
  try {
    const session = req.body;
    const raw = fs.readFileSync(SUBMISSIONS_FILE, 'utf8');
    const sessions = JSON.parse(raw);
    sessions.push(session);
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(sessions, null, 2));
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Failed to save session:', err);
    res.status(500).json({ ok: false });
  }
});

// GET /api/sessions — retrieve all sessions
app.get('/api/sessions', (req, res) => {
  try {
    const raw = fs.readFileSync(SUBMISSIONS_FILE, 'utf8');
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: 'Could not read submissions' });
  }
});

// Fall through to React app for all other routes (SPA support)
if (fs.existsSync(BUILD_DIR)) {
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(BUILD_DIR, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Submissions stored at: ${SUBMISSIONS_FILE}`);
  if (fs.existsSync(BUILD_DIR)) {
    console.log('Serving React build from:', BUILD_DIR);
  } else {
    console.log('No build/ found — API only mode');
  }
});
