export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'API key not configured' });
  }
  
  const { type, userAnswer, expected, message } = req.body;
  
  try {
    if (type === 'correct') {
      const prompt = `You are an English teacher. The student wrote: "${userAnswer}"\nExpected: "${expected}"\n\nProvide brief feedback in French (2-3 sentences).`;
      const response = await callMistral(apiKey, prompt);
      return res.json({ success: true, feedback: response });
    }
    
    if (type === 'chat') {
      const systemPrompt = `You are a friendly English teacher. Reply briefly in English (2-3 sentences). Then add "Feedback:" in French.`;
      const response = await callMistral(apiKey, message, systemPrompt);
      const parts = response.split('Feedback:');
      return res.json({ 
        success: true, 
        reply: parts[0].trim(),
        feedback: parts[1] ? parts[1].trim() : ''
      });
    }
    
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function callMistral(apiKey, prompt, systemPrompt = null) {
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });
  
  const response = await fetch('https://api.mistral.ai/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      max_tokens: 300,
      messages: messages
    })
  });
  
  if (!response.ok) throw new Error('Mistral API error');
  const data = await response.json();
  return data.content[0].text;
}
