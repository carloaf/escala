require('dotenv').config();
const User = require('./src/models/User');

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    const adminData = {
      email: 'admin@escala.mil.br',
      password: 'admin123',
      name: 'Administrador',
      military_id: 'ADM001',
      rank: 'Comandante',
      role: 'admin'
    };
    
    // Check if admin already exists
    const existing = await User.findByEmail(adminData.email);
    if (existing) {
      console.log('Admin user already exists');
      return;
    }
    
    const admin = await User.create(adminData);
    console.log('Admin user created successfully:');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: admin123`);
    console.log(`  Role: ${admin.role}`);
    console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');
    
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin user:', err);
    process.exit(1);
  }
}

createAdminUser();
