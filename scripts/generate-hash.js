const bcrypt = require('bcryptjs');

async function generateHash() {
  const password1 = 'admin123';
  const password2 = 'password123';
  
  const hash1 = await bcrypt.hash(password1, 12);
  const hash2 = await bcrypt.hash(password2, 12);
  
  console.log('Password: admin123');
  console.log('Hash:', hash1);
  console.log('\nPassword: password123');
  console.log('Hash:', hash2);
  
  // Test the hashes
  const test1 = await bcrypt.compare(password1, hash1);
  const test2 = await bcrypt.compare(password2, hash2);
  
  console.log('\nVerification:');
  console.log('admin123 hash valid:', test1);
  console.log('password123 hash valid:', test2);
}

generateHash().catch(console.error);