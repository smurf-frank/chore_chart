# Missing Test Coverage Report

> **Purpose**: This document tracks the unit tests that existed in the `master` branch (`tests.html` at root) but were not ported to the new asynchronous test suite in `tests/tests.html` during the Capacitor integration. These represent technical debt that should be addressed after the native Android verification is complete.

---

## 📋 Missing Test Areas

| Category | Missing Coverage Details | Importance |
| :--- | :--- | :--- |
| **Actor CRUD** | `removeActor()` side effects on assignments, `getAllActors(type)` filtering, metadata deep updates, and `removePerson()` alias verification. | High |
| **Chore CRUD** | `removeChore()` cascading delete of assignments, and incrementing sort order logic. | High |
| **Settings** | Validation clamping (0-32), chore column width limits, and default value consistency for all setting keys. | Medium |
| **Assignments** | Duplicate assignment rejection in cells, max-marker limit enforcement (beyond simple case), and assignment result structure (type check). | High |
| **Groups** | Circular dependency detection at multiple depths, group membership cleanup upon actor deletion, and `showAsMarker` flag behavior. | High |
| **Rotations** | 7-day filling verification, deterministic rotation order checks, and cross-day wrapping logic (Mon -> Sun). | High |
| **Migration** | The legacy `people -> actors` migration logic is currently completely untested in the async suite. | Critical |
| **Day Ordering** | `getOrderedDays()` logic for different week starts (Wed, Sun, etc.). | Medium |

---

## 🚀 Recommended Next Steps

1. **Phase 1**: Port the "Actor CRUD" and "Chore CRUD" tests to `tests/tests.html`.
2. **Phase 2**: Implement the "Migration" test, ensuring it can handle the legacy schema asynchronously.
3. **Phase 3**: Restore the "Group Management" and "Nested Group" logic verification.
4. **Phase 4**: Complete the "Settings" and "Day Ordering" edge cases.

---

*Last Updated: 2026-02-19*
