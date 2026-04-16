export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'API key not configured' });
  }
  
  try {
    const { type, message, userAnswer, expected } = req.body;
    
    if (type === 'chat') {
      if (!message) {
        return res.status(400).json({ success: false, error: 'Message required' });
      }
      
      const systemPrompt = 'You are a friendly English teacher. Reply in simple English (2-3 sentences max).';
      const userPrompt = `Student: "${message}"\n\nReply in English only.`;
      
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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });
      
      if (!response.ok) {
        return res.status(500).json({ success: false, error: 'Mistral error' });
      }
      
      const data = await response.json();
      const reply = data.content[0]?.text || 'No response';
      
      return res.json({ 
        success: true, 
        reply: reply.trim(),
        feedback: '✓ Good!'
      });
    }
    
    if (type === 'correct') {
      if (!userAnswer || !expected) {
        return res.status(400).json({ success: false, error: 'Answer required' });
      }
      
      const prompt = `User wrote: "${userAnswer}"\nCorrect: "${expected}"\n\nBrief feedback in French.`;
      
      const response = await fetch('https://api.mistral.ai/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          max_tokens: 150,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      
      if (!response.ok) {
        return res.status(500).json({ success: false, error: 'Mistral error' });
      }
      
      const data = await response.json();
      const feedback = data.content[0]?.text || 'No feedback';
      
      return res.json({ 
        success: true, 
        feedback: feedback.trim()
      });
    }
    
    return res.status(400).json({ success: false, error: 'Invalid type' });
    
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
