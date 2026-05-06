import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Only allow PATCH requests
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token !== 'camve@2024') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update submission status
    await sql`
      UPDATE ContactSubmissions
      SET status = ${status}
      WHERE id = ${id};
    `;

    return res.status(200).json({
      success: true,
      message: 'Submission updated successfully'
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
