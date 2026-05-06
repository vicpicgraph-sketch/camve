import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL);

export default async function handler(req, res) {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token !== 'camve@2024') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing submission ID' });
    }

    // Delete submission from database
    await sql`
      DELETE FROM ContactSubmissions
      WHERE id = ${id};
    `;

    return res.status(200).json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
