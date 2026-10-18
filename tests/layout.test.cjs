const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { extensionDir } = require('./helpers.cjs');

test('English, Arabic, mixed text and code render in the correct visual order', async () => {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.RTL_BROWSER_PATH ? { executablePath: process.env.RTL_BROWSER_PATH } : {}) });
  try {
    const page = await browser.newPage();
    const content = `<h2 id="en">Business modules are working.</h2>
      <p id="ar">العربي شغال بشكل صحيح</p>
      <p id="mix">ده مثال فيه <code id="inline">index.ts</code> وبعده عربي.</p>
      <table><tr><th id="heading">Layer</th><td id="cell">Foundation</td></tr></table>
      <pre><code id="code"><span>const answer = 42;</span></code></pre>`;
    const cases = [
      ['Cursor rich text', 'rtl.css', `<section class="markdown-editor-react"><div class="markdown-editor-react__richtext-content"><div class="ProseMirror">${content}</div></div></section>`],
      ['Antigravity', 'rtl.css', `<section class="md-divider-spacing">${content}<div class="relative whitespace-pre-wrap"><div id="highlight" class="monaco-tokenized-source"><span>const answer = 42;</span></div></div></section>`],
      ['Markdown webview', 'preview-rtl.css', `<section class="markdown-body" dir="auto">${content}</section>`]
    ];
    for (const [name, stylesheet, markup] of cases) {
      const css = fs.readFileSync(path.join(extensionDir, stylesheet), 'utf8');
      await page.setContent(`<style>section{width:700px} ${css}</style>${markup}`);
      const positions = await page.evaluate(() => {
        const result = {};
        for (const id of ['en', 'ar', 'mix', 'inline', 'heading', 'cell', 'code', 'highlight']) {
          const element = document.getElementById(id);
          if (!element) continue;
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          const text = walker.nextNode();
          const range = document.createRange();
          const x = [0, 1].map((offset) => {
            range.setStart(text, offset); range.setEnd(text, offset + 1);
            return range.getBoundingClientRect().x;
          });
          range.selectNodeContents(element);
          const bounds = range.getBoundingClientRect();
          const block = element.getBoundingClientRect();
          result[id] = { x, left: bounds.left, right: bounds.right, blockLeft: block.left,
            blockRight: block.right, bidi: getComputedStyle(element).unicodeBidi };
        }
        return result;
      });
      for (const id of ['en', 'inline', 'heading', 'cell', 'code', 'highlight']) {
        if (!positions[id]) continue;
        assert.ok(positions[id].x[0] < positions[id].x[1], `${name}: ${id} must read LTR`);
      }
      assert.ok(positions.ar.x[0] > positions.ar.x[1], `${name}: Arabic must read RTL`);
      assert.ok(Math.abs(positions.en.left - positions.en.blockLeft) < 1, `${name}: English left alignment`);
      assert.ok(Math.abs(positions.ar.right - positions.ar.blockRight) < 1, `${name}: Arabic right alignment`);
      assert.equal(positions.mix.bidi, 'plaintext');
    }
    // Guard the Antigravity editor, user messages and unrelated source editor too.
    const css = fs.readFileSync(path.join(extensionDir, 'rtl.css'), 'utf8');
    await page.setContent(`<style>${css}</style>
      <div data-lexical-editor="true"><p id="input">العربي شغال</p></div>
      <div data-testid="user-input-step"><div id="message" class="whitespace-pre-wrap">العربي شغال</div></div>
      <div class="monaco-editor" data-mode-id="markdown"><div id="source" class="view-line"># Business modules</div></div>`);
    const bidi = await page.evaluate(() => Object.fromEntries(['input', 'message', 'source'].map(id =>
      [id, getComputedStyle(document.getElementById(id)).unicodeBidi])));
    assert.equal(bidi.input, 'plaintext');
    assert.equal(bidi.message, 'plaintext');
    assert.notEqual(bidi.source, 'plaintext');
  } finally {
    await browser.close();
  }
});
