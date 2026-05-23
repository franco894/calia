export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider, apiKey } = req.body;
  if (!provider) {
    return res.status(400).json({ error: 'Provider es requerido' });
  }

  const resolveApiKey = (targetProvider, explicitKey = '') => {
    const trimmed = typeof explicitKey === 'string' ? explicitKey.trim() : '';
    if (trimmed) return trimmed;

    if (targetProvider === 'gemini') {
      return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    }
    if (targetProvider === 'openai') {
      return process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
    }
    if (targetProvider === 'claude') {
      return process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.VITE_CLAUDE_API_KEY || '';
    }
    return '';
  };

  const resolvedApiKey = resolveApiKey(provider, apiKey);
  if (!resolvedApiKey) {
    return res.status(200).json({ valid: false, error: 'No hay una API Key disponible para este proveedor' });
  }

  try {
    if (provider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${resolvedApiKey}`,
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
        headers: { 'Authorization': `Bearer ${resolvedApiKey}` },
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
          'x-api-key': resolvedApiKey,
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
