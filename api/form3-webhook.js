// api/form3-webhook.js
// Debug version to map field positions for the third form

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
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Form3 debug - field mapping complete!',
      form_type: 'job_application_form3',
      debug: {
        totalFields: answers.length,
        fields: fieldInfo
      }
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
