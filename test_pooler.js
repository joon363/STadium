import pg from 'pg';

const { Client } = pg;
const hosts = [
  'aws-0-ap-northeast-2.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com'
];

async function testHost(host, port) {
  const connectionString = `postgresql://postgres.rfqaufojzfgviggogyop:postechstudent26@${host}:${port}/postgres`;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log(`🎉 SUCCESS CONNECTED TO HOST: ${host}:${port}`);
    await client.end();
    return true;
  } catch(e) {
    console.log(`FAILED Host: ${host}:${port} -> ${e.message}`);
    return false;
  }
}

async function main() {
  for (const h of hosts) {
    for (const p of [5432, 6543]) {
      const ok = await testHost(h, p);
      if (ok) return;
    }
  }
}

main();
