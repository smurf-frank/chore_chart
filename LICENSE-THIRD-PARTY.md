# Third-Party Licenses

This document tracks all third-party software and assets bundled with the Chore Chart project.

## Software Libraries

### [sql.js](https://github.com/sql-js/sql.js)

- **Files**: `vendor/sql-wasm.js`, `vendor/sql-wasm.wasm`
- **License**: [MIT License](https://github.com/sql-js/sql.js/blob/master/LICENSE)
- **Description**: SQLite compiled to WebAssembly. The underlying SQLite library is in the Public Domain.

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

**Permitted Licenses**: Only open-source licenses permitting redistribution and hosting (e.g., MIT, ISC, Apache-2.0, AGPL, BSD, OFL, BlueOak) are allowed. The full list of permitted identifiers is maintained in the project's Husky and GitHub Actions configurations.
