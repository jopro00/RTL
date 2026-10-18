Run the patcher regression tests with Node.js:

```powershell
node --test tests/patcher.test.cjs
```

The layout test uses Playwright and Chromium to check actual character positions,
Arabic/English alignment, mixed text, tables, input and code. With Playwright
available in Node's module path and its browser installed:

```powershell
node --test tests/layout.test.cjs
```

Set `RTL_BROWSER_PATH` to use an existing Chromium-based browser executable.
