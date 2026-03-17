const User = require('../models/User');
const { normalizePersonName } = require('../utils/personNameNormalizer');
const { normalizeRank } = require('../utils/rankNormalizer');

const ALLOWED_ROLES = ['user', 'manager', 'admin'];

async function listUsers(req, res) {
  try {
    const users = await User.all();
    return res.json(users);
  } catch (err) {
    console.error('List users error', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

async function getUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    console.error('Get user error', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}

async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}

async function updateUser(req, res) {
  try {
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!req.body.email || !req.body.war_name || !req.body.full_name) {
      return res.status(400).json({ error: 'Email, nome de guerra e nome completo são obrigatórios' });
    }

    if (!req.body.military_id || req.body.military_id.length !== 10 || !/^\d{10}$/.test(req.body.military_id)) {
      return res.status(400).json({ error: 'Military ID must be exactly 10 digits' });
    }

    if (req.body.role && !ALLOWED_ROLES.includes(req.body.role)) {
      return res.status(400).json({ error: 'Perfil de usuário inválido' });
    }

    const payload = {
      email: req.body.email,
      war_name: normalizePersonName(req.body.war_name),
      full_name: normalizePersonName(req.body.full_name),
      military_id: req.body.military_id,
      rank: normalizeRank(req.body.rank),
      organization: req.body.organization,
      company: req.body.company,
      phone: req.body.phone,
      role: req.body.role,
      is_active: req.body.is_active !== false,
      password: req.body.password ? String(req.body.password) : undefined
    };

    const updatedUser = await User.update(req.params.id, payload);
    return res.json(updatedUser);
  } catch (err) {
    console.error('Update user error', err);
    return res.status(500).json({ error: 'Failed to update user' });
  }
}

async function updateUserStatus(req, res) {
  try {
    const targetId = Number(req.params.id);
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active deve ser booleano' });
    }

    if (req.user.id === targetId && is_active === false) {
      return res.status(400).json({ error: 'O administrador não pode desativar a própria conta' });
    }

    const updatedUser = await User.updateActiveStatus(targetId, is_active);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(updatedUser);
  } catch (err) {
    console.error('Update user status error', err);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
}

module.exports = { listUsers, getUser, getMe, updateUser, updateUserStatus };
