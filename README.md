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
