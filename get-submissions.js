import { Pool } from '@neondatabase/serverless';
const pool = new Pool({ connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL });

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token !== 'camve@2024') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure table exists (handles Neon's separate production/preview branches)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ContactSubmissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        message TEXT,
        status VARCHAR(20) DEFAULT 'new',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Fetch all submissions from database
    const result = await pool.query(`
      SELECT id, name, email, phone, message, status, created_at
      FROM ContactSubmissions
      ORDER BY created_at DESC;
    `);

    return res.status(200).json({
      success: true,
      submissions: result.rows || []
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
