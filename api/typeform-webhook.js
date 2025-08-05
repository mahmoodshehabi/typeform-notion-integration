export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({ 
    success: true,
    message: "Webhook received!",
    timestamp: new Date().toISOString(),
    debug: {
      databaseId: process.env.NOTION_DATABASE_ID,
      hasApiKey: !!process.env.NOTION_API_KEY
    }
  });
}
