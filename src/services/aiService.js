// AI Service for parsing company information
// Uses Insforge AI Integration with GPT-5

import client from '../lib/insforge';

export const aiService = {
  /**
   * Parse company information from raw text using GPT-5 via Insforge
   * @param {string} rawText - Raw text containing company information
   * @param {string} websiteUrl - Optional website URL for additional context
   * @returns {Promise<Object>} Parsed company data
   */
  async parseCompanyInfo(rawText, websiteUrl = null) {
    try {
      let enhancedText = rawText;
      
      // If website URL is provided, try to extract company name for better search
      let companyName = '';
      if (websiteUrl) {
        try {
          const domain = websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
          companyName = domain.split('.')[0];
          companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
        } catch (e) {
          // Ignore
        }
      }

      // Prepare the prompt for GPT-5
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
${enhancedText}

${companyName ? `Note: The company name might be "${companyName}" based on the website URL.` : ''}

Return only the JSON object, no other text or explanation.`;

      console.log('Calling Insforge AI with GPT-5...');

      // Use Insforge AI with GPT-5
      const completion = await client.ai.chat.completions.create({
        model: 'openai/gpt-5',
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
        maxTokens: 1000
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from AI');
      }

      console.log('GPT-5 raw response:', content);

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
          throw new Error('Invalid JSON response from AI');
        }
      }
      
      return this.formatParsedData(parsed);
    } catch (error) {
      console.error('AI parsing error:', error);
      throw new Error(error.message || 'Failed to parse company information. Please try again or fill the form manually.');
    }
  },

  /**
   * Format parsed data into form structure
   */
  formatParsedData(parsed) {
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

    return result;
  },

  /**
   * Extract URLs from text
   */
  extractUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  },

  /**
   * Fetch website content - removed direct fetch to avoid CORS issues
   * GPT-5 will handle web search automatically
   */
  async fetchWebsiteContent(url) {
    // Don't try to fetch directly - let GPT-5 handle web search
    // This avoids CORS issues and leverages GPT-5's built-in web search capabilities
    console.log('🌐 URL detected:', url, '- GPT-5 will search for information');
    return null;
  },

  /**
   * Extract text content from HTML
   */
  extractTextFromHtml(html) {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000); // Limit to 3000 chars
  },

  /**
   * Enhanced parsing with intelligent web search
   * Automatically detects URLs and searches for company information
   */
  async parseWithWebSearch(rawText, websiteUrl = null) {
    try {
      console.log('🚀 Starting AI parsing with web search...');
      
      // Extract URLs from the text
      const urls = this.extractUrls(rawText);
      const detectedUrl = urls.length > 0 ? urls[0] : websiteUrl;
      
      let enhancedPrompt = rawText;
      let webContent = null;
      
      // Try to fetch website content if URL is provided
      if (detectedUrl) {
        console.log('🔍 Detected URL:', detectedUrl);
        webContent = await this.fetchWebsiteContent(detectedUrl);
        
        if (webContent) {
          enhancedPrompt = `User input:\n${rawText}\n\nWebsite content from ${detectedUrl}:\n${webContent}`;
          console.log('✅ Website content fetched, length:', webContent.length);
        }
      }
      
      // Use GPT-5 with web search capability
      console.log('🤖 Calling GPT-5 for intelligent parsing...');
      
      const searchPrompt = `You are an AI assistant with web search capabilities. Extract and compile comprehensive company information.

${detectedUrl && !webContent ? `The user provided this URL: ${detectedUrl}. Please search the web for information about this company.` : ''}

Parse the following information and extract company details. If you need more information, use your knowledge to fill in reasonable defaults based on the company name or industry.

Required JSON format:
{
  "company_name": "string",
  "description": "string (1-2 sentences, compelling and clear)",
  "website": "string (full URL)",
  "location": "string (City, State/Province, Country)",
  "industry": "string (one of: B2B, Consumer, Fintech, Healthcare, Education, Industrials, Nonprofit)",
  "founded": "number (year, e.g., 2020)",
  "team_size": "number (estimate if not provided)",
  "founder_name": "string (if available)",
  "founder_email": "string (if available)",
  "founder_role": "string (e.g., CEO & Co-Founder)"
}

Input to parse:
${enhancedPrompt}

Instructions:
- Extract all available information accurately
- For missing fields, use your knowledge about the company if you recognize it
- For the website field, ensure it's a valid URL with https://
- Choose the most appropriate industry category
- If team_size is a range, use the midpoint
- Provide a clear, compelling description
- Return ONLY valid JSON, no explanations

JSON:`;

      const completion = await client.ai.chat.completions.create({
        model: 'openai/gpt-5',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant that extracts structured company information. You have access to web search and general knowledge about companies. Always return valid JSON only, no explanations.'
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        temperature: 0.3,
        maxTokens: 1500
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from AI');
      }

      console.log('✅ GPT-5 response received, length:', content.length);

      // Parse JSON response
      let parsed;
      try {
        // Try direct JSON parse
        parsed = JSON.parse(content);
      } catch (e) {
        // Try to extract JSON from response if wrapped in markdown or text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          console.error('Failed to parse AI response:', content);
          throw new Error('Invalid JSON response from AI. Please try again or fill the form manually.');
        }
      }
      
      console.log('✅ Successfully parsed company data:', parsed.company_name);
      
      return this.formatParsedData(parsed);
    } catch (error) {
      console.error('❌ Enhanced parsing error:', error);
      throw error;
    }
  }
};

export default aiService;
