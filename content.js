function extractDiff() {
  let diffText = '';

  // Get all elements with file path info
  const fileContainers = document.querySelectorAll('[data-tagsearch-path]');

  console.log('PR-helper: found', fileContainers.length, 'file containers');

  fileContainers.forEach((container) => {
    const filename = container.getAttribute('data-tagsearch-path');

    // Find the diff table within or near this container
    const diffTable =
      container.querySelector('table.diff-table') ||
      container.closest('[class*="file"]')?.querySelector('table.diff-table');

    if (!diffTable) return;

    const additions = [...diffTable.querySelectorAll('td.blob-code-addition')]
      .map((el) => '+ ' + el.textContent.trim())
      .filter((line) => line.length > 2);

    const deletions = [...diffTable.querySelectorAll('td.blob-code-deletion')]
      .map((el) => '- ' + el.textContent.trim())
      .filter((line) => line.length > 2);

    if (additions.length || deletions.length) {
      diffText += `\n\nFile: ${filename}\n${deletions.join('\n')}\n${additions.join('\n')}`;
    }
  });

  // Fallback: if no file containers found, scan whole document for diff tables directly
  if (!diffText) {
    console.log('PR-helper: fallback - scanning all diff tables');
    const allTables = document.querySelectorAll('table.diff-table');
    console.log('PR-helper: found', allTables.length, 'diff tables');

    allTables.forEach((table, i) => {
      const additions = [...table.querySelectorAll('td.blob-code-addition')]
        .map((el) => '+ ' + el.textContent.trim())
        .filter((line) => line.length > 2);
      const deletions = [...table.querySelectorAll('td.blob-code-deletion')]
        .map((el) => '- ' + el.textContent.trim())
        .filter((line) => line.length > 2);

      if (additions.length || deletions.length) {
        diffText += `\n\nFile ${i + 1}:\n${deletions.join('\n')}\n${additions.join('\n')}`;
      }
    });
  }

  console.log('PR-helper: extracted diff length:', diffText.length);
  console.log('PR-helper: diff preview:', diffText.slice(0, 500));

  return diffText.trim();
}

function fillPRFields(title, description) {
  const titleField = document.querySelector('input[name="pull_request[title]"]');

  const bodyField =
    document.querySelector('textarea[name="pull_request[body]"]') ||
    document.querySelector('.js-previewable-comment-form textarea') ||
    document.querySelector('[class*="CommentBox"] textarea');

  console.log('[PR-helper] titleField:', titleField);
  console.log('[PR-helper] bodyField:', bodyField);

  if (!titleField && !bodyField) {
    console.log('[PR-helper] Not found. Dumping all textareas:');
    document.querySelectorAll('textarea').forEach((el) => {
      console.log({
        name: el.name,
        id: el.id,
        ariaLabel: el.getAttribute('aria-label'),
        className: el.className,
      });
    });
    return false;
  }

  // React-safe value setter
  function setReactInputValue(element, value) {
    const prototype =
      element.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
    nativeInputValueSetter.call(element, value);

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  if (titleField) {
    titleField.focus();
    setReactInputValue(titleField, title);
    console.log('[PR-helper] title set');
  }

  if (bodyField) {
    bodyField.focus();
    setReactInputValue(bodyField, description);
    console.log('[PR-helper] body set, length:', description.length);
  }

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
