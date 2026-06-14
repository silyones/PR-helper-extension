document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const generateBtn = document.getElementById('generateBtn');
  const statusEl = document.getElementById('status');

  chrome.storage.sync.get('groqApiKey', ({ groqApiKey }) => {
    if (groqApiKey) {
      apiKeyInput.value = groqApiKey;
    }
  });

  function setStatus(text, type = '') {
    statusEl.textContent = text;
    statusEl.className = type;
  }

  saveBtn.addEventListener('click', async () => {
    const value = apiKeyInput.value.trim();
    await chrome.storage.sync.set({ groqApiKey: value });
    apiKeyInput.classList.add('saved');
    setTimeout(() => apiKeyInput.classList.remove('saved'), 2000);
  });

  generateBtn.addEventListener('click', async () => {
    setStatus('Reading diff...');
    generateBtn.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        setStatus('Could not access the active tab.', 'error');
        return;
      }

      if (!tab.url?.includes('github.com')) {
        setStatus('No diff found. Open a GitHub New PR page first.', 'error');
        return;
      }

      let diffRes;
      try {
        diffRes = await chrome.tabs.sendMessage(tab.id, { type: 'GET_DIFF' });
      } catch {
        setStatus('No diff found. Open a GitHub New PR page first.', 'error');
        return;
      }

      if (!diffRes?.diff?.trim()) {
        setStatus('No diff found. Open a GitHub New PR page first.', 'error');
        return;
      }

      setStatus('Generating with AI...');

      const result = await chrome.runtime.sendMessage({
        type: 'GENERATE_PR',
        diff: diffRes.diff,
      });

      if (result?.error) {
        setStatus(result.error, 'error');
        return;
      }

      if (!result?.title || !result?.description) {
        setStatus('Unexpected response from AI. Try again.', 'error');
        return;
      }

      await chrome.tabs.sendMessage(tab.id, {
        type: 'FILL_FIELDS',
        title: result.title,
        description: result.description,
      });

      setStatus('Fields filled. Review and submit.', 'success');
    } catch (err) {
      setStatus(err.message || 'Something went wrong.', 'error');
    } finally {
      generateBtn.disabled = false;
    }
  });
});
