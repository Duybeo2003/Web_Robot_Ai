const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  const connection = await mysql.createConnection('mysql://root:root@127.0.0.1:3306/nutrition_hub_db');
  
  const [categories] = await connection.execute('SELECT * FROM Category');
  const [products] = await connection.execute('SELECT * FROM Product');
  
  fs.writeFileSync('old_data.json', JSON.stringify({ categories, products }, null, 2));
  console.log('Exported data successfully!');
  await connection.end();
}

main().catch(console.error);
