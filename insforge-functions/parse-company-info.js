// Insforge Edge Function: Parse Company Information using GPT-4o
// Deploy this function to Insforge and set VITE_INSFORGE_AI_ENDPOINT to the function URL

module.exports = async function(request) {
  try {
    const { text, website_url, model = 'gpt-4o' } = await request.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare the prompt for GPT-4o
    const prompt = `You are a helpful assistant that extracts structured company information from text. 
Parse the following text and extract company details. Return ONLY a valid JSON object with these fields:
{
  "company_name": "string",
  "description": "string (brief description, 1-2 sentences)",
  "website": "string (full URL if found)",
  "location": "string (city, state/province, country format)",
  "industry": "string (must be one of: B2B, Consumer, Fintech, Healthcare, Education, Industrials, Nonprofit)",
  "founded": "number (year only, e.g., 2020)",
  "team_size": "number (approximate if range given)",
  "founder_name": "string (full name)",
  "founder_email": "string (email address)",
  "founder_role": "string (e.g., CEO & Co-Founder)"
}

Rules:
- If a field cannot be determined from the text, use null or empty string
- Be accurate and only extract information that is clearly stated
- For industry, choose the closest match from the allowed values
- For team_size, if a range is given (e.g., "10-50"), use the midpoint or lower bound
- Extract website URL if mentioned, even if partial (add https:// if needed)

Text to parse:
${text}

Return only the JSON object, no other text or explanation.`;

    // Call OpenAI API (using latest model)
    // Note: Set OPENAI_API_KEY in your Insforge environment variables
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use latest available model (gpt-4o-2024-08-06 or fallback to gpt-4o)
    const modelToUse = model === 'gpt-4o' ? 'gpt-4o-2024-08-06' : model;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that extracts structured company information from text. Always return valid JSON only, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: `AI API error: ${errorData.error?.message || response.statusText}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from response if wrapped in markdown
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON response from AI' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Format and return the parsed data
    const result = {
      company_name: parsed.company_name || '',
      description: parsed.description || '',
      website: parsed.website || '',
      location: parsed.location || '',
      industry: parsed.industry || '',
      founded: parsed.founded ? String(parsed.founded) : '',
      team_size: parsed.team_size ? String(parsed.team_size) : '',
      founder_name: parsed.founder_name || '',
      founder_email: parsed.founder_email || '',
      founder_role: parsed.founder_role || ''
    };

    // Normalize website URL
    if (result.website && !result.website.startsWith('http')) {
      result.website = 'https://' + result.website;
    }

    return new Response(
      JSON.stringify({ parsed: result }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        } 
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

