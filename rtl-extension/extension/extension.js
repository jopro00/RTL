const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const crypto = require('crypto');

const BACKUP_EXT = '.rtlbak';
const PATCH_VERSION = '1.0.15';
const STYLE_ID = 'rtl-patcher-style';
const CSS_MARKER_START = `/* RTL-PATCH-START v${PATCH_VERSION} */`;
const CSS_MARKER_END = '/* RTL-PATCH-END */';
const HTML_MARKER_START = `<!-- RTL-PATCH-START v${PATCH_VERSION} -->`;
const HTML_MARKER_END = '<!-- RTL-PATCH-END -->';
const ANY_CSS_START = /\/\* RTL-PATCH-START(?: v[\d.]+)? \*\//;
const ANY_HTML_START = /<!-- RTL-PATCH-START(?: v[\d.]+)? -->/;
const LEGACY_INJECT_SCRIPT = 'rtl-inject.js';

const RTL_CSS = fs.readFileSync(path.join(__dirname, 'rtl.css'), 'utf8').trim();
const MARKDOWN_PREVIEW_RTL_CSS = fs.readFileSync(path.join(__dirname, 'preview-rtl.css'), 'utf8').trim();

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

	const appNames = ['Cursor', 'cursor', 'Antigravity', 'Antigravity IDE', 'Code', 'Code - Insiders'];
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
			path.join(appRoot, 'out', 'vs', 'code', 'electron-browser', 'workbench', 'workbench.html'),
			path.join(appRoot, 'out', 'vs', 'code', 'electron-browser', 'workbench', 'workbench-jetski-agent.html'),
			path.join(appRoot, 'out', 'vs', 'code', 'electron-browser', 'workbench', 'workbench-jetski-agent-dev.html'),
			path.join(appRoot, 'extensions', 'antigravity', 'cascade-panel.html')
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

