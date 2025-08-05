export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { form_response } = req.body;
    
    if (!form_response) {
      return res.status(400).json({ error: 'No form response data' });
    }

    const answers = form_response.answers;
    
    // DEBUG: Log all the field info
    console.log('=== FORM FIELDS DEBUG ===');
    const fieldInfo = [];
    
    answers.forEach((answer, index) => {
      const fieldData = {
        index: index,
        field_ref: answer.field?.ref,
        field_title: answer.field?.title,
        field_type: answer.field?.type,
        answer_value: answer.text || answer.email || answer.phone_number || answer.choice?.label || answer.boolean || answer.file_url || 'unknown'
      };
      
      fieldInfo.push(fieldData);
      console.log(`Field ${index + 1}:`, fieldData);
    });

    // Create a basic entry with debug info
    const notionData = {
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        'Name': {
          title: [{ text: { content: 'Debug Entry - ' + new Date().toISOString() } }]
        },
        'Status': {
          select: { name: 'Applied' }
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
      return res.status(500).json({ error: 'Failed to create Notion page', details: errorText });
    }

    const notionResult = await notionResponse.json();
    return res.status(200).json({ 
      success: true, 
      message: 'Debug entry created!',
      notionPageId: notionResult.id,
      debug: {
        totalFields: answers.length,
        fields: fieldInfo
      }
    });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
