const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

// Simple endpoint to proxy and call OpenAI API securely using OPENAI_API_KEY env var
app.post('/api/generate-plan', async (req, res) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Server misconfigured: missing API key' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'You are an assistant that outputs structured JSON with planTitle, duration, phases (title + exercises array {name, details}) and a planHtml field.' }, { role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error('OpenAI error', txt);
      return res.status(502).json({ error: 'OpenAI API error' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    // Attempt to parse JSON out of text safely
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // Try to extract JSON substring
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch (e2) { parsed = null; }
      }
    }

    // If parsed, build HTML
    if (parsed && parsed.planTitle) {
      let html = `<h2>${escapeHtml(parsed.planTitle)}</h2>`;
      if (parsed.duration) html += `<p>Estimated Duration: ${escapeHtml(parsed.duration)}</p>`;
      parsed.phases?.forEach(phase => {
        html += `<h3>${escapeHtml(phase.phaseTitle||phase.title||'Phase')}</h3><ul>`;
        (phase.exercises||[]).forEach(ex => html += `<li><strong>${escapeHtml(ex.name)}</strong>: ${escapeHtml(ex.details)}</li>`);
        html += `</ul>`;
      });
      parsed.planHtml = html;
      return res.json(parsed);
    }

    // Fallback: return raw text
    return res.json({ text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

function escapeHtml(s){ return String(s).replace(/[&<>\"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;' })[c]); }

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Server running on', PORT));