function isUnderRunningAppRoot(filePath) {
	const appRoot = vscode.env.appRoot;
	if (!appRoot) {
		return true;
	}
	const rel = path.relative(path.resolve(appRoot), path.resolve(filePath));
	return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function targetsForRunningApp(getter) {
	return getter().filter(isUnderRunningAppRoot);
}

function isPatchAppliedOnRunningInstall() {
	const cssTargets = targetsForRunningApp(getCssTargets);
	const htmlTargets = targetsForRunningApp(getHtmlTargets);
	const jsTargets = targetsForRunningApp(getJsTargets);
	if (cssTargets.length === 0 || htmlTargets.length === 0) {
		return false;
	}
	const markdownCssTargets = targetsForRunningApp(getMarkdownCssTargets);
	const markdownExtTargets = targetsForRunningApp(getMarkdownExtensionTargets);
	return (
		cssTargets.every(isCssPatchApplied) &&
		htmlTargets.every(isHtmlPatchApplied) &&
		jsTargets.every(isJsPatchApplied) &&
		markdownCssTargets.every(isCssPatchApplied) &&
		markdownExtTargets.every(isMarkdownExtensionPatchApplied)
	);
}

/** All required files must have the current patch, including legacy cleanup. */
function isPatchAlreadyActive() {
	return isPatchAppliedOnRunningInstall();
}

function isMarkdownExtensionPatchApplied(filePath) {
	try {
		return !fs.readFileSync(filePath, 'utf8').includes(MARKDOWN_EXT_DIR_RTL);
	} catch (e) {
		return false;
	}
}

function patchMarkdownExtension(filePath) {
	backupFile(filePath);
	const content = fs.readFileSync(filePath, 'utf8').split(MARKDOWN_EXT_DIR_RTL).join(MARKDOWN_EXT_DIR_AUTO);
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
	const currentContent = fs.readFileSync(filePath, 'utf8');

	const isCurrentlyPatched =
		ANY_CSS_START.test(currentContent) ||
		ANY_HTML_START.test(currentContent) ||
		currentContent.includes(MARKDOWN_EXT_DIR_RTL);

	if (!fs.existsSync(backupPath)) {
		if (isCurrentlyPatched) {
			let clean = stripMarkedBlock(currentContent, ANY_CSS_START, CSS_MARKER_END);
			clean = stripMarkedBlock(clean, ANY_HTML_START, HTML_MARKER_END);
			clean = clean.split(MARKDOWN_EXT_DIR_RTL).join(MARKDOWN_EXT_DIR_AUTO);
			fs.writeFileSync(backupPath, clean, 'utf8');
		} else {
			fs.copyFileSync(filePath, backupPath);
		}
	} else if (!isCurrentlyPatched) {
		fs.copyFileSync(filePath, backupPath);
	}
	if (!fs.existsSync(backupPath)) {
		throw new Error(`Backup was not created for ${filePath}`);
	}
	fs.readFileSync(backupPath);
	return backupPath;
}

function readForPatch(filePath) {
	backupFile(filePath);
	return fs.readFileSync(filePath, 'utf8');
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

function cleanupLegacyHtmlPatch(htmlPath, { createBackup = true } = {}) {
	let content = fs.readFileSync(htmlPath, 'utf8');
	const hadLegacy = content.includes(LEGACY_INJECT_SCRIPT) || /<script[^>]+rtl-inject\.js/i.test(content);
	if (!hadLegacy) {
		return false;
	}
	if (createBackup) {
		backupFile(htmlPath);
	}
	content = content.replace(/<script\b[^>]*\bsrc=["'][^"']*rtl-inject\.js[^"']*["'][^>]*>\s*<\/script>/gi, '');
	writePatched(htmlPath, content);
	const injectPath = path.join(path.dirname(htmlPath), LEGACY_INJECT_SCRIPT);
	if (fs.existsSync(injectPath)) {
		fs.unlinkSync(injectPath);
	}
	return true;
}

function patchCss(filePath) {
	let content = readForPatch(filePath);
	content = stripMarkedBlock(content, ANY_CSS_START, CSS_MARKER_END).replace(/\s+$/, '') + CSS_BLOCK;
	writePatched(filePath, content);
}

function patchMarkdownCss(filePath) {
	let content = readForPatch(filePath);
	content =
		stripMarkedBlock(content, ANY_CSS_START, CSS_MARKER_END).replace(/\s+$/, '') + MARKDOWN_CSS_BLOCK;
	writePatched(filePath, content);
}

function patchHtml(filePath) {
	cleanupLegacyHtmlPatch(filePath);
	let content = readForPatch(filePath);
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
		return JS_REPLACEMENTS.every((rep) => !content.includes(rep.to));
	} catch (e) {
		return false;
	}
}

/** Remove our old Cursor-only rewrites; no JS markers are required now. */
function patchJs(filePath) {
	let content = readForPatch(filePath);
	for (const rep of JS_REPLACEMENTS) {
		content = content.split(rep.to).join(rep.from);
	}
	writePatched(filePath, content);
}

function restoreFile(filePath, isHtml, removeBackup = true) {
	const backupPath = filePath + BACKUP_EXT;
	if (fs.existsSync(backupPath)) {
		let content = fs.readFileSync(backupPath, 'utf8');
		if (isHtml) {
			content = stripMarkedBlock(content, ANY_HTML_START, HTML_MARKER_END);
		} else {
			content = stripMarkedBlock(content, ANY_CSS_START, CSS_MARKER_END);
		}
		writePatched(filePath, content);
		if (removeBackup) {
			try {
				fs.unlinkSync(backupPath);
			} catch (e) {
				console.error('Failed to remove backup:', e);
			}
		}
		return true;
	}

	try {
		let content = fs.readFileSync(filePath, 'utf8');
		const hasPatch = isHtml ? ANY_HTML_START.test(content) : ANY_CSS_START.test(content);
		if (hasPatch) {
			content = isHtml
				? stripMarkedBlock(content, ANY_HTML_START, HTML_MARKER_END)
				: stripMarkedBlock(content, ANY_CSS_START, CSS_MARKER_END);
			writePatched(filePath, content);
			return true;
		}
	} catch (e) {
		console.error('Failed to read file for strip restore:', e);
	}
	return false;
}

function restoreCss(filePath) {
	return restoreFile(filePath, false);
}

function restoreHtml(htmlPath) {
	const restored = restoreFile(htmlPath, true, false);
	const cleanedLegacyPatch = cleanupLegacyHtmlPatch(htmlPath, { createBackup: false });
	if (restored) {
		try {
			fs.unlinkSync(htmlPath + BACKUP_EXT);
		} catch (e) {
			console.error('Failed to remove backup:', e);
		}
	}
	return restored || cleanedLegacyPatch;
}

function withWriteRetry(filePath, action) {
	try {
		action();
		return { ok: true };
	} catch (err) {
		if (['EACCES', 'EPERM'].includes(err.code) || /EACCES|operation not permitted/i.test(err.message || '')) {
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
	if (isPatchAlreadyActive()) {
		updateStatusBar(true);
		return;
	}

	const cssTargets = targetsForRunningApp(getCssTargets);
	const htmlTargets = targetsForRunningApp(getHtmlTargets);
	const jsTargets = targetsForRunningApp(getJsTargets);
	const markdownCssTargets = targetsForRunningApp(getMarkdownCssTargets);
	const markdownExtTargets = targetsForRunningApp(getMarkdownExtensionTargets);
	if (cssTargets.length === 0 || htmlTargets.length === 0) {
		vscode.window.showErrorMessage(`No workbench files found for ${vscode.env.appName}.`);
		return;
	}

	for (const htmlPath of htmlTargets) {
		if (!isHtmlPatchApplied(htmlPath)) {
			withWriteRetry(htmlPath, () => cleanupLegacyHtmlPatch(htmlPath));
		}
	}

	let newlyPatched = 0;
	const errors = [];

	for (const filePath of cssTargets) {
		if (isCssPatchApplied(filePath)) {
			continue;
		}
		const result = withWriteRetry(filePath, () => patchCss(filePath));
		if (result.ok) {
			newlyPatched += 1;
		} else if (result.permission) {
			errors.push({ permission: true, detail: filePath });
		} else {
			errors.push({ permission: false, detail: `${path.basename(filePath)}: ${result.error.message}` });
		}
	}

	for (const filePath of markdownCssTargets) {
		if (isCssPatchApplied(filePath)) {
			continue;
		}
		const result = withWriteRetry(filePath, () => patchMarkdownCss(filePath));
		if (result.ok) {
			newlyPatched += 1;
		} else if (result.permission) {
			errors.push({ permission: true, detail: filePath });
		} else {
			errors.push({ permission: false, detail: `${path.basename(filePath)}: ${result.error.message}` });
		}
	}

	for (const filePath of markdownExtTargets) {
		if (isMarkdownExtensionPatchApplied(filePath)) {
			continue;
		}
		const result = withWriteRetry(filePath, () => patchMarkdownExtension(filePath));
		if (result.ok) {
			newlyPatched += 1;
		} else if (result.permission) {
			errors.push({ permission: true, detail: filePath });
		} else {
			errors.push({ permission: false, detail: `${path.basename(filePath)}: ${result.error.message}` });
		}
	}

	for (const filePath of jsTargets) {
		if (isJsPatchApplied(filePath)) {
			continue;
		}
		const result = withWriteRetry(filePath, () => patchJs(filePath));
		if (result.ok) {
			newlyPatched += 1;
		} else if (result.permission) {
			errors.push({ permission: true, detail: filePath });
		} else {
			errors.push({ permission: false, detail: `${path.basename(filePath)}: ${result.error.message}` });
		}
	}

	for (const htmlPath of htmlTargets) {
		if (isHtmlPatchApplied(htmlPath)) {
			continue;
		}
		const result = withWriteRetry(htmlPath, () => patchHtml(htmlPath));
		if (result.ok) {
			newlyPatched += 1;
		} else if (result.permission) {
			errors.push({ permission: true, detail: htmlPath });
		} else {
			errors.push({ permission: false, detail: `${path.basename(htmlPath)}: ${result.error.message}` });
		}
	}

	updateStatusBar(errors.length === 0 && isPatchAlreadyActive());

	if (newlyPatched > 0) {
		vscode.window.showInformationMessage(
			`RTL patch applied to ${newlyPatched} file(s). Reload ${vscode.env.appName} to use the new styles.`,
			'Restart Now'
		).then((sel) => {
			if (sel === 'Restart Now') {
				vscode.commands.executeCommand('workbench.action.reloadWindow');
			}
		});
	}

	if (errors.length > 0) {
		for (const err of errors) {
			console.error('RTL patch failed:', err.detail);
		}
		const details = errors.map((err) => err.detail).join('\n');
		const hint = errors.some((err) => err.permission)
			? ` Close ${vscode.env.appName}, run it as Administrator, and enable RTL again.`
			: '';
		vscode.window.showWarningMessage(`RTL patch incomplete.${hint}\n${details}`);
	}
}

function restoreBackup() {
	let restoredAny = false;

	for (const htmlPath of targetsForRunningApp(getHtmlTargets)) {
		const result = withWriteRetry(htmlPath, () => {
			if (restoreHtml(htmlPath)) {
				restoredAny = true;
			}
		});
		if (!result.ok) {
			console.error('Failed to restore HTML:', htmlPath, result.error);
		}
	}

	for (const filePath of targetsForRunningApp(getCssTargets)) {
		const result = withWriteRetry(filePath, () => {
			if (restoreCss(filePath)) {
				restoredAny = true;
			}
		});
		if (!result.ok) {
			console.error('Failed to restore CSS:', filePath, result.error);
		}
	}

	for (const filePath of targetsForRunningApp(getMarkdownCssTargets)) {
		const result = withWriteRetry(filePath, () => {
			if (restoreCss(filePath)) {
				restoredAny = true;
			}
		});
		if (!result.ok) {
			console.error('Failed to restore Markdown CSS:', filePath, result.error);
		}
	}

	for (const filePath of targetsForRunningApp(getMarkdownExtensionTargets)) {
		const result = withWriteRetry(filePath, () => {
			if (restoreCss(filePath)) {
				restoredAny = true;
			}
		});
		if (!result.ok) {
			console.error('Failed to restore Markdown extension:', filePath, result.error);
		}
	}

	for (const filePath of targetsForRunningApp(getJsTargets)) {
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
	if (isPatchAlreadyActive()) {
		restoreBackup();
	} else {
		applyPatch();
	}
}

function checkStatus() {
	const active = isPatchAlreadyActive();
	updateStatusBar(active);
	const autoEnable = vscode.workspace.getConfiguration().get('antigravity.autoEnable', true);
	if (active || !autoEnable) {
		return;
	}
	applyPatch();
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
