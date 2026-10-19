# RTL — Arabic RTL for Cursor / Antigravity / VS Code

Extension that patches Cursor and Antigravity so **Arabic chat** and **Markdown Preview** read right-to-left. English paragraphs read left-to-right, and code blocks stay LTR. VS Code Markdown preview is supported too.

Repository: [https://github.com/jopro00/RTL](https://github.com/jopro00/RTL)

---

## How to run (Windows)

Follow these steps **in order**:

1. **Install the extension:** Download `rtl-*.vsix` from [Releases](https://github.com/jopro00/RTL/releases), or build it below. In your editor: **Extensions** → **⋯** → **Install from VSIX…**
2. **Enable RTL:** Command Palette → **RTL Patcher: Enable RTL for Arabic Chat** (or use the **RTL** status bar item).
3. **Reload the editor** when prompted to load the new styles. If an old window still displays old styles, quit the editor completely and reopen it.
4. **If permission is denied:** Start the editor with **Run as administrator**, then enable RTL again.
5. **After that:** Open the editor normally (without Admin). Updates reapply the patch when needed.

Existing patches upgrade automatically when **Auto Enable** is on. If it is off, run **Enable RTL for Arabic Chat** after installing an update. The status shows active only after every required target is ready.

---

## Markdown files (`.md`)

In Cursor, Arabic in Markdown files is RTL in the **Preview** tab (the **Preview** button above the file), not in the **Markdown** tab that shows the raw source.

| Mode | Arabic RTL |
| --- | --- |
| **Preview** | Yes — right-to-left (headings, paragraphs, tables) |
| **Markdown** (source) | No — use **Preview** to read Arabic RTL |

Inline code and fenced code blocks stay **LTR** in Preview so formatting does not break.

---

## Build VSIX (Windows)

```powershell
cd D:\code\RTL
.\scripts\build-vsix.ps1
```

Output: `dist\rtl-<version>.vsix`

## Automatic publishing to Open VSX

`.github/workflows/publish-open-vsx.yml` checks the version in
`rtl-extension/extension/package.json` on every push to `main`. If that version
is not on Open VSX yet, it runs the patcher regression tests, packages the
extension, and publishes it using [Open VSX trusted publishing](https://github.com/eclipse-openvsx/openvsx/blob/main/cli/README.md#trusted-publishing).
An already published version is skipped. Registry errors fail the workflow.

One-time setup:

1. Push the workflow file to `jopro00/RTL` on GitHub.
2. In the Open VSX extension settings, register a trusted publisher with:
   - Publisher: **GitHub**
   - Organization or User name: **jopro00**
   - Repository name: **RTL**
   - Workflow filename: **publish-open-vsx.yml**
   - Environment name: leave empty (the workflow does not use an environment).
3. Click **Register**. This workflow requires no `OVSX_PAT` repository secret.

For each update, increase `version` in `rtl-extension/extension/package.json`,
update the changelog, and push to `main`. Keep
`rtl-extension/extension.vsixmanifest` in sync if you also use it for packaging.
To retry a failed publish, open **Actions → Publish to Open VSX → Run workflow**
on `main`. The workflow never changes or commits the extension version for you.

## Commands

| Command | Description |
| --- | --- |
| RTL Patcher: Enable RTL | Apply patches |
| RTL Patcher: Disable RTL | Restore backups |
| RTL Patcher: Toggle RTL | Toggle |
| `Ctrl+Alt+R` | Toggle (when editor focused) |

Setting **Arabic RTL Patcher → Auto Enable** (default: on) applies the patch on startup if missing.

## Source layout

```
rtl-extension/          # VSIX package root
  extension/            # extension entry (extension.js, package.json, …)
  extension.vsixmanifest
  [Content_Types].xml
scripts/
  build-vsix.ps1
```

## License

MIT — see [extension/LICENSE.txt](rtl-extension/extension/LICENSE.txt).
