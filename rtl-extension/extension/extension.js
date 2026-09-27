const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const crypto = require('crypto');

const BACKUP_EXT = '.rtlbak';
const PATCH_VERSION = '1.0.6';
const STYLE_ID = 'rtl-patcher-style';
const CSS_MARKER_START = `/* RTL-PATCH-START v${PATCH_VERSION} */`;
const CSS_MARKER_END = '/* RTL-PATCH-END */';
const HTML_MARKER_START = `<!-- RTL-PATCH-START v${PATCH_VERSION} -->`;
const HTML_MARKER_END = '<!-- RTL-PATCH-END -->';
const ANY_CSS_START = /\/\* RTL-PATCH-START(?: v[\d.]+)? \*\//;
const ANY_HTML_START = /<!-- RTL-PATCH-START(?: v[\d.]+)? -->/;
const LEGACY_INJECT_SCRIPT = 'rtl-inject.js';

const RTL_CSS = `
@layer rtl-patch;
@layer rtl-patch {
html body .markdown-root,
html body .markdown-root.markdown-normalized,
html body .anysphere-markdown-container-root,
html body .markdown-section,
html body .composer-human-message,
html body .composer-ai-message,
html body .ui-prompt-input,
html body .ui-prompt-input .ProseMirror,
html body .ui-prompt-input-editor,
html body .ui-prompt-input-tiptap-readonly,
html body .aislash-editor-input,
html body .aislash-editor-input-readonly {
	direction: rtl !important;
	text-align: right !important;
	unicode-bidi: plaintext !important;
}
html body .markdown-root ul,
html body .markdown-root ol,
html body .anysphere-markdown-container-root ul,
html body .anysphere-markdown-container-root ol,
html body .markdown-section ul,
html body .markdown-section ol {
	padding-right: 20px !important;
	padding-left: 0 !important;
	direction: rtl !important;
}
html body .markdown-root pre,
html body .markdown-root code,
html body .anysphere-markdown-container-root pre,
html body .anysphere-markdown-container-root code,
html body .markdown-section pre,
html body .markdown-section code,
html body [data-streamdown="code-block"],
html body [data-streamdown="code-block-body"],
html body .markdown-code-outer-container,
html body .ui-code-block,
html body .markdown-code-outer-container .monaco-editor,
html body .markdown-code-outer-container .monaco-editor *,
html body .ui-code-block .monaco-editor,
html body .ui-code-block .monaco-editor *,
html body [data-streamdown="code-block"] .monaco-editor,
html body [data-streamdown="code-block"] .monaco-editor * {
	direction: ltr !important;
	text-align: left !important;
	unicode-bidi: isolate !important;
}
html body .ui-model-picker__trigger,
html body .ui-model-picker__trigger *,
html body .ui-dropdown-menu,
html body .ui-dropdown-menu *,
html body .monaco-menu,
html body .monaco-menu * {
	direction: ltr !important;
	text-align: left !important;
}
html body .monaco-workbench .part.auxiliarybar ul,
html body .monaco-workbench .part.auxiliarybar ol {
	padding-inline-start: 20px !important;
	padding-inline-end: 0 !important;
}
html body .monaco-editor[data-mode-id="markdown"] {
	direction: rtl !important;
}
html body .monaco-editor[data-mode-id="markdown"] .view-lines,
html body .monaco-editor[data-mode-id="markdown"] .lines-content,
html body .monaco-editor[data-mode-id="markdown"] .view-line,
html body .monaco-editor[data-mode-id="markdown"] .view-line span {
	direction: rtl !important;
	text-align: right !important;
	unicode-bidi: isolate !important;
}
.markdown-editor-react,
.markdown-editor-react[dir],
.markdown-editor-react__content,
.markdown-editor-react__scroll-area-wrapper,
.markdown-editor-react__scroll-area,
.markdown-editor-react__richtext,
.markdown-editor-react__richtext-content,
.markdown-editor-react .ProseMirror,
.markdown-editor-react [dir="auto"],
.markdown-editor-react [dir="ltr"],
html body .markdown-editor-react,
html body .markdown-editor-react__content,
html body .markdown-editor-react__scroll-area,
html body .markdown-editor-react__richtext,
html body .markdown-editor-react__richtext-content,
html body .markdown-editor-react__richtext-content .ProseMirror,
html body .markdown-editor-react [dir="auto"],
html body .markdown-editor-react [dir="ltr"],
html body .markdown-editor,
html body .markdown-editor .ProseMirror,
html body .markdown-preview-editor,
html body .markdown-preview-editor .markdown-body {
	direction: rtl !important;
	text-align: right !important;
	unicode-bidi: isolate !important;
}
.markdown-editor-react h1,
.markdown-editor-react h2,
.markdown-editor-react h3,
.markdown-editor-react h4,
.markdown-editor-react h5,
.markdown-editor-react h6,
.markdown-editor-react p,
.markdown-editor-react li,
.markdown-editor-react th,
.markdown-editor-react td,
.markdown-editor-react blockquote,
.markdown-editor-react .ProseMirror > *:not(pre),
html body .markdown-editor-react__richtext-content .ProseMirror > *:not(pre),
html body .markdown-editor-react__richtext-content .ProseMirror h1,
html body .markdown-editor-react__richtext-content .ProseMirror h2,
html body .markdown-editor-react__richtext-content .ProseMirror h3,
html body .markdown-editor-react__richtext-content .ProseMirror h4,
html body .markdown-editor-react__richtext-content .ProseMirror h5,
html body .markdown-editor-react__richtext-content .ProseMirror h6,
html body .markdown-editor-react__richtext-content .ProseMirror p,
html body .markdown-editor-react__richtext-content .ProseMirror li,
html body .markdown-editor-react__richtext-content .ProseMirror th,
html body .markdown-editor-react__richtext-content .ProseMirror td,
html body .markdown-editor-react__richtext-content .ProseMirror blockquote {
	direction: rtl !important;
	text-align: right !important;
	unicode-bidi: isolate-override !important;
}
html body .markdown-editor-react__richtext-content .ProseMirror ul,
html body .markdown-editor-react__richtext-content .ProseMirror ol,
html body .markdown-preview-editor .markdown-body ul,
html body .markdown-preview-editor .markdown-body ol,
html body .markdown-editor .ProseMirror ul,
html body .markdown-editor .ProseMirror ol {
	padding-right: 2em !important;
	padding-left: 0 !important;
	direction: rtl !important;
}
html body .markdown-editor-react__richtext-content .ProseMirror table,
html body .markdown-editor-react__richtext-content .ProseMirror .tableWrapper,
html body .markdown-preview-editor .markdown-body table,
html body .markdown-editor .ProseMirror table {
	direction: rtl !important;
	width: 100% !important;
}
html body .markdown-editor-react__richtext-content .ProseMirror th,
html body .markdown-editor-react__richtext-content .ProseMirror td,
html body .markdown-preview-editor .markdown-body th,
html body .markdown-preview-editor .markdown-body td,
html body .markdown-editor .ProseMirror th,
html body .markdown-editor .ProseMirror td {
	text-align: right !important;
	direction: rtl !important;
}
html body .markdown-editor-react__richtext-content .ProseMirror blockquote,
html body .markdown-preview-editor .markdown-body blockquote,
html body .markdown-editor .ProseMirror blockquote {
	border-left: none !important;
	border-right-width: 5px !important;
	border-right-style: solid !important;
	padding-right: 16px !important;
	padding-left: 0 !important;
}
html body .markdown-editor-react__richtext-content .ProseMirror pre,
html body .markdown-editor-react__richtext-content .ProseMirror pre *,
html body .markdown-editor-react__richtext-content .ProseMirror code,
html body .markdown-preview-editor .markdown-body pre,
html body .markdown-preview-editor .markdown-body pre code,
html body .markdown-preview-editor .markdown-body .vscode-code-block,
html body .markdown-preview-editor .markdown-body .hljs,
html body .markdown-editor pre,
html body .markdown-editor pre code,
html body .markdown-editor code {
	direction: ltr !important;
	text-align: left !important;
	unicode-bidi: isolate !important;
}
}
`.trim();

