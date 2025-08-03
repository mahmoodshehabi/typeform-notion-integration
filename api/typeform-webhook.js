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
    const fields = {};
    
    answers.forEach(answer => {
      const question = answer.field.ref || answer.field.title;
      
      if (question.toLowerCase().includes('first')) {
        fields.firstName = answer.text;
      } else if (question.toLowerCase().includes('last')) {
        fields.lastName = answer.text;
      } else if (question.toLowerCase().includes('phone')) {
        fields.phone = answer.phone_number || answer.text;
      } else if (question.toLowerCase().includes('email')) {
        fields.email = answer.email;
      } else if (question.toLowerCase().includes('bahraini')) {
        fields.isBahraini = answer.boolean || (answer.choice && answer.choice.label.toLowerCase() === 'yes');
      } else if (question.toLowerCase().includes('role')) {
        fields.role = answer.choice ? answer.choice.label : answer.text;
      } else if (question.toLowerCase().includes('linkedin')) {
        fields.linkedin = answer.url || answer.text;
      } else if (question.toLowerCase().includes('resume') || question.toLowerCase().includes('cv')) {
        fields.resume = answer.file_url;
      } else if (question.toLowerCase().includes('portfolio')) {
        fields.portfolio = answer.file_url;
      }
    });

    const fullName = `${fields.firstName || ''} ${fields.lastName || ''}`.trim();

    const notionData = {
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        'Name': {
          title: [{ text: { content: fullName || 'New Application' } }]
        },
        'first name': {
          rich_text: [{ text: { content: fields.firstName || '' } }]
        },
        'last name': {
          rich_text: [{ text: { content: fields.lastName || '' } }]
        },
        'email': {
          email: fields.email || null
        },
        'phone': {
          phone_number: fields.phone || null
        },
        'linkedin link': {
          url: fields.linkedin || null
        },
        'Bahraini?': {
          checkbox: fields.isBahraini || false
        },
        'role': {
          select: fields.role ? { name: fields.role } : null
        },
        'CV': {
          url: fields.resume || null
        },
        'Portfolio': {
          url: fields.portfolio || null
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
      return res.status(500).json({ error: 'Failed to create Notion page', details: errorText });
    }

    const notionResult = await notionResponse.json();
    return res.status(200).json({ success: true, notionPageId: notionResult.id });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}