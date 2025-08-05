export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { form_response } = req.body;
    
    if (!form_response) {
      return res.status(400).json({ error: 'No form response data' });
    }

    // Simple test - create basic entry first
    const notionData = {
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        'Name': {
          title: [{ text: { content: 'Test Application - ' + new Date().toISOString() } }]
        },
        'Status': {
          select: { name: 'New Application' }
        }
      }
    };

    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(notionData)
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      return res.status(500).json({ 
        error: 'Failed to create Notion page',
        details: errorText 
      });
    }

    const notionResult = await notionResponse.json();
    return res.status(200).json({ 
      success: true, 
      message: 'Entry created in Notion!',
      notionPageId: notionResult.id 
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