/** Loaded inside the Markdown preview iframe (separate document from workbench). */
const MARKDOWN_PREVIEW_RTL_CSS = `
html {
	direction: rtl;
}
html[dir="ltr"],
html[dir="auto"] {
	direction: rtl !important;
}
body {
	direction: rtl !important;
	text-align: right !important;
	unicode-bidi: isolate !important;
}
.markdown-body,
.markdown-body[dir="auto"],
.markdown-body[dir="ltr"] {
	direction: rtl !important;
	text-align: right !important;
	unicode-bidi: isolate !important;
}
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6,
.markdown-body p,
.markdown-body li,
.markdown-body dt,
.markdown-body dd,
.markdown-body figcaption,
.markdown-body th,
.markdown-body td,
h1, h2, h3, h4, h5, h6,
p, li, dt, dd, figcaption,
th, td {
	text-align: right !important;
	direction: rtl !important;
	unicode-bidi: isolate !important;
}
.markdown-body table,
table {
	direction: rtl !important;
	width: 100%;
}
.markdown-body th,
th {
	text-align: right !important;
}
.markdown-body ul,
.markdown-body ol,
ul, ol {
	padding-right: 2em !important;
	padding-left: 0 !important;
}
.markdown-body blockquote,
blockquote {
	border-left: none !important;
	border-right-width: 5px !important;
	border-right-style: solid !important;
	padding-right: 16px !important;
	padding-left: 0 !important;
}
.markdown-body pre,
.markdown-body pre code,
.markdown-body .hljs,
pre, pre code, pre.hljs, .hljs, kbd {
	direction: ltr !important;
	text-align: left !important;
	unicode-bidi: isolate !important;
}
:not(pre) > code {
	unicode-bidi: isolate !important;
}
body.showEditorSelection :not(tr,ul,ol).code-active-line:before,
body.showEditorSelection :not(tr,ul,ol).code-line:hover:before {
	left: auto !important;
	right: -12px !important;
}
body.showEditorSelection li.code-active-line:before,
body.showEditorSelection li.code-line:hover:before {
	left: auto !important;
	right: -30px !important;
}
`.trim();

