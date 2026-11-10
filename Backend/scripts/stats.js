const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  const tables = [
    'User',
    'Faculty',
    'Major',
    'Skill',
    'Semester',
    'LecturerProfile',
    'CompanyProfile',
    'StudentProfile',
    'StudentSkill',
    'StudentProject',
    'StudentJobPreference',
    'InternshipTemplate',
    'Internship',
    'InternshipSkill',
    'InternshipMajor',
    'InternshipView',
    'InternshipReport',
    'Application',
    'ApplicationInterview',
    'EmailLog',
    'AiScanJob',
    'InternshipPlacement',
    'Supervision',
    'Report',
    'Evaluation',
    'Conversation',
    'Message',
    'Notification',
    'SupportRequest',
    'AuditLog',
    'File',
  ];

  console.log('--------------------------------------------------');
  console.log('| Table Name                  | Record Count     |');
  console.log('--------------------------------------------------');
  let total = 0;
  for (const t of tables) {
    const res = await client.query(`SELECT COUNT(*) AS count FROM "${t}";`);
    const count = parseInt(res.rows[0].count, 10);
    total += count;
    console.log(`| ${t.padEnd(27)} | ${count.toString().padStart(16)} |`);
  }
  console.log('--------------------------------------------------');
  console.log(`| TOTAL RECORDS               | ${total.toString().padStart(16)} |`);
  console.log('--------------------------------------------------');
  await client.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
