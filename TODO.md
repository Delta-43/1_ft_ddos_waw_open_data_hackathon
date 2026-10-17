# Initial backlog

Create one GitHub issue per row using `docs/GITHUB.md`. After creation, add issue links here. GitHub owns live status.

| ID | Owner | Task | Depends on | Done when |
| --- | --- | --- | --- | --- |
| BOOT-01 | Delta | GitHub, green CI, protected main and portable onboarding | — | First CI run passes; required checks and approval enabled |
| SETUP-01 | All, supported by pair expert | Complete clean-machine setup using SETUP.md | BOOT-01 | Each person runs a local request and checks using their own tools, or records a concrete blocker; no private skills required |
| API-01 | Delta + Alban | Agree route contract | BOOT-01 | Both approve schema/example and frontend consumes fixture |
| DATA-01 | Sonia | Fetch and normalise fresh OSM places/parks for one demo area on Saturday | API-01, DATA-02 | Event-time sample preserves IDs, names, coordinates, dates and attribution; failures trigger labelled simulation |
| FE-01 | Alban | Map and candidate route layers | API-01 | Two routes drawn; selected route changes visibly |
| FE-02 | Ola | Preferences form | API-01 | Valid request submitted; empty/loading/error states visible |
| FE-03 | Ola | Place cards | FE-02 | Cards show place details and data mode |
| BE-01 | Delta | Candidate routes and explicit scoring | API-01 | Valid street geometry from routing service or labelled fixture fallback |
| BE-02 | Sonia | Places endpoint and filters | DATA-01 | Bounded endpoint returns normalised data; relevant check passes |
| INT-01 | Delta + Alban | Shared integration demo | FE-01, FE-02, BE-01 | Teammate device can complete core flow |
| AI-01 | Delta | Natural language preferences and grounded explanation | INT-01 | Structured preferences; explanation grounded in returned data |
| MCP-01 | Delta | MCP adapter over shared services | BE-01 | Tool called successfully from MCP client; instructions documented |
| QA-01 | Sonia + Ola | Demo checks and fallback assets | INT-01 | Happy/error paths verified; recording and screenshots available |
| PITCH-01 | Delta | Narrative, delivery, questions | Starts at freeze | Timed rehearsal complete; claims match demo |
| SLIDES-01 | Alban | Presentation design | Starts at freeze | Clear problem, demo, data, future city, and team slides |

Stretch ideas remain in IDEA.md until experts explicitly select them. Do not open speculative implementation PRs.

## Saturday source checks and simulation backlog

Start code and data collection from scratch during the event. The remote project is source research only; do not copy its implementation or snapshots.
The source inventory in PLAN.md records historical evidence, not guaranteed live availability.

| ID | Owner | Task | Depends on | Done when |
| --- | --- | --- | --- | --- |
| DATA-02 | Delta + Sonia | Run the 30-minute kickoff source gate | API-01 | Fresh OSM, one useful official dataset, and routing provider classified as verified, simulated or deferred; organiser data rules confirmed |
| DATA-03 | Sonia | Cache and document event-time source responses | DATA-01 | Source URL/date, fetched time, licence/attribution and record count recorded; no old project assets copied |
| DATA-04 | Sonia, reviewed by Delta | Verify one official Warsaw dataset and new project key | DATA-02 | Small useful authenticated response works, or failure is recorded; no credentials exposed |
| DATA-05 | Sonia | Include museum/historic tags in new OSM query | DATA-01 | Actual records checked; absent opening hours remain unknown; no fabricated real-world metadata |
| DATA-06 | Delta | Verify walking/cycling routing service | DATA-02 | Known pairs return street-following GeoJSON; limits/fallback recorded; otherwise explicitly illustrative routes |
| SIM-01 | Sonia + Delta | Create environmental and disruption demo fixtures | API-01 | Noise, route air scores, traffic, incidents and roadworks visibly simulated; no fake measured dB or implied live readings |
| SIM-02 | Sonia + Ola | Create mock event/profile/charging examples | API-01 | Fictional or clearly demo-labelled records; no implication of real availability, bookings or personal account access |
| DATA-07 | Delta + Alban | Define greenery proxy from fresh park geometry | DATA-03 | Method documented; UI says proxy; no unsupported claim of measured shade/canopy |
| DATA-08 | Alban + Ola | Display source modes and dates | API-01 | Cards and route explanations distinguish real, historical, proxy and simulated inputs |
| DATA-09 | Delta | Timebox optional event/roadwork/GTFS checks | INT-01 | At most 30 minutes; integrate only verified useful responses, otherwise retain simulation or defer |
| DATA-10 | Sonia + Ola | Test provider failures and demo fallback | INT-01, DATA-08 | Contract remains stable during outages; simulation labels persist; screenshot/recording fallback ready |

### Start with simulations

- Route-specific air and noise scores.
- Live traffic, current accidents, and roadwork disruptions.
- EV charging occupancy, battery constraints, and multimodal transfers.
- Event schedules, promotions, calendar/habit profiles, and future device interactions.

Replace a simulation only after a fresh source is verified and integrated. Keep unknown values unknown; never relabel a fixture as observed data.
The core real-data target is fresh places/parks plus one useful official city dataset, subject to confirmed event requirements.
If those checks fail, tell the team immediately and revise the scenario rather than claiming a real-data integration.

### Pair handover

- Delta + Sonia: source gate, fresh fetches, small normalisers, documented proxies, and labelled simulations.
- Alban + Ola: build against the shared fixture immediately; display per-input provenance so mixed real/simulated routes remain clear.
- All: no old-project code, snapshots, credentials, or database imports; no data tasks beyond the 06:00 freeze or 06:30 absolute stop.

