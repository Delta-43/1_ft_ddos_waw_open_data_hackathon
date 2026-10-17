# Data and service catalogue

Sonia owns this catalogue; Delta approves service integrations.

| Dataset/service | Source URL | Licence/terms | Fetched at | Coverage/freshness | Mode | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| Starter route | Repository fixture | Team-authored synthetic example | Not applicable | Straight-line illustration only | mock | Sonia |

For each import, retain source identifiers, normalise coordinates, and record missing fields.
Do not commit personal calendars, habits, tokens, or a real user's location history.
SQLite holds city data only, never user profiles, preferences, trip history or achievements. Personal data stays on the user's device (IDEA.md, Privacy and security).
Use bounded HTTP timeouts and a cached/fixture fallback. External-service checks are manual, not required CI.
The starter fixture is not a museum catalogue or navigable street route.

## Fresh event-time data

Read STACK.md for source URLs, authentication, limits and simulation defaults. PLAN.md records earlier research, not guaranteed uptime. Fetch fresh event-time samples and append their results here; no private research repository or cache access is required. Record failures as well as successes.
