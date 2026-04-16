export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'No API key' });
  
  try {
    const { type, message, userAnswer, expected } = req.body;
    
    if (type === 'chat' && message) {
      const response = await fetch('https://api.mistral.ai/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          max_tokens: 200,
          messages: [
            { role: 'user', content: `Reply briefly in English: ${message}` }
          ]
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(500).json({ success: false, error: 'Mistral API failed' });
      }
      
      const reply = data.content?.[0]?.text || 'No response';
      return res.json({ success: true, reply: reply.trim(), feedback: '✓' });
    }
    
    if (type === 'correct' && userAnswer && expected) {
      const response = await fetch('https://api.mistral.ai/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          max_tokens: 150,
          messages: [
            { role: 'user', content: `User wrote "${userAnswer}", correct is "${expected}". Brief feedback in French.` }
          ]
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(500).json({ success: false, error: 'Mistral API failed' });
      }
      
      const feedback = data.content?.[0]?.text || 'Good!';
      return res.json({ success: true, feedback: feedback.trim() });
    }
    
    return res.status(400).json({ success: false, error: 'Invalid request' });
    
  } catch (e) {
    console.error('Error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
}
