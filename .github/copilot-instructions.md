# Copilot Review Instructions for Chore Chart

Please follow these guidelines when reviewing pull requests for this repository:

## Architecture & Patterns
- **Repository Pattern**: Ensure data access logic remains in `repository.js` and doesn't leak into `app.js`.
- **Database**: We use `sql.js` (SQLite) with persistence to `localStorage`. Ensure SQL queries are efficient and follow the current schema defined in `db.js`.
- **Vanilla Tech**: Focus on standard HTML5, CSS3, and ES6+ JavaScript. No frameworks (React/Vue/Tailwind) unless explicitly added.

## UI & UX
- **Glassmorphism**: Maintain the "Digital Magnetic Board" aesthetic (semi-transparent backgrounds, subtle shadows, vibrant colors).
- **Drag-and-Drop**: We use the native HTML5 Drag and Drop API. Ensure handlers provide correct visual feedback (`drag-over`, `drop-target` classes).
- **Responsiveness**: Ensure the chart remains usable on smaller screens.

## Testing
- **Multi-Assignment**: Chores can have multiple actors assigned. Verify that changes don't break the array-based assignment model in `repository.js`.
- **Test Coverage**: All new logic should ideally have corresponding tests in `tests.html`.
