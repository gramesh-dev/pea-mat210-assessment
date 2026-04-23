const https = require('https');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY not configured.' } });
  }

  const { model, max_tokens, system, messages } = req.body;

  const payload = JSON.stringify({
    model: model || 'claude-sonnet-4-20250514',
    max_tokens: max_tokens || 500,
    system: system || '',
    messages: messages || []
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const apiReq = https.request(options, (apiRes) => {
      let body = '';
      apiRes.on('data', chunk => body += chunk);
      apiRes.on('end', () => {
        try {
          const data = JSON.parse(body);
          res.status(apiRes.statusCode).json(data);
        } catch (e) {
          res.status(500).json({ error: { message: 'Invalid response from API' } });
        }
        resolve();
      });
    });

    apiReq.on('error', (err) => {
      res.status(500).json({ error: { message: 'Failed to reach API: ' + err.message } });
      resolve();
    });

    apiReq.write(payload);
    apiReq.end();
  });
};
