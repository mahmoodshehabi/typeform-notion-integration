export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Debug: Show what database ID we're using
    console.log('Environment Variables Check:');
    console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID);
    console.log('NOTION_API_KEY exists:', !!process.env.NOTION_API_KEY);
    
    const { form_response } = req.body;
    
    if (!form_response) {
      return res.status(400).json({ 
        error: 'No form response data',
        debug: {
          databaseId: process.env.NOTION_DATABASE_ID,
          hasApiKey: !!process.env.NOTION_API_KEY
        }
      });
    }

    // Simple test - just try to create a basic entry
    const notionData = {
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        'Name': {
          title: [{ text: { content: 'Test Entry - ' + new Date().toISOString() } }]
        }
      }
    };

    console.log('Attempting to create Notion page with database ID:', process.env.NOTION_DATABASE_ID);

    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(notionData)
    });
