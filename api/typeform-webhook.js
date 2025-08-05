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
    
    // Map Typeform answers to fields
    answers.forEach(answer => {
      const question = answer.field.ref || answer.field.title || '';
      const questionLower = question.toLowerCase();
      
      if (questionLower.includes('first')) {
        fields.firstName = answer.text;
      } else if (questionLower.includes('last')) {
        fields.lastName = answer.text;
      } else if (questionLower.includes('phone')) {
        fields.phone = answer.phone_number || answer.text;
      } else if (questionLower.includes('email')) {
        fields.email = answer.email;
      } else if (questionLower.includes('bahraini')) {
        fields.isBahraini = answer.boolean || (answer.choice && answer.choice.label.toLowerCase() === 'yes');
      } else if (questionLower.includes('role')) {
        fields.role = answer.choice ? answer.choice.label : answer.text;
      } else if (questionLower.includes('linkedin')) {
        fields.linkedin = answer.url || answer.text;
      } else if (questionLower.includes('resume') || questionLower.includes('cv')) {
        fields.resume = answer.file_url;
      } else if (questionLower.includes('portfolio')) {
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
        'Status': {
          select: { name: 'Applied' }
        }
      }
    };

    // Add other fields if they exist
    if (fields.firstName) {
      notionData.properties['first name'] = {
        rich_text: [{ text: { content: fields.firstName } }]
      };
    }
    
    if (fields.lastName) {
      notionData.properties['last name'] = {
        rich_text: [{ text: { content: fields.lastName } }]
      };
    }
    
    if (fields.email) {
      notionData.properties['email'] = { email: fields.email };
    }
    
    if (fields.phone) {
      notionData.properties['phone'] = { phone_number: fields.phone };
    }
    
    if (fields.linkedin) {
      notionData.properties['linkedin link'] = { url: fields.linkedin };
    }
    
    if (fields.isBahraini !== undefined) {
      notionData.properties['Bahraini?'] = { checkbox: fields.isBahraini };
    }
    
    if (fields.role) {
      notionData.properties['role'] = { select: { name: fields.role } };
    }
    
    // Handle file attachments
    if (fields.resume) {
      notionData.properties['CV'] = { 
        files: [{ 
          name: "Resume",
          external: { url: fields.resume }
        }]
      };
    }
    
    if (fields.portfolio) {
      notionData.properties['Portfolio'] = { 
        files: [{ 
          name: "Portfolio",
          external: { url: fields.portfolio }
        }]
      };
    }

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
      message: 'Application submitted successfully!',
      notionPageId: notionResult.id 
    });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
