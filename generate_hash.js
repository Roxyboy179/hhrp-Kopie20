const bcrypt = require('bcryptjs');

// Passwort: Joellading1202
const password = 'Joellading1202';

bcrypt.hash(password, 10).then(hash => {
  console.log('\n=================================');
  console.log('Bcrypt Hash generiert:');
  console.log('=================================');
  console.log(hash);
  console.log('=================================\n');
  
  console.log('SQL zum Einfügen:');
  console.log('=================================');
  console.log(`
UPDATE admin_accounts 
SET password_hash = '${hash}'
WHERE mitarbeiter_nummer = 'MA-001';
  `);
  console.log('=================================\n');
});
