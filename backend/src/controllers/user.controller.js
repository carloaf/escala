const User = require('../models/User');

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

module.exports = { listUsers, getUser };
