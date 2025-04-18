const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 3000;
const SECRET = 'ims_secret_key';

app.use(cors());
app.use(bodyParser.json());

const DB_FILE = './inventory.json';
const USERS_FILE = './users.json'; // 🔐 User storage

// Middleware: Verify JWT
function authenticate(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Access denied. No token provided.');
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).send('Invalid token.');
  }
}

//  Signup route
app.post('/api/signup', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send('Email and password are required');

  let users = [];
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE));
  }

  const userExists = users.find(u => u.email === email);
  if (userExists) return res.status(409).send('User already exists');

  users.push({ email, password, role: 'viewer' });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  res.send('Signup successful');
});

// Secured Login route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).send('Email and password are required');

  let users = [];
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE));
  }

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).send('Invalid credentials');

  const token = jwt.sign({ email: user.email, role: user.role }, SECRET);
  res.json({ token });
});

// Get inventory items
app.get('/api/items', authenticate, (req, res) => {
  const data = JSON.parse(fs.readFileSync(DB_FILE));
  res.json(data);
});

// Add item (admin only)
app.post('/api/items', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
  const data = JSON.parse(fs.readFileSync(DB_FILE));
  data.push(req.body);
  fs.writeFileSync(DB_FILE, JSON.stringify(data));
  res.send('Item added');
});

// Update item (admin only)
app.put('/api/items/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
  const data = JSON.parse(fs.readFileSync(DB_FILE));
  data[req.params.id] = req.body;
  fs.writeFileSync(DB_FILE, JSON.stringify(data));
  res.send('Item updated');
});

// Delete item (admin only)
app.delete('/api/items/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
  const data = JSON.parse(fs.readFileSync(DB_FILE));
  data.splice(req.params.id, 1);
  fs.writeFileSync(DB_FILE, JSON.stringify(data));
  res.send('Item deleted');
});

app.listen(PORT, () => console.log(`IMS backend running on http://localhost:${PORT}`));
