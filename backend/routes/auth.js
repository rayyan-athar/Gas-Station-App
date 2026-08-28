const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_change_me';
const SALT_ROUNDS = 10;

module.exports = function (db) {
  const router = express.Router();

  router.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    if (username.length < 3) return res.status(400).json({ error: 'username must be at least 3 chars' });
    if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 chars' });

    const password_hash = bcrypt.hashSync(password, SALT_ROUNDS);
    db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, password_hash], function (err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'username already exists' });
        return res.status(500).json({ error: err.message });
      }
      const token = jwt.sign({ user_id: this.lastID, username }, JWT_SECRET, { expiresIn: '2h' });
      res.status(201).json({ token });
    });
  });

  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = bcrypt.compareSync(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ user_id: user.user_id, username }, JWT_SECRET, { expiresIn: '2h' });
      res.json({ token });
    });
  });

  return router;
};