const MARKDOWN_EXT_DIR_AUTO = 'class="markdown-body" dir="auto"';
const MARKDOWN_EXT_DIR_RTL = 'class="markdown-body" dir="rtl"';
const MARKDOWN_EXT_REL = 'extensions/markdown-language-features/dist/extension.js';

const JS_REPLACEMENTS = [
	{
		from: 'className:"markdown-editor-react",onBeforeInputCapture:',
		to: 'className:"markdown-editor-react",dir:"rtl",onBeforeInputCapture:'
	},
	{
		from: 'setAttribute("role","document"),o.style.outline="none",this.markdownRendering=',
		to: 'setAttribute("role","document"),o.setAttribute("dir","rtl"),o.style.outline="none",o.style.direction="rtl",this.markdownRendering='
	}
];

const CSS_BLOCK = `\n${CSS_MARKER_START}\n${RTL_CSS}\n${CSS_MARKER_END}\n`;
const MARKDOWN_CSS_BLOCK = `\n${CSS_MARKER_START}\n${MARKDOWN_PREVIEW_RTL_CSS}\n${CSS_MARKER_END}\n`;
const HTML_STYLE_BLOCK = `\n\t\t${HTML_MARKER_START}\n\t\t<style id="${STYLE_ID}">\n${RTL_CSS}\n\t\t</style>\n\t\t${HTML_MARKER_END}`;

let myStatusBarItem;

function isCursor() {
	return vscode.env.appName.toLowerCase().includes('cursor');
}

function unique(items) {
	return [...new Set(items.filter(Boolean))];
}

function getAppRoots() {
	const home = os.homedir();
	const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
	const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
	const roots = [];

	if (vscode.env.appRoot) {
		roots.push(vscode.env.appRoot);
	}

	const appNames = ['Cursor', 'cursor', 'Antigravity', 'Code', 'Code - Insiders'];
	for (const name of appNames) {
		roots.push(
			path.join(programFiles, name, 'resources', 'app'),
			path.join(localAppData, 'Programs', name, 'resources', 'app'),
			path.join(localAppData, 'Programs', name, 'app'),
			path.join('/Applications', `${name}.app`, 'Contents', 'Resources', 'app'),
			path.join(home, 'Applications', `${name}.app`, 'Contents', 'Resources', 'app')
		);
	}

	if (process.execPath) {
		const execDir = path.dirname(process.execPath);
		roots.push(
			path.join(execDir, 'resources', 'app'),
			path.join(execDir, '..', 'Resources', 'app')
		);
	}

	return unique(roots).filter((root) => fs.existsSync(path.join(root, 'out', 'vs')));
}

