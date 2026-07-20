import pg from 'pg';
const client = new pg.Client({
  connectionString: 'postgresql://postgres.irdptvondfbervonxphg:MgnXTHAiUoBugR3T@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
  connectionTimeoutMillis: 15000,
});
try {
  await client.connect();
  const r = await client.query("SELECT id, email, name, pro, created_at FROM users WHERE email LIKE '%teste%'");
  console.log(JSON.stringify(r.rows, null, 2));
  await client.end();
} catch (e) {
  console.error('ERRO:', e.message);
  process.exit(1);
}
