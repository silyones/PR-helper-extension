async function generatePR(diff) {
  const { groqApiKey } = await chrome.storage.sync.get('groqApiKey');

  if (!groqApiKey) {
    return { error: 'No API key set. Open the extension popup and save your Groq API key.' };
  }

  if (!diff || !diff.trim()) {
    return { error: 'No diff found. Open a GitHub New PR page first.' };
  }

  const truncatedDiff = diff.slice(0, 3000);

  const systemPrompt =
    'You are a senior software engineer. You write clear, concise GitHub PR titles and descriptions. Always respond with valid JSON only — no markdown, no explanation, no code fences.';

  const userPrompt = `Analyze this git diff and generate a PR title and description.

Return ONLY this JSON structure:
{
  "title": "imperative PR title under 60 characters",
  "description": "## Summary\\n<one paragraph>\\n\\n## Changes\\n- <change 1>\\n- <change 2>\\n\\n## Testing\\n- <test step 1>\\n- <test step 2>",
  "commit_message": "conventional commit format e.g. feat(auth): add JWT middleware"
}

Git diff:
${truncatedDiff}`;

  console.log('[PR-helper] API call starting, diff length:', truncatedDiff.length);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 800,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.log('[PR-helper] API error:', response.status, errBody);

      if (response.status === 429) {
        return { error: 'Groq API rate limit reached. Please wait a moment and try again.' };
      }

      return { error: `Groq API error (${response.status}). Check your API key and try again.` };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';

    console.log('[PR-helper] API call completed, response length:', text.length);

    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          return parsed;
        } catch {
          return { error: 'Parse failed', raw: text };
        }
      }
      return { error: 'Parse failed', raw: text };
    }
  } catch (err) {
    console.log('[PR-helper] Fetch failed:', err.message);
    return { error: `Network error: ${err.message}` };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GENERATE_PR') {
    generatePR(msg.diff).then(sendResponse);
    return true;
  }
  return false;
});