function getCssTargets() {
	const targets = [];
	const seen = new Set();

	for (const appRoot of getAppRoots()) {
		const workbenchDir = path.join(appRoot, 'out', 'vs', 'workbench');
		if (!fs.existsSync(workbenchDir)) {
			continue;
		}
		for (const name of fs.readdirSync(workbenchDir)) {
			if (!/^workbench\.[^.]+\.main\.css$/.test(name) || name.endsWith(BACKUP_EXT)) {
				continue;
			}
			const filePath = path.join(workbenchDir, name);
			if (!seen.has(filePath) && fs.existsSync(filePath)) {
				seen.add(filePath);
				targets.push(filePath);
			}
		}
	}

	return targets;
}

function getHtmlTargets() {
	const targets = [];
	const seen = new Set();

	for (const appRoot of getAppRoots()) {
		const htmlCandidates = [
			path.join(appRoot, 'out', 'vs', 'code', 'electron-sandbox', 'workbench', 'workbench.html'),
			path.join(appRoot, 'out', 'vs', 'code', 'electron-browser', 'workbench', 'workbench.html')
		];
		for (const htmlPath of htmlCandidates) {
			if (!seen.has(htmlPath) && fs.existsSync(htmlPath)) {
				seen.add(htmlPath);
				targets.push(htmlPath);
			}
		}
	}

	return targets;
}

const MARKDOWN_CSS_REL_PATHS = [
	'extensions/markdown-language-features/media/markdown.css',
	'extensions/github/markdown.css',
];

function getMarkdownCssTargets() {
	const targets = [];
	const seen = new Set();

	for (const appRoot of getAppRoots()) {
		for (const rel of MARKDOWN_CSS_REL_PATHS) {
			const filePath = path.join(appRoot, rel);
			if (!seen.has(filePath) && fs.existsSync(filePath)) {
				seen.add(filePath);
				targets.push(filePath);
			}
		}
	}

	return targets;
}

function getMarkdownExtensionTargets() {
	const targets = [];
	const seen = new Set();

	for (const appRoot of getAppRoots()) {
		const filePath = path.join(appRoot, MARKDOWN_EXT_REL);
		if (!seen.has(filePath) && fs.existsSync(filePath)) {
			seen.add(filePath);
			targets.push(filePath);
		}
	}

	return targets;
}

function getJsTargets() {
	const targets = [];
	const seen = new Set();

	for (const appRoot of getAppRoots()) {
		const workbenchDir = path.join(appRoot, 'out', 'vs', 'workbench');
		for (const name of ['workbench.desktop.main.js', 'workbench.glass.main.js']) {
			const filePath = path.join(workbenchDir, name);
			if (!seen.has(filePath) && fs.existsSync(filePath)) {
				seen.add(filePath);
				targets.push(filePath);
			}
		}
	}

	return targets;
}

function isMarkdownExtensionPatchApplied(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf8');
		return content.includes(MARKDOWN_EXT_DIR_RTL) && !content.includes(MARKDOWN_EXT_DIR_AUTO);
	} catch (e) {
		return false;
	}
}

function patchMarkdownExtension(filePath) {
	let content = readOriginal(filePath);
	if (content.includes(MARKDOWN_EXT_DIR_AUTO)) {
		content = content.split(MARKDOWN_EXT_DIR_AUTO).join(MARKDOWN_EXT_DIR_RTL);
	}
	writePatched(filePath, content);
}

function stripMarkedBlock(content, startRe, endMarker) {
	const match = content.match(startRe);
	if (!match) {
		return content;
	}
	const start = match.index;
	const end = content.indexOf(endMarker, start);
	if (end === -1) {
		return content;
	}
	return content.slice(0, start) + content.slice(end + endMarker.length);
}

function backupFile(filePath) {
	const backupPath = filePath + BACKUP_EXT;
	if (!fs.existsSync(backupPath)) {
		fs.copyFileSync(filePath, backupPath);
	}
	return backupPath;
}

function readOriginal(filePath) {
	return fs.readFileSync(backupFile(filePath), 'utf8');
}

function getOutDir(filePath) {
	let dir = path.dirname(filePath);
	while (dir && path.basename(dir) !== 'out') {
		const parent = path.dirname(dir);
		if (parent === dir) {
			return null;
		}
		dir = parent;
	}
	return dir;
}

