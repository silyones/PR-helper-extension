function extractDiff() {
  const files = document.querySelectorAll('.file');
  if (!files.length) {
    console.log('[PR-helper] No .file elements found in DOM');
    return '';
  }

  const parts = [];

  files.forEach((fileEl) => {
    const header = fileEl.querySelector('.file-header');
    const filename = header?.getAttribute('data-path') || header?.querySelector('.Link--primary')?.textContent?.trim() || 'unknown';

    const additions = fileEl.querySelectorAll('.blob-code-addition');
    const deletions = fileEl.querySelectorAll('.blob-code-deletion');

    const lines = [];

    deletions.forEach((el) => {
      const text = el.textContent?.trim();
      if (text) lines.push('-' + text);
    });

    additions.forEach((el) => {
      const text = el.textContent?.trim();
      if (text) lines.push('+' + text);
    });

    if (lines.length) {
      parts.push(`--- ${filename} ---\n${lines.join('\n')}`);
    }
  });

  const diff = parts.join('\n\n');
  console.log('[PR-helper] Diff extracted, character count:', diff.length);
  return diff;
}

function fillPRFields(title, description) {
  const titleField = document.querySelector('#pull_request_title');
  const bodyField = document.querySelector('#pull_request_body');

  if (!titleField || !bodyField) {
    console.log('[PR-helper] PR form fields not found');
    return false;
  }

  titleField.value = title;
  titleField.dispatchEvent(new Event('input', { bubbles: true }));

  bodyField.value = description;
  bodyField.dispatchEvent(new Event('input', { bubbles: true }));

  console.log('[PR-helper] Fields filled — title:', title.slice(0, 60));
  return true;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_DIFF') {
    const diff = extractDiff();
    sendResponse({ diff });
    return false;
  }

  if (msg.type === 'FILL_FIELDS') {
    const success = fillPRFields(msg.title, msg.description);
    sendResponse({ success });
    return false;
  }

  return false;
});
