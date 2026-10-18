const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const extensionDir = path.resolve(__dirname, '../rtl-extension/extension');
function loadExtension(appRoot, { appName = 'Antigravity IDE', fsOverride = fs } = {}) {
  const messages = { info: [], warnings: [], errors: [], logs: [] };
  const status = { show() {}, dispose() {} };
  const vscode = {
    env: { appRoot, appName },
    window: {
      createStatusBarItem: () => status,
      showInformationMessage: async (message) => { messages.info.push(message); },
      showWarningMessage: (message) => { messages.warnings.push(message); },
      showErrorMessage: (message) => { messages.errors.push(message); }
    },
    StatusBarAlignment: { Left: 1, Right: 2 }
  };
  const context = vm.createContext({
    require: (name) => name === 'vscode' ? vscode : name === 'fs' ? fsOverride : require(name),
    __dirname: extensionDir, module: { exports: {} }, process,
    console: { error: (...args) => messages.logs.push(args) }, setTimeout
  });
  vm.runInContext(fs.readFileSync(path.join(extensionDir, 'extension.js'), 'utf8') + `
    getAppRoots = () => [vscode.env.appRoot];
    myStatusBarItem = vscode.window.createStatusBarItem();
    module.exports = { applyPatch, restoreBackup, isPatchAlreadyActive, JS_REPLACEMENTS };
  `, context);
  return { ...context.module.exports, messages, status };
}
module.exports = { loadExtension, extensionDir };
