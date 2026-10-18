# Handover

- Current issue: #114 redesign (supersedes #98; replaces #109's route switch UI, keeps only the routes-in-chat idea)
- Branch / PR: `aryna/114-redesign`. No top bar (site name only); round Preferences (top-left) and Sources (bottom-left) buttons with rounded panels; chat opens left of the bot with route cards inside; left routes panel and right stops column removed; stops are glowing rings without numbers, a tap on the stop's building opens its card, which moves clear of panels; city pins off by default, toggled in Sources; bottom credit line moved into Sources; map controls round, right edge, vertically centred; hourglass for time travel
- Last verified result: `pnpm run check` and `pnpm run build` pass; headless Chrome at 1440×900 and 390×844 (chat, routes, card, preferences, sources), no horizontal scroll
- Blocker: whole-team layout review (decision 00:27). Map focus look (dark map, corridor) stays with Delta's #100/#101
- Next action: fixes from the team review; Sources entry for estimated building heights once option A data exists
- Open items: close #98 as superseded by #114 (Aryna to confirm)
- Updated at (include timezone): 2026-10-18 03:12 +0200 (Europe/Warsaw)

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
