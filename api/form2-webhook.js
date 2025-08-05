// api/form2-webhook.js
// Debug version to map field positions for the second form

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
    
    // DEBUG: Log all the field info for the second form
    console.log('=== FORM2 FIELDS DEBUG ===');
    const fieldInfo = [];
    
    answers.forEach((answer, index) => {
      const fieldData = {
        index: index,
        field_ref: answer.field?.ref,
        field_title: answer.field?.title,
        field_type: answer.field?.type,
        answer_value: answer.text || answer.email || answer.phone_number || answer.choice?.label || answer.boolean || answer.file_url || answer.number || 'unknown'
      };
      
      fieldInfo.push(fieldData);
      console.log(`Field ${index + 1}:`, fieldData);
    });

    // Return debug info without creating Notion entry yet
    return res.status(200).json({ 
      success: true, 
      message: 'Form2 debug - field mapping complete!',
      form_type: 'job_application_form2',
      debug: {
        totalFields: answers.length,
        fields: fieldInfo
      }
    });

  } catch (error) {
    console.error('Form2 Debug Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
