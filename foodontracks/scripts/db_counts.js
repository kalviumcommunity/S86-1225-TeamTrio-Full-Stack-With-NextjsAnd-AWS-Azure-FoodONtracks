const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function counts() {
  const tables = [
    'User','Address','Restaurant','MenuItem','DeliveryPerson','Order','OrderItem','OrderTracking','Payment','Review'
  ];
  for (const t of tables) {
    try {
      const res = await pool.query(`SELECT COUNT(*)::int AS c FROM "${t}"`);
      console.log(`${t}: ${res.rows[0].c}`);
    } catch (e) {
      console.log(`${t}: ERROR - ${e.message}`);
    }
  }
  await pool.end();
}

counts().catch(e=>{console.error(e);process.exit(1)});
