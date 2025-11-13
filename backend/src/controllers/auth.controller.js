const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth.middleware');

async function register(req, res) {
  try {
    const { email, password, name, military_id, rank, role } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const user = await User.create({ email, password, name, military_id, rank, role });
    
    return res.status(201).json({ 
      message: 'User created successfully', 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        military_id: user.military_id,
        rank: user.rank,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ error: 'Failed to register user' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await User.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name,
        military_id: user.military_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        military_id: user.military_id,
        rank: user.rank,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ error: 'Failed to login' });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    console.error('Me error', err);
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
}

module.exports = { register, login, me };
