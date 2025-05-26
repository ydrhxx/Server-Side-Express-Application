const knex = require('../db/knex');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

exports.register = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: true, message: "Email and password required." });

  // Check if user already exists
  const user = await knex('users').where({ email }).first();
  if (user)
    return res.status(400).json({ error: true, message: "User already exists." });

  // Hash password
  const hash = await bcrypt.hash(password, 10);

  // Insert user
  await knex('users').insert({ email, password: hash });

  res.status(201).json({ email });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: true, message: "Email and password required." });

  const user = await knex('users').where({ email }).first();
  if (!user)
    return res.status(401).json({ error: true, message: "Invalid credentials." });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return res.status(401).json({ error: true, message: "Invalid credentials." });

  // Create JWT
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '10m' });

  res.json({ token });
};
