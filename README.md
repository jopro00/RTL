# RTL — Arabic RTL for Cursor / VS Code

إضافة تعدّل Cursor (والمحررات المتوافقة) عشان **الشات العربي** و**معاينة Markdown (Preview)** تظهر **من اليمين لليسار**. بلوكات الكود تفضل LTR.

Extension that patches Cursor so **Arabic chat** and **Markdown Preview** flow **right-to-left**. Code blocks stay LTR.

Repository: [https://github.com/jopro00/RTL](https://github.com/jopro00/RTL)

---

## طريقة التشغيل (Windows)

اتبع الخطوات **بالترتيب**:

1. **ثبّت الإضافة:** من [Releases](https://github.com/jopro00/RTL/releases) حمّل `rtl-*.vsix`، ثم في Cursor: **Extensions** → **⋯** → **Install from VSIX…**
2. **فعّل RTL:** Command Palette → **RTL Patcher: Enable RTL for Arabic Chat** (أو من شريط الحالة **RTL**).
3. **اقفل Cursor بالكامل** (File → Exit) — مش Reload لوحده.
4. **أول مرة فقط:** شغّل Cursor **Run as administrator**، ولو محتاج فعّل RTL تاني من Command Palette.
5. **بعد كده:** افتح Cursor عادي (من غير Admin) — الإضافة تفضل شغالة؛ مش محتاج Admin كل مرة.

لو ظهرت رسالة **Permission denied** أثناء التفعيل، الخطوة 4 (Admin **مرة واحدة**) هي اللي تحلها.

---

## ملفات Markdown (`.md`)

في Cursor، العربي في الملفات يظهر RTL في **تبويب Preview** (زر **Preview** فوق الملف)، مش في وضع **Markdown** اللي بيعرض المصدر/الكود.

| الوضع | RTL عربي |
| --- | --- |
| **Preview** | ✅ من اليمين لليسار (عناوين، فقرات، جداول) |
| **Markdown** (مصدر) | ❌ مش هدف الإضافة؛ استخدم Preview للقراءة |

الكود داخل `` ` `` أو ``` ``` يفضل **LTR** في Preview عشان ما يتكسرش.

---

## Install (English)

1. Download `.vsix` from [Releases](https://github.com/jopro00/RTL/releases).
2. **Install from VSIX…** in Extensions.
3. **Enable RTL** from the command palette.
4. **Quit Cursor completely**, reopen.
5. **First run only:** start Cursor **as Administrator**, enable RTL if prompted; afterward use Cursor normally.

Markdown RTL applies in the **Preview** tab only, not the raw Markdown source editor.

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
