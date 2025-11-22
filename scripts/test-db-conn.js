// Simple DB connection test using `pg` and dotenv
import('dotenv').then(({default: dotenv}) => dotenv.config()).then(() => {
  const { Client } = require('pg');
  const dbUrl = process.env.DATABASE_URL;
  console.log('Using DATABASE_URL:', dbUrl?.replace(/:[^:]+@/, ':*****@'));
  const client = new Client({ connectionString: dbUrl });
  client.connect()
    .then(() => client.query('SELECT version()'))
    .then(res => {
      console.log('Connected to Postgres, version:', res.rows[0].version);
      return client.end();
    })
    .catch(err => {
      console.error('DB connection error:');
      console.error(err && err.message ? err.message : err);
      process.exitCode = 1;
    });
}).catch(err => { console.error('Failed to load dotenv:', err); process.exitCode = 1; });
