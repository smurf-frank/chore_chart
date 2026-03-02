# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision

To create a digital equivalent of a physical magnetic chore chart that is tactile, highly visible, and accessible across multiple devices. The chart provides a bird's-eye view of household responsibilities with a "snappy" magnetic feel, supporting concurrent use across different locations while maintaining privacy.

## Goals

1. **Tactile UX**: Refine the "magnetic" interaction to include pronounced snapping when markers are placed or moved.
2. **Multi-Device Sync**: Enable concurrent use where multiple users/devices can interact with and view the same chart state in real-time.
3. **Multi-Board Support**: Allow users to switch between different chore charts or household boards within the same application.
4. **Platform Versatility**: Primary target is the Cozyla digital calendar (Android), but delivered via a high-performance Web/PWA for universal access.
5. **Self-Hosting Path**: Transition from local-only storage to a self-hostable remote backend (Postgres/MySQL) to support multi-user synchronization.
6. **Calendar Integration**: Support sending calendar invites for assigned tasks to ensure visibility across personal schedules.
7. **Customizable Grid Topology**: Allow users to define the primary and sub-units of time (e.g., Months/Weeks, Weeks/Days) and orient them freely on any axis (Top/Bottom/Left/Right).
8. **Themed Experience**: Support skins and custom soundscapes to allow households to personalize their "magnetic board" vibe.
9. **Dynamic Interconnectivity**: Enable linking tasks to other charts, allowing for hierarchical task management (e.g., click "Kitchen Clean" to open a detailed "Kitchen Sub-Chart").

## Non-Goals (Out of Scope)

- Building a native-only Android app (PWA/Web is the delivery vehicle).
- Complex social networking features (focus is on household utility).
- Real-time video/voice chat within the app.

## Users

- **Household Members**: View their assignments on the main board or from their phones while out and about; move markers to indicate completion/status.
- **Chore Managers**: Configure chores, participants, rotation schedules, and the physical "topology" of the board.
- **Remote Family**: Check in on household tasks from different locations.

## Constraints

- **Tactility**: Interactions must feel physical, not just functional.
- **Privacy**: Local-first DNA must be preserved; remote sync should be optional or self-hostable.
- **Hardware**: Must perform smoothly on the Cozyla digital calendar (limited Android hardware).
- **SQL Portability**: All data storage must use standard SQL for easy migration between SQLite and Postgres/MySQL.

## Success Criteria

- [ ] Markers "snap" into cells with visible and tactile feedback.
- [ ] State changes on one device are reflected on another device within < 2 seconds.
- [ ] Users can switch between at least two independent boards seamlessly.
- [ ] The app is installable as a PWA and functions on the Cozyla hardware.
- [ ] Users can trigger/receive a calendar invite for a specific chore assignment.
- [ ] Users can define a grid structure of 5 "Sub-units" within 1 "Primary unit" and label them.
- [ ] Clicking a task successfully navigates to a linked sub-board.
- [ ] Users can "swap" a marker for another peer's marker temporarily for a single instance.
- [ ] Users can toggle between at least two distinct visual "skins" and sound profiles.
