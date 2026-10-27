const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadExtension } = require('./helpers.cjs');

function fixture(t, { legacy = false, cursor = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rtl-patcher-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (rel, value) => {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, value);
    return file;
  };
  const css = put('out/vs/workbench/workbench.desktop.main.css', '/* current editor CSS */');
  const html = put('out/vs/code/electron-sandbox/workbench/workbench.html', '<html><body>workbench</body></html>');
  const js = put('out/vs/workbench/workbench.desktop.main.js', '/* Antigravity: no Cursor markers */');
  const preview = put('extensions/markdown-language-features/media/markdown.css', '/* markdown styles */');
  const markdown = put('extensions/markdown-language-features/dist/extension.js', 'class="markdown-body" dir="auto"');
  const cascade = put('extensions/antigravity/cascade-panel.html', '<html><body><div id="react-app"></div></body></html>');
  const jetski = put('out/vs/code/electron-browser/workbench/workbench-jetski-agent.html', '<html><body><div id="jetski-app"></div></body></html>');
  const patcher = loadExtension(root, { appName: cursor ? 'Cursor' : 'Antigravity IDE' });
  if (cursor) fs.writeFileSync(js, patcher.JS_REPLACEMENTS.map((rep) => rep.to).join(';'));
  const originals = new Map([css, html, js, preview, markdown, cascade, jetski].map((file) => [file, fs.readFileSync(file, 'utf8')]));
  if (legacy) {
    for (const [file, content] of originals) fs.writeFileSync(file + '.rtlbak', content);
    for (const file of [css, preview]) fs.appendFileSync(file, '\n/* RTL-PATCH-START v1.0.6 */\np { unicode-bidi: isolate-override }\n/* RTL-PATCH-END */');
    fs.writeFileSync(html, '<html><body><!-- RTL-PATCH-START v1.0.6 --><style id="rtl-patcher-style">bad css</style><!-- RTL-PATCH-END --></body></html>');
    fs.writeFileSync(markdown, 'class="markdown-body" dir="rtl"');
  }
  return { root, put, css, html, js, preview, markdown, cascade, jetski, originals, patcher };
}

test('Antigravity applies without Cursor JS markers; reload prompt and repeated enable work', (t) => {
  const { css, cascade, jetski, js, originals, patcher } = fixture(t);
  patcher.applyPatch();
  assert.equal(patcher.isPatchAlreadyActive(), true);
  assert.match(patcher.status.text, /On/);
  assert.match(patcher.messages.info[0], /Reload Antigravity IDE/);
  assert.equal(patcher.messages.warnings.length, 0);
  assert.match(fs.readFileSync(cascade, 'utf8'), /md-divider-spacing/);
  assert.match(fs.readFileSync(jetski, 'utf8'), /md-divider-spacing/);
  assert.equal(fs.readFileSync(js, 'utf8'), originals.get(js));
  const first = fs.readFileSync(css, 'utf8');
  patcher.applyPatch();
  assert.equal(fs.readFileSync(css, 'utf8'), first);
  assert.equal(patcher.messages.info.length, 1);
  patcher.restoreBackup();
  assert.equal(patcher.isPatchAlreadyActive(), false);
  for (const [file, original] of originals) {
    assert.equal(fs.readFileSync(file, 'utf8'), original);
    assert.equal(fs.existsSync(file + '.rtlbak'), false);
  }
});

test('old patch upgrades all files, removes overrides and Cursor-only rewrites', (t) => {
  const { css, js, html, markdown, patcher } = fixture(t, { legacy: true, cursor: true });
  assert.equal(patcher.isPatchAlreadyActive(), false);
  patcher.applyPatch();
  assert.equal(patcher.isPatchAlreadyActive(), true);
  assert.doesNotMatch(fs.readFileSync(css, 'utf8'), /override|v1\.0\.6/);
  assert.doesNotMatch(fs.readFileSync(html, 'utf8'), /v1\.0\.6/);
  assert.match(fs.readFileSync(markdown, 'utf8'), /dir="auto"/);
  for (const rep of patcher.JS_REPLACEMENTS) {
    assert.ok(fs.readFileSync(js, 'utf8').includes(rep.from));
    assert.ok(!fs.readFileSync(js, 'utf8').includes(rep.to));
  }
});

test('a missing Markdown patch cannot be reported as fully active', (t) => {
  const { preview, patcher } = fixture(t);
  patcher.applyPatch();
  fs.writeFileSync(preview, '/* editor updated its markdown stylesheet */');
  assert.equal(patcher.isPatchAlreadyActive(), false);
  patcher.applyPatch();
  assert.equal(patcher.isPatchAlreadyActive(), true);
});

test('permission and other failures stay visible after CSS/HTML succeeds', (t) => {
  const { root, preview } = fixture(t);
  for (const code of ['EPERM', 'EIO']) {
    const fsOverride = Object.create(fs);
    fsOverride.writeFileSync = (file, ...args) => {
      if (file === preview) throw Object.assign(new Error('simulated failure'), { code });
      return fs.writeFileSync(file, ...args);
    };
    const patcher = loadExtension(root, { fsOverride });
    patcher.applyPatch();
    assert.equal(patcher.isPatchAlreadyActive(), false);
    assert.match(patcher.status.text, /Off/);
    assert.match(patcher.messages.warnings[0], /RTL patch incomplete/);
    assert.equal(patcher.messages.warnings[0].includes('Administrator'), code === 'EPERM');
  }
});

test('editor updates are preserved even when an older backup exists', (t) => {
  const { css, patcher } = fixture(t, { legacy: true });
  fs.appendFileSync(css, '\n/* new application version */');
  patcher.applyPatch();
  assert.match(fs.readFileSync(css, 'utf8'), /new application version/);
});

test('legacy script is removed without dropping the rest of workbench HTML', (t) => {
  const { html, put, patcher } = fixture(t);
  fs.writeFileSync(html, '<html><body>new editor<script src="rtl-inject.js"></script></body></html>');
  const script = put('out/vs/code/electron-sandbox/workbench/rtl-inject.js', 'legacy');
  patcher.applyPatch();
  assert.doesNotMatch(fs.readFileSync(html, 'utf8'), /rtl-inject\.js/);
  assert.match(fs.readFileSync(html, 'utf8'), /new editor/);
  assert.equal(fs.existsSync(script), false);
});
