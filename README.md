# RTL — Arabic RTL for Cursor / VS Code

Extension that patches Cursor (and compatible editors) so **Arabic chat** and **Markdown Preview** flow **right-to-left**. Code blocks stay LTR.

Repository: [https://github.com/jopro00/RTL](https://github.com/jopro00/RTL)

---

## How to run (Windows)

Follow these steps **in order**:

1. **Install the extension:** Download `rtl-*.vsix` from [Releases](https://github.com/jopro00/RTL/releases). In Cursor: **Extensions** → **⋯** → **Install from VSIX…**
2. **Enable RTL:** Command Palette → **RTL Patcher: Enable RTL for Arabic Chat** (or use the **RTL** status bar item).
3. **Quit Cursor completely** (File → Exit). Reload alone is not enough.
4. **First time only:** Start Cursor **Run as administrator**. Enable RTL again from the Command Palette if needed.
5. **After that:** Open Cursor normally (without Admin). The extension keeps working; you do not need Admin every time.

If you see **Permission denied** while enabling, step 4 (Admin **once**) fixes it.

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
