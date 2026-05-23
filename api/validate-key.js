export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider, apiKey } = req.body;
  if (!provider || !apiKey) {
    return res.status(400).json({ error: 'Provider y API Key son requeridos' });
  }

  try {
    if (provider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with exactly: OK' }] }],
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        return res.status(200).json({ valid: false, error: data.error?.message || 'API Key inválida' });
      }
      return res.status(200).json({ valid: true, provider: 'gemini' });
    }

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (!response.ok) {
        const data = await response.json();
        return res.status(200).json({ valid: false, error: data.error?.message || 'API Key inválida' });
      }
      return res.status(200).json({ valid: true, provider: 'openai' });
    }

    if (provider === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Say OK' }],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        return res.status(200).json({ valid: false, error: data.error?.message || 'API Key inválida' });
      }
      return res.status(200).json({ valid: true, provider: 'claude' });
    }

    return res.status(200).json({ valid: false, error: 'Proveedor no soportado' });
  } catch (err) {
    return res.status(200).json({ valid: false, error: err.message });
  }
}
