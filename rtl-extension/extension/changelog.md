# Changelog

All notable changes to the "antigravity-rtl-patcher" extension will be documented in this file.

## [1.0.11] - 2026-09-27
### Changed
- Rebrand to **RTL Everywhere** (display name, icon, publisher `jopro`).

## [1.0.10] - 2026-09-27
### Fixed
- Cursor Markdown **Preview** stayed LTR because CSS never reached the React editor: workbench CSS layers/`!important` and TipTap do not set `dir` on `.markdown-editor-react`.
- Patch workbench JS to set `dir="rtl"` on the Markdown Preview root (and the editor pane), so Arabic headings/tables flow right-to-left even when the title starts with Latin (`Organai — …`).
- Put RTL rules in `@layer rtl-patch` (last layer) so they beat Tailwind/`@layer utilities`.
- Fixed `patchHtml` using an undefined variable, so the workbench `<style>` inject actually runs.

## [1.0.9] - 2026-09-27
### Fixed
- Cursor's built-in Markdown **Preview** (`.markdown-editor-react` / ProseMirror), not the VS Code webview.
- Stopped `unicode-bidi: plaintext` on document headings: a line that starts with Latin (`Organai — …`) was staying LTR.

## [1.0.8] - 2026-09-27
### Fixed
- Markdown preview used `dir="auto"` (stays LTR when lines mix Arabic and paths); patch sets `dir="rtl"` on `.markdown-body`.
- Stronger preview CSS on `.markdown-body[dir="auto"]` and full-document RTL in the Monaco `.md` editor.

## [1.0.7] - 2026-09-27
### Fixed
- Markdown **preview** RTL: patch `markdown-language-features/media/markdown.css` (preview runs in its own document, not workbench CSS).
- Tables, blockquotes (border on the right), and lists match rendered Arabic docs.
- Stop forcing LTR on every `monaco-editor`; `.md` source editor can flow RTL.

## [1.0.6] - 2026-09-27
### Added
- RTL for Markdown: source editor (`data-mode-id="markdown"`), WYSIWYG `.markdown-editor`, and preview `.markdown-body`; code blocks in preview stay LTR.

## [1.0.5] - 2026-08-19
### Fixed
- Inject RTL as a safe `<style>` block in `workbench.html` (no JavaScript) so Glass and Agent chat pick it up.
- Stronger selectors for Cursor 3.16 chat (`ui-prompt-input-editor`, `html body` prefix).

## [1.0.4] - 2026-08-19
### Fixed
- Removed `workbench.html` / `rtl-inject.js` injection that caused Cursor to freeze and crash.
- RTL is now applied via CSS only to `workbench.desktop.main.css` and `workbench.glass.main.css`.
- Automatically cleans up legacy 1.0.3 HTML patches on startup.

## [1.0.3] - 2026-08-19
### Fixed
- Cursor 3.16 Glass UI: patch `workbench.glass.main.css` as well as `workbench.desktop.main.css`.
- Inject RTL script into `workbench.html` so Agent / Composer chat is RTL in every project.
- Keep code blocks, editors, and menus LTR.

## [1.5.0] - 2026-03-01
### Added
- **Automated Checksum Update:** Automatically updates `product.json` checksums after patching the CSS file to prevent "corrupt installation" warnings entirely.
### Changed
- Refined macOS permission handling and verified CSS targeting ensuring only `workbench.desktop.main.css` is modified.

## [1.4.0] - 2026-02-28
### Added
- Confirmed support for Antigravity v1.18 or higher.
### Changed
- Removed Hebrew support mentions.
- Restricted file patching to `workbench.desktop.main.css` ONLY to ensure compatibility and stability.
- Simplified extension logic by removing legacy HTML patching for older versions.

## [1.3.9] - 2026-02-25
### Fixed
- Added user-provided manual fixes to further stabilize macOS permissions handling and patching flow.

## [1.3.8] - 2026-02-25
### Fixed
- **macOS Permissions Fix:** Automatically bypasses `com.apple.provenance` quarantine attributes using `xattr` when attempting to apply the patch.
- **Interactive macOS Fallback:** If the patch still fails due to strict user permissions (`EACCES`), an interactive error dialog now appears allowing the user to 1-click copy the exact Terminal command (`sudo chown`) required to fix their Mac permissions.

## [1.3.7] - 2026-02-25
### Fixed
- Bulletproof macOS path resolution: Added dynamic API `vscode.env.appRoot` to detect the exact installation folder of the active Antigravity instance regardless of where the user placed the application.

## [1.3.6] - 2026-02-25
### Fixed
- Fixed macOS path resolution by scanning all possible Antigravity installation paths instead of stopping at the first match.
- Added explicit user instructions for macOS `EACCES` permission errors when applying the patch.

## [1.3.5] - 2026-02-25
### Added
- Explicitly support macOS default Antigravity path: `/Applications/Antigravity.app/...`

## [1.3.4] - 2026-02-25
### Changed
- Updated repository, bugs, and homepage links.
- Confirmed full macOS support.

## [1.3.3] - 2026-02-25
### Added
- Added support for macOS path: `Contents/Resources/app/out/vs/workbench/workbench.desktop.main.css`.

## [1.3.2] - 2026-02-25
### Changed
- Minor fixes and improvements.

## [1.3.1] - 2026-02-25
### Changed
- **Two targets:**
  - `cascade-panel.html` for Antigravity **≤ v1.16.5**
  - `workbench.desktop.main.css` for Antigravity **≥ v1.18.3**
- Updated README with version compatibility table.

## [1.3.0] - 2026-02-25
### Added
- **New Antigravity Support:** Added patching for `workbench.desktop.main.css` (latest Antigravity version).

## [1.1.0] - 2026-02-17
### Added
- **Auto RTL Detection:** Now automatically detects Arabic content and sets `dir="auto"`.
- **Status Bar Item:** Added a status bar indicator to toggle RTL support on/off.
- **Configuration:** Added `antigravity.fontFamily` to customize fonts.
- **Configuration:** Added `antigravity.autoEnable` to control startup behavior.
- **Keyboard Shortcut:** Added `Ctrl+Alt+R` (Windows) / `Cmd+Alt+R` (Mac) to toggle RTL.
- **Enhanced CSS:** Improved list formatting (bullets margins) and code block isolation (keeping code LTR).

## [1.0.0] - 2026-02-16
### Initial Release
- Basic RTL patching for Antigravity chat interface.
- Command to enable/disable RTL.
