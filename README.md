# Chore Chart 🧩

[![CI](https://github.com/smurf-frank/chore_chart/actions/workflows/ci.yml/badge.svg)](https://github.com/smurf-frank/chore_chart/actions/workflows/ci.yml)
[![CodeQL](https://github.com/smurf-frank/chore_chart/actions/workflows/codeql.yml/badge.svg)](https://github.com/smurf-frank/chore_chart/actions/workflows/codeql.yml)

A digital magnetic bulletin board for managing household chores. Designed for simplicity, visibility, and a premium "physical board" aesthetic.

## ✨ Features
- **Magnetic Board Interface**: Drag-and-drop markers to assign chores with a tactile feel.
- **Multi-Assignment**: Assign multiple people to the same chore on the same day.
- **Interactive Grid**: A clean, reactive interface for tracking weekly tasks.
- **Persistence Layer**: Locally stored state using SQL.js (SQLite) and `localStorage`.
- **Responsive Design**: Works perfectly across desktop and tablet displays.

## 🏛 Architecture
- **Layered Design**: Clear separation between UI (`app.js`), Data Access (`repository.js`), and Database Logic (`db.js`).
- **Repository Pattern**: Centralized data management for consistency and ease of testing.
- **Unit Tested**: Comprehensive test suite ensures high reliability and correctness.

## 🛠 Tech Stack
- **HTML5 / CSS3**: Vanilla implementation for zero-overhead performance.
- **JavaScript**: Pure JS logic without heavy framework dependencies.
- **SQL.js**: Client-side SQLite for robust local data management.
- **Playwright**: End-to-end testing and CI automation.
- **CodeQL**: Automated security scanning.

## 🚀 Getting Started
1. Clone the repository.
2. Open `index.html` in any modern browser.
3. For development/testing:
   ```bash
   npm install
   npm run test
   ```

## ⚖️ License
This project is licensed under the **AGPLv3 License**. See the [LICENSE](LICENSE) file for the full text.

---
*Created by smurf-frank*
