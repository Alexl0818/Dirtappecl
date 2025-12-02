import express from 'express';
import OpenAI from 'openai';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

app.post('/api/chat', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ error: 'OpenAI API key not configured. Please add your OPENAI_API_KEY.' });
    }
    
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const systemMessage = {
      role: 'system',
      content: `You are a helpful AI assistant for SoilConnect, a marketplace platform that connects soil buyers, sellers, and haulers. You can help users with:
- Finding soil materials (topsoil, structural fill, etc.)
- Understanding pricing and availability
- Questions about the buying/selling process
- Hauling logistics and scheduling
- General questions about soil types and their uses
Be friendly, professional, and concise in your responses.`
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [systemMessage, ...messages],
      max_completion_tokens: 1024,
    });

    res.json({ 
      message: response.choices[0].message.content,
      role: 'assistant'
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});
