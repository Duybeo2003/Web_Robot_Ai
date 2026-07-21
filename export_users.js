const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  const connection = await mysql.createConnection('mysql://root:root@127.0.0.1:3306/nutrition_hub_db');
  
  const [users] = await connection.execute('SELECT * FROM User');
  
  fs.writeFileSync('old_users.json', JSON.stringify({ users }, null, 2));
  console.log('Exported users successfully! Count:', users.length);
  await connection.end();
}

main().catch(console.error);
