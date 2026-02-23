# Third-Party Licenses

This document tracks all third-party software and assets bundled with the Chore Chart project.

## Software Libraries

### [sql.js](https://github.com/sql-js/sql.js)

- **Files**: `vendor/sql-wasm.js`, `vendor/sql-wasm.wasm`
- **License**: [MIT License](https://github.com/sql-js/sql.js/blob/master/LICENSE)
- **Description**: SQLite compiled to WebAssembly. The underlying SQLite library is in the Public Domain.

### [mobile-drag-drop](https://github.com/timruffles/mobile-drag-drop)

- **Files**: `src/vendor/mobile-drag-drop.min.js`, `src/vendor/mobile-drag-drop.css`
- **License**: [MIT License](https://github.com/timruffles/mobile-drag-drop/blob/master/LICENSE)
- **Description**: Polyfill for the HTML5 Drag and Drop API on mobile browsers.

---

## Fonts

### [Inter](https://github.com/rsms/inter)

- **Files**: `fonts/inter-*.ttf`
- **License**: [SIL Open Font License 1.1](https://github.com/rsms/inter/blob/master/LICENSE.txt)
- **Creator**: Rasmus Andersson

### [Outfit](https://github.com/Outfit-Font-Family/Outfit)

- **Files**: `fonts/outfit-*.ttf`
- **License**: [SIL Open Font License 1.1](https://github.com/Outfit-Font-Family/Outfit/blob/main/OFL.txt)
- **Creator**: Rodrigo Fuenzalida

---

## Automated Dependency Tracking

To ensure continuous compliance with the [Project Bible](./PROJECT_BIBLE.md), all `npm` dependencies (including transitive dependencies) are automatically audited for license compatibility during the `pre-push` git hook and the main CI pipeline.

**Permitted Licenses**: Only open-source licenses permitting redistribution and hosting are allowed. As of the current audit, the following licenses are present and permitted in the `npm` dependency tree:

| License Identifier            | Count  | Compatibility    |
| :---------------------------- | :----- | :--------------- |
| **MIT**                       | 175    | Permissive       |
| **ISC**                       | 29     | Permissive       |
| **Apache-2.0**                | 19     | Permissive       |
| **BlueOak-1.0.0**             | 12     | Permissive       |
| **BSD-2-Clause**              | 7      | Permissive       |
| **BSD-3-Clause**              | 2      | Permissive       |
| **Unlicense**                 | 1      | Public Domain    |
| **AGPL-3.0**                  | 1      | Copyleft         |
| **0BSD**                      | 1      | Public Domain    |
| **CC-BY-3.0**                 | 1      | Attribution      |
| **CC0-1.0**                   | 1      | Public Domain    |
| **OFL-1.1**                   | -      | Font License     |
| **(Other permissive combos)** | Varied | MIT/BSD variants |

_Note: The numbers above reflect the total dependency tree, including development tools._
