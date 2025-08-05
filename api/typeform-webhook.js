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
    
    // Map by position/index instead of field names
    if (answers[0]) fields.firstName = answers[0].text;
    if (answers[1]) fields.lastName = answers[1].text;
    if (answers[2]) fields.phone = answers[2].phone_number || answers[2].text;
    if (answers[3]) fields.email = answers[3].email;
    if (answers[4]) fields.isBahraini = answers[4].boolean;
    if (answers[5]) fields.role = answers[5].choice ? answers[5].choice.label : answers[5].text;
    if (answers[6]) fields.linkedin = answers[6].url || answers[6].text;
    if (answers[7]) fields.resume = answers[7].file_url;
    // Add portfolio if you have it at index 8
    if (answers[8]) fields.portfolio = answers[8].file_url;

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

    // Add other fields
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
    
    if (fields.linkedin && fields.linkedin !== 'unknown') {
      notionData.properties['linkedin link'] = { url: fields.linkedin };
    }
    
    if (fields.isBahraini !== undefined) {
      notionData.properties['Bahraini?'] = { checkbox: fields.isBahraini };
    }
    
    if (fields.role && fields.role !== 'unknown') {
      notionData.properties['role'] = { select: { name: fields.role } };
    }
    
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
      applicantName: fullName,
      notionPageId: notionResult.id 
    });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
