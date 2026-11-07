const { Client } = require('pg');
require('dotenv').config();

async function clearDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to database successfully.');

    // Get all tables in public schema except _prisma_migrations
    const { rows: tables } = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename != '_prisma_migrations'
      ORDER BY tablename;
    `);

    if (tables.length === 0) {
      console.log('No user tables found in public schema.');
      return;
    }

    console.log(`Found ${tables.length} tables to truncate.`);

    // Check counts before truncation
    console.log('\n--- Record counts before truncation ---');
    let totalRecordsBefore = 0;
    for (const { tablename } of tables) {
      const countRes = await client.query(`SELECT COUNT(*) AS count FROM "${tablename}";`);
      const count = parseInt(countRes.rows[0].count, 10);
      totalRecordsBefore += count;
      if (count > 0) {
        console.log(` - ${tablename}: ${count} records`);
      }
    }
    console.log(`Total records across all tables before truncation: ${totalRecordsBefore}`);

    if (totalRecordsBefore === 0) {
      console.log('All tables are already empty.');
      return;
    }

    // Truncate all tables in one statement with RESTART IDENTITY CASCADE
    const tableList = tables.map((t) => `"${t.tablename}"`).join(', ');
    console.log('\nTruncating tables...');
    await client.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
    console.log('Truncate completed successfully.');

    // Verify counts after truncation
    let totalRecordsAfter = 0;
    for (const { tablename } of tables) {
      const countRes = await client.query(`SELECT COUNT(*) AS count FROM "${tablename}";`);
      const count = parseInt(countRes.rows[0].count, 10);
      totalRecordsAfter += count;
    }
    console.log(`Total records after truncation: ${totalRecordsAfter}`);
    if (totalRecordsAfter === 0) {
      console.log('Database successfully cleared! All records removed, schema and migrations preserved.');
    } else {
      console.warn('Warning: Some records might still remain.');
    }
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

clearDatabase();

