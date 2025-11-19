# AI Auto-Fill Setup Guide

## Overview

This application uses **GPT-5** via Insforge AI Integration to automatically parse and fill company information from unstructured text.

## Features

- ✨ **GPT-5 Powered**: Uses the latest GPT-5 model via Insforge
- 🚀 **No API Key Required**: Integrated directly with your Insforge backend
- 🌐 **Web Search Capable**: Can optionally fetch website content for better parsing
- 🎯 **Smart Extraction**: Automatically extracts company name, description, location, industry, team size, and founder information

## How It Works

1. **User Input**: Users paste company information (from website, pitch deck, LinkedIn, etc.) into the AI panel
2. **GPT-5 Processing**: The text is sent to GPT-5 via Insforge AI Integration API
3. **Auto-Fill**: Extracted data automatically populates the form fields

## Technical Details

### Insforge AI Integration

The application uses Insforge's built-in AI integration which provides:
- Direct access to GPT-5 (`openai/gpt-5` model)
- Automatic authentication and token management
- Cost-effective API calls through Insforge infrastructure

### Code Structure

**File**: `src/services/aiService.js`
```javascript
import client from '../lib/insforge';

// Call GPT-5 via Insforge AI
const completion = await client.ai.chat.completions.create({
  model: 'openai/gpt-5',
  messages: [...],
  temperature: 0.2,
  maxTokens: 1000
});
```

### Available Models

Check available models on your Insforge backend:
```javascript
const metadata = await client.getBackendMetadata();
console.log(metadata.aiIntegration.models);
```

Currently supported:
- `openai/gpt-5` - Latest GPT-5 model (text + image input)
- `openai/gpt-4o` - GPT-4o model (text + image input)
- `google/gemini-2.5-flash-image-preview` - Gemini image generation

## Configuration

### 1. Insforge Setup

Your Insforge backend is already configured with:
- Base URL: `https://7ratu4x5.us-east.insforge.app`
- Anon Key: Automatically managed by SDK
- AI Integration: Enabled with GPT-5 access

### 2. Authentication

The application uses the Insforge anonymous token for AI calls, which is automatically handled by the SDK.

**File**: `src/lib/insforge.js`
```javascript
import { createClient } from '@insforge/sdk';

const client = createClient({
  baseUrl: 'https://7ratu4x5.us-east.insforge.app',
  anonKey: 'your-anon-key' // Automatically included in AI requests
});
```

## Usage

### Basic Usage

```javascript
import { aiService } from './services/aiService';

const parsedData = await aiService.parseCompanyInfo(
  "Instacart is a grocery delivery service founded in 2012..."
);
```

### With Website Search

```javascript
const parsedData = await aiService.parseWithWebSearch(
  "Check out our startup at https://example.com",
  "https://example.com"
);
```

## Troubleshooting

### Authentication Error (401)

If you see a 401 error, regenerate your anon key:

```bash
# Using Insforge MCP tool
mcp_insforge_get-anon-key
```

Then update `src/lib/insforge.js` with the new token.

### AI Not Responding

1. Check Insforge backend status
2. Verify AI integration is enabled in your Insforge project
3. Check console for detailed error messages

### Rate Limits

Insforge AI Integration includes rate limiting. If you hit limits:
- Wait a few seconds before retrying
- Consider caching results
- Contact Insforge support for higher limits

## Cost Optimization

- **Use appropriate models**: GPT-5 for complex parsing, GPT-4o for simpler tasks
- **Limit context**: The service automatically limits website content to 2000 characters
- **Set max tokens**: Default is 1000 tokens for responses
- **Cache results**: Consider caching parsed results for common queries

## Future Enhancements

- [ ] Support for image-based company info extraction (logos, screenshots)
- [ ] Batch processing for multiple companies
- [ ] Custom extraction rules per industry
- [ ] Integration with web scraping APIs for enhanced data
- [ ] Streaming responses for real-time feedback

## Support

For issues with:
- **Insforge AI Integration**: [Insforge Documentation](https://docs.insforge.com)
- **GPT-5 API**: Contact Insforge support
- **Application bugs**: Check GitHub issues or create a new one

## License

This AI integration follows your application's license terms and Insforge's service agreement.