function updateChecksum(filePath, content) {
	try {
		const outDir = getOutDir(filePath);
		if (!outDir) {
			return;
		}
		const productJsonPath = path.join(path.dirname(outDir), 'product.json');
		if (!fs.existsSync(productJsonPath)) {
			return;
		}
		const productJson = JSON.parse(fs.readFileSync(productJsonPath, 'utf8'));
		if (!productJson.checksums) {
			return;
		}
		const relPath = path.relative(outDir, filePath).replace(/\\/g, '/');
		if (!productJson.checksums[relPath]) {
			return;
		}
		const hash = crypto.createHash('sha256').update(content, 'utf8').digest('base64').replace(/=+$/g, '');
		productJson.checksums[relPath] = hash;
		fs.writeFileSync(productJsonPath, JSON.stringify(productJson, null, '\t'), 'utf8');
	} catch (e) {
		console.error('Failed to update checksum:', e);
	}
}

function writePatched(filePath, content) {
	fs.writeFileSync(filePath, content, 'utf8');
	updateChecksum(filePath, content);
}

function isCssPatchApplied(filePath) {
	try {
		return fs.readFileSync(filePath, 'utf8').includes(CSS_MARKER_START);
	} catch (e) {
		return false;
	}
}

function isHtmlPatchApplied(htmlPath) {
	try {
		const content = fs.readFileSync(htmlPath, 'utf8');
		return content.includes(HTML_MARKER_START) && content.includes(`id="${STYLE_ID}"`);
	} catch (e) {
		return false;
	}
}

function cleanupLegacyHtmlPatch(htmlPath) {
	let content = fs.readFileSync(htmlPath, 'utf8');
	const hadLegacy = content.includes(LEGACY_INJECT_SCRIPT) || /<script[^>]+rtl-inject\.js/i.test(content);
	if (!hadLegacy) {
		return false;
	}
	content = readOriginal(htmlPath);
	writePatched(htmlPath, content);
	const injectPath = path.join(path.dirname(htmlPath), LEGACY_INJECT_SCRIPT);
	if (fs.existsSync(injectPath)) {
		fs.unlinkSync(injectPath);
	}
	return true;
}

function patchCss(filePath) {
	let content = readOriginal(filePath);
	content = stripMarkedBlock(content, ANY_CSS_START, CSS_MARKER_END).replace(/\s+$/, '') + CSS_BLOCK;
	writePatched(filePath, content);
}

function patchMarkdownCss(filePath) {
	let content = readOriginal(filePath);
	content =
		stripMarkedBlock(content, ANY_CSS_START, CSS_MARKER_END).replace(/\s+$/, '') + MARKDOWN_CSS_BLOCK;
	writePatched(filePath, content);
}

function patchHtml(filePath) {
	cleanupLegacyHtmlPatch(filePath);
	let content = readOriginal(filePath);
	content = stripMarkedBlock(content, ANY_HTML_START, HTML_MARKER_END);
	if (content.includes('</body>')) {
		content = content.replace('</body>', `${HTML_STYLE_BLOCK}\n\t</body>`);
	} else if (content.includes('</head>')) {
		content = content.replace('</head>', `${HTML_STYLE_BLOCK}\n\t</head>`);
	} else {
		content += HTML_STYLE_BLOCK;
	}
	writePatched(filePath, content);
}

function isJsPatchApplied(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf8');
		return JS_REPLACEMENTS.every((rep) => content.includes(rep.to));
	} catch (e) {
		return false;
	}
}

function patchJs(filePath) {
	let content = readOriginal(filePath);
	for (const rep of JS_REPLACEMENTS) {
		if (content.includes(rep.to)) {
			continue;
		}
		if (!content.includes(rep.from)) {
			throw new Error(`JS marker not found: ${rep.from.slice(0, 80)}`);
		}
		content = content.split(rep.from).join(rep.to);
	}
	writePatched(filePath, content);
}

function restoreCss(filePath) {
	const backupPath = filePath + BACKUP_EXT;
	if (!fs.existsSync(backupPath)) {
		return false;
	}
	writePatched(filePath, fs.readFileSync(backupPath, 'utf8'));
	return true;
}

function restoreHtml(htmlPath) {
	cleanupLegacyHtmlPatch(htmlPath);
	const backupPath = htmlPath + BACKUP_EXT;
	if (!fs.existsSync(backupPath)) {
		return false;
	}
	writePatched(htmlPath, fs.readFileSync(backupPath, 'utf8'));
	return true;
}

