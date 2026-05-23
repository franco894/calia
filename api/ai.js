export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider, apiKey, prompt, imageData, enableSearch } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: 'API Key es requerida' });
  }

  try {
    if (provider === 'openai') {
      const messagesContent = imageData 
        ? [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageData}` } }
          ]
        : [{ type: 'text', text: prompt }];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: messagesContent }],
          response_format: { type: 'json_object' }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Error en OpenAI');
      return res.status(200).json({ text: data.choices[0].message.content });
    }

    if (provider === 'claude') {
      const messagesContent = imageData
        ? [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageData } },
            { type: 'text', text: prompt }
          ]
        : [{ type: 'text', text: prompt }];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          messages: [{ role: 'user', content: messagesContent }]
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Error en Claude');
      return res.status(200).json({ text: data.content[0].text });
    }

    // Default to Gemini
    const parts = imageData 
      ? [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: imageData } }
        ]
      : [{ text: prompt }];

    const reqBody = {
      contents: [{ parts }],
      generationConfig: { response_mime_type: 'application/json' }
    };

    if (enableSearch) {
      reqBody.tools = [{ google_search: {} }];
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Error en Gemini');
    return res.status(200).json({ text: data.candidates[0].content.parts[0].text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
