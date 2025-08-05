export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { form_response } = req.body;
    
    if (!form_response) {
      return res.status(400).json({ error: 'No form response data' });
    }

    // Try both database ID formats
    const databaseIdWithDashes = process.env.NOTION_DATABASE_ID;
    const databaseIdNoDashes = process.env.NOTION_DATABASE_ID.replace(/-/g, '');

    console.log('Trying with dashes:', databaseIdWithDashes);
    console.log('Trying without dashes:', databaseIdNoDashes);

    // Test data
    const notionData = {
      parent: { database_id: databaseIdWithDashes },
      properties: {
        'Name': {
          title: [{ text: { content: 'Test Entry - ' + new Date().toISOString() } }]
        }
      }
    };

    // First try with dashes
    let notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(notionData)
    });

    if (notionResponse.ok) {
      const result = await notionResponse.json();
      return res.status(200).json({ 
        success: true, 
        message: 'Worked with dashes!',
        format: 'with-dashes',
        notionPageId: result.id 
      });
    }

    // If that failed, try without dashes
    console.log('First attempt failed, trying without dashes...');
    notionData.parent.database_id = databaseIdNoDashes;

    notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(notionData)
    });

    if (notionResponse.ok) {
      const result = await notionResponse.json();
      return res.status(200).json({ 
        success: true, 
        message: 'Worked without dashes!',
        format: 'no-dashes',
        notionPageId: result.id 
      });
    }

    // Both failed
    const errorText = await notionResponse.text();
    return res.status(500).json({ 
      error: 'Both formats failed',
      withDashes: databaseIdWithDashes,
      withoutDashes: databaseIdNoDashes,
      lastError: errorText
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
