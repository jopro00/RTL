# RTL — Arabic RTL for Cursor / VS Code

Extension that patches Cursor (and compatible editors) so **Arabic chat** and **Markdown Preview** flow **right-to-left**. Code blocks stay LTR.

Repository: [https://github.com/jopro00/RTL](https://github.com/jopro00/RTL)

## Install

1. Download the latest `.vsix` from [Releases](https://github.com/jopro00/RTL/releases) (or build locally — see below).
2. In Cursor: **Extensions** → **⋯** → **Install from VSIX…**
3. Command Palette → **RTL Patcher: Enable RTL for Arabic Chat**
4. **Fully quit** Cursor (File → Exit) and reopen. Reload alone is not always enough.
5. If you see permission errors patching `resources/app`, run Cursor once as **Administrator**, enable RTL, then use normally.

## Build VSIX (Windows)

```powershell
cd D:\code\RTL
.\scripts\build-vsix.ps1
```

Output: `dist\rtl-<version>.vsix` (folder `rtl-extension` is zipped as a VSIX).

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