function withWriteRetry(filePath, action) {
	try {
		action();
		return { ok: true };
	} catch (err) {
		if (err.code === 'EACCES' || /EACCES|operation not permitted/i.test(err.message || '')) {
			try {
				if (process.platform === 'darwin') {
					cp.execSync(`xattr -c "${filePath}"`, { stdio: 'ignore' });
					cp.execSync(`chmod 666 "${filePath}"`, { stdio: 'ignore' });
				}
				action();
				return { ok: true };
			} catch (fallbackErr) {
				return { ok: false, permission: true, error: fallbackErr };
			}
		}
		return { ok: false, permission: false, error: err };
	}
}

function isPatchFullyApplied() {
	const cssTargets = getCssTargets();
	const htmlTargets = getHtmlTargets();
	const jsTargets = getJsTargets();
	if (cssTargets.length === 0 || htmlTargets.length === 0 || jsTargets.length === 0) {
		return false;
	}
	const markdownCssTargets = getMarkdownCssTargets();
	const markdownExtTargets = getMarkdownExtensionTargets();
	return (
		cssTargets.every(isCssPatchApplied) &&
		htmlTargets.every(isHtmlPatchApplied) &&
		jsTargets.every(isJsPatchApplied) &&
		markdownCssTargets.every(isCssPatchApplied) &&
		markdownExtTargets.every(isMarkdownExtensionPatchApplied)
	);
}

function updateStatusBar(isActive) {
	if (!myStatusBarItem) {
		return;
	}
	if (isCursor()) {
		myStatusBarItem.text = isActive ? '$(globe) RTL: Active' : '$(globe) RTL: Inactive';
		myStatusBarItem.tooltip = isActive
			? 'RTL support is active. Click to manage.'
			: 'RTL support is not active. Click to manage.';
		myStatusBarItem.color = undefined;
		myStatusBarItem.command = 'antigravity.showMenu';
	} else {
		myStatusBarItem.text = isActive ? '$(check) RTL: On' : '$(x) RTL: Off';
		myStatusBarItem.tooltip = isActive
			? 'Arabic RTL support is active. Click to toggle.'
			: 'Arabic RTL support is inactive. Click to toggle.';
		myStatusBarItem.color = isActive ? '#50fa7b' : undefined;
		myStatusBarItem.command = 'antigravity.toggleRtl';
	}
	myStatusBarItem.show();
}

async function showMenu() {
	const items = [
		{
			label: '$(check) Activate RTL',
			description: 'Enable RTL for chat and Markdown preview (safe CSS injection)',
			command: 'antigravity.enableRtl'
		},
		{
			label: '$(close) Deactivate RTL',
			description: 'Disable RTL and restore original files',
			command: 'antigravity.disableRtl'
		}
	];
	const selection = await vscode.window.showQuickPick(items, {
		placeHolder: 'RTL support'
	});
	if (selection) {
		vscode.commands.executeCommand(selection.command);
	}
}

function applyPatch() {
	for (const htmlPath of getHtmlTargets()) {
		withWriteRetry(htmlPath, () => cleanupLegacyHtmlPatch(htmlPath));
	}

	const cssTargets = getCssTargets();
	const htmlTargets = getHtmlTargets();
	const jsTargets = getJsTargets();
	const markdownCssTargets = getMarkdownCssTargets();
	const markdownExtTargets = getMarkdownExtensionTargets();
	if (cssTargets.length === 0 || htmlTargets.length === 0) {
		vscode.window.showErrorMessage('No Cursor/VS Code workbench files found to patch.');
		return;
	}

	let patchedCount = 0;
	const errors = [];

	for (const filePath of cssTargets) {
		const result = withWriteRetry(filePath, () => patchCss(filePath));
		if (result.ok) {
			patchedCount += 1;
		} else if (result.permission) {
			errors.push(`Permission denied: ${filePath}`);
		} else {
			errors.push(`${path.basename(filePath)}: ${result.error.message}`);
		}
	}

	for (const filePath of markdownCssTargets) {
		const result = withWriteRetry(filePath, () => patchMarkdownCss(filePath));
		if (result.ok) {
			patchedCount += 1;
		} else if (result.permission) {
			errors.push(`Permission denied: ${filePath}`);
		} else {
			errors.push(`${path.basename(filePath)}: ${result.error.message}`);
		}
	}

	for (const filePath of markdownExtTargets) {
		const result = withWriteRetry(filePath, () => patchMarkdownExtension(filePath));
		if (result.ok) {
			patchedCount += 1;
		} else if (result.permission) {
			errors.push(`Permission denied: ${filePath}`);
		} else {
			errors.push(`${path.basename(filePath)}: ${result.error.message}`);
		}
	}

	for (const filePath of jsTargets) {
		const result = withWriteRetry(filePath, () => patchJs(filePath));
		if (result.ok) {
			patchedCount += 1;
		} else if (result.permission) {
			errors.push(`Permission denied: ${filePath}`);
		} else {
			errors.push(`${path.basename(filePath)}: ${result.error.message}`);
		}
	}

	for (const htmlPath of htmlTargets) {
		const result = withWriteRetry(htmlPath, () => patchHtml(htmlPath));
		if (result.ok) {
			patchedCount += 1;
		} else if (result.permission) {
			errors.push(`Permission denied: ${htmlPath}`);
		} else {
			errors.push(`${path.basename(htmlPath)}: ${result.error.message}`);
		}
	}

	if (patchedCount > 0) {
		updateStatusBar(true);
		vscode.window.showInformationMessage(
			`RTL patch applied to ${patchedCount} file(s). Please reload Cursor.`,
			'Restart Now'
		).then((sel) => {
			if (sel === 'Restart Now') {
				vscode.commands.executeCommand('workbench.action.reloadWindow');
			}
		});
	}

	if (errors.length > 0) {
		vscode.window.showWarningMessage('Some files failed to patch:\n' + errors.join('\n\n'), { modal: true });
	}
}

