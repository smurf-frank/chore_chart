# Chore Chart

A digital magnetic bulletin board for managing chores. Built with vanilla HTML, CSS, and JavaScript, using SQL.js (SQLite) for data management and persistence.

## Features
- **Magnetic Board Interface**: Drag-and-drop markers to assign chores.
- **Multi-Assignment**: Assign multiple actors to the same chore on the same day.
- **Polymorphic Actors**: Support for different types of actors (initially people).
- **Persistent Data**: Changes are saved locally in the browser using SQLite and `localStorage`.
- **Customizable**: Change the chart title, subtitle, week start day, and maximum markers per cell.

## Architecture
- **Layered Architecture**: Separation of concerns between UI (`app.js`), Data Access (`repository.js`), and Database Logic (`db.js`).
- **Repository Pattern**: Centralized data management for easy maintenance and testing.
- **Unit Tested**: Comprehensive test suite ensuring reliability.

## License
This project is licensed under the **GNU Affero General Public License v3.0**. See the [LICENSE](LICENSE) file for the full text.

---
*Created by smurf-frank*
