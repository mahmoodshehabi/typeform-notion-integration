// api/form2-webhook.js
// Final webhook for job application form (Form2)

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
    
    // Map by position/index based on debug results
    if (answers[0]) fields.name = answers[0].text; // Name
    if (answers[1]) fields.email = answers[1].email; // Email
    if (answers[2]) fields.phone = answers[2].phone_number || answers[2].text; // Phone
    if (answers[3]) fields.nationality = answers[3].choice ? answers[3].choice.label : answers[3].text; // Nationality
    if (answers[4]) fields.role = answers[4].choice ? answers[4].choice.label : answers[4].text; // Position/Role
    if (answers[5]) fields.experience = answers[5].choice ? answers[5].choice.label : answers[5].text; // Experience
    if (answers[6]) fields.linkedin = answers[6].url || answers[6].text; // LinkedIn
    if (answers[7]) fields.resume = answers[7].file_url; // CV/Resume
    if (answers[8]) fields.expectedSalary = answers[8].text; // Expected Salary
    if (answers[9]) fields.noticePeriod = answers[9].text; // Notice Period
    if (answers[10]) fields.whyJoin = answers[10].text; // Why join SVS
    if (answers[11]) fields.whatBring = answers[11].text; // What can you bring
    if (answers[12]) fields.howHear = answers[12].text; // How did you hear

    // Use name as the page title, or default to email if no name
    const pageTitle = fields.name || fields.email || 'New Application';

    const notionData = {
      parent: { database_id: process.env.NOTION_DATABASE_ID_FORM2 },
      properties: {}
    };

    // Add fields that exist in your database (based on screenshot)
    
    // Page title - assuming first column is the title
    notionData.properties['Name'] = {
      title: [{ text: { content: pageTitle } }]
    };

    if (fields.email) {
      notionData.properties['Email'] = { email: fields.email };
    }

    // Auto-add current date
    notionData.properties['Date'] = { date: { start: new Date().toISOString().split('T')[0] } };

    if (fields.phone) {
      notionData.properties['Phone'] = { phone_number: fields.phone };
    }

    if (fields.nationality) {
      notionData.properties['nationality'] = { 
        select: { name: fields.nationality }
      };
    }

    if (fields.role) {
      notionData.properties['Role'] = { 
        select: { name: fields.role }
      };
    }

    if (fields.experience) {
      notionData.properties['experience'] = { 
        select: { name: fields.experience }
      };
    }

    if (fields.linkedin && fields.linkedin !== 'unknown') {
      notionData.properties['Linkedin'] = { url: fields.linkedin };
    }

    if (fields.resume) {
      notionData.properties['Resume'] = { 
        files: [{ 
          name: "Resume",
          external: { url: fields.resume }
        }]
      };
    }

    // Portfolio - only add if you have a portfolio file upload in your form
    // if (fields.portfolio) {
    //   notionData.properties['Portfolio'] = { 
    //     files: [{ 
    //       name: "Portfolio",
    //       external: { url: fields.portfolio }
    //     }]
    //   };
    // }

    if (fields.expectedSalary) {
      notionData.properties['Expected salary'] = { 
        rich_text: [{ text: { content: fields.expectedSalary } }]
      };
    }

    if (fields.noticePeriod) {
      notionData.properties['notice period'] = { 
        rich_text: [{ text: { content: fields.noticePeriod } }]
      };
    }

    if (fields.howHear) {
      notionData.properties['How did you hear ...'] = { 
        rich_text: [{ text: { content: fields.howHear } }]
      };
    }

    if (fields.whyJoin) {
      notionData.properties['Why join SVS?'] = { 
        rich_text: [{ text: { content: fields.whyJoin } }]
      };
    }

    if (fields.whatBring) {
      notionData.properties['What can you bri...'] = { 
        rich_text: [{ text: { content: fields.whatBring } }]
      };
    }

    // Set default status
    notionData.properties['Status'] = { 
      select: { name: 'Applied' }
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
      console.error('Notion API Error:', errorText);
      return res.status(500).json({ 
        error: 'Failed to create Notion page', 
        details: errorText 
      });
    }

    const notionResult = await notionResponse.json();
    return res.status(200).json({ 
      success: true, 
      message: 'Job application submitted successfully!',
      applicantName: pageTitle,
      notionPageId: notionResult.id 
    });

  } catch (error) {
    console.error('Form2 Webhook Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
