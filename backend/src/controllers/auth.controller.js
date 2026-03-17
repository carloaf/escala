const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth.middleware');
const { normalizePersonName } = require('../utils/personNameNormalizer');
const { normalizeRank } = require('../utils/rankNormalizer');

async function register(req, res) {
  try {
    const { 
      email, password, war_name, full_name, military_id, 
      rank, organization, company, phone, role,
      name // compatibilidade com código antigo
    } = req.body;
    
    const warName = normalizePersonName(war_name || name);
    const fullName = normalizePersonName(full_name || war_name || name);
    const normalizedRank = normalizeRank(rank);
    
    if (!email || !password || !warName) {
      return res.status(400).json({ error: 'Email, password and war_name are required' });
    }

    if (!military_id || military_id.length !== 10 || !/^\d{10}$/.test(military_id)) {
      return res.status(400).json({ error: 'Military ID must be exactly 10 digits' });
    }

    if (!organization) {
      return res.status(400).json({ error: 'Organization (OM) is required' });
    }

    if (!company) {
      return res.status(400).json({ error: 'Company (Cia) is required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const user = await User.create({ 
      email, password, war_name: warName, full_name: fullName,
      military_id, rank: normalizedRank, organization, company, phone, role: 'user' 
    });
    
    return res.status(201).json({ 
      message: 'User created successfully', 
      user: {
        id: user.id,
        email: user.email,
        war_name: user.war_name,
        full_name: user.full_name,
        military_id: user.military_id,
        rank: user.rank,
        organization: user.organization,
        company: user.company,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ error: 'Failed to register user', details: err.message });
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

    if (user.is_active === false) {
      return res.status(403).json({ error: 'User is inactive. Contact an administrator.' });
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
        name: user.war_name, // para compatibilidade
        war_name: user.war_name,
        rank: user.rank,
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
        war_name: user.war_name,
        full_name: user.full_name,
        military_id: user.military_id,
        rank: user.rank,
        organization: user.organization,
        company: user.company,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active
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