function restoreBackup() {
	let restoredAny = false;

	for (const htmlPath of getHtmlTargets()) {
		const result = withWriteRetry(htmlPath, () => {
			if (restoreHtml(htmlPath)) {
				restoredAny = true;
			}
		});
		if (!result.ok) {
			console.error('Failed to restore HTML:', htmlPath, result.error);
		}
	}

	for (const filePath of getCssTargets()) {
		const result = withWriteRetry(filePath, () => {
			if (restoreCss(filePath)) {
				restoredAny = true;
			}
		});
		if (!result.ok) {
			console.error('Failed to restore CSS:', filePath, result.error);
		}
	}

	for (const filePath of getMarkdownCssTargets()) {
		const result = withWriteRetry(filePath, () => {
			if (restoreCss(filePath)) {
				restoredAny = true;
			}
		});
		if (!result.ok) {
			console.error('Failed to restore Markdown CSS:', filePath, result.error);
		}
	}

	for (const filePath of getMarkdownExtensionTargets()) {
		const result = withWriteRetry(filePath, () => {
			if (restoreCss(filePath)) {
				restoredAny = true;
			}
		});
		if (!result.ok) {
			console.error('Failed to restore Markdown extension:', filePath, result.error);
		}
	}

	for (const filePath of getJsTargets()) {
		const result = withWriteRetry(filePath, () => {
			if (restoreCss(filePath)) {
				restoredAny = true;
			}
		});
		if (!result.ok) {
			console.error('Failed to restore workbench JS:', filePath, result.error);
		}
	}

	updateStatusBar(false);
	if (restoredAny) {
		vscode.window.showInformationMessage('RTL patch removed. Please reload.', 'Restart Now')
			.then((sel) => {
				if (sel === 'Restart Now') {
					vscode.commands.executeCommand('workbench.action.reloadWindow');
				}
			});
	} else {
		vscode.window.showWarningMessage('No backups found to restore.');
	}
}

function toggleRtl() {
	if (isPatchFullyApplied()) {
		restoreBackup();
	} else {
		applyPatch();
	}
}

function checkStatus() {
	const current = isPatchFullyApplied();
	updateStatusBar(current);
	const autoEnable = vscode.workspace.getConfiguration().get('antigravity.autoEnable', true);
	if (!current && autoEnable) {
		applyPatch();
	}
}

function activate(context) {
	context.subscriptions.push(
		vscode.commands.registerCommand('antigravity.enableRtl', applyPatch),
		vscode.commands.registerCommand('antigravity.disableRtl', restoreBackup),
		vscode.commands.registerCommand('antigravity.toggleRtl', toggleRtl),
		vscode.commands.registerCommand('antigravity.showMenu', showMenu)
	);

	const alignment = isCursor() ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right;
	myStatusBarItem = vscode.window.createStatusBarItem(alignment, 100);
	context.subscriptions.push(myStatusBarItem);
	setTimeout(checkStatus, 1000);
}

function deactivate() {
	if (myStatusBarItem) {
		myStatusBarItem.dispose();
	}
}

module.exports = { activate, deactivate };
