# Initial backlog

Each row is a GitHub issue (number in brackets). GitHub owns live status, owners and reviewers.

| ID | Owner | Task | Depends on | Done when |
| --- | --- | --- | --- | --- |
| BOOT-01 ([#5](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/5)) | Delta | GitHub, green CI, protected main and portable onboarding | — | First CI run passes; required checks and approval enabled |
| SETUP-01 ([#6](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/6)) | All, supported by pair expert | Complete clean-machine setup using SETUP.md | BOOT-01 | Each person runs a local request and checks using their own tools, or records a concrete blocker; no private skills required |
| API-01 ([#7](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/7)) | Delta + Alban | Agree route contract | BOOT-01 | Both approve schema/example and frontend consumes fixture |
| DATA-01 ([#9](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/9)) | Sonia | Fetch and normalise fresh OSM places/parks for one demo area on Saturday | API-01, DATA-02 | Event-time sample preserves IDs, names, coordinates, dates and attribution; failures trigger labelled simulation |
| FE-01 ([#10](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/10)) | Alban | Map and candidate route layers | API-01 | Two routes drawn; selected route changes visibly |
| FE-02 ([#3](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/3)) | Ola | Preferences form | API-01 | Valid request submitted; empty/loading/error states visible |
| FE-03 ([#11](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/11)) | Aryna | Place cards | FE-02 | Cards show place details and data mode |
| BE-01 ([#12](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/12)) | Delta | Candidate routes and explicit scoring | API-01 | Valid street geometry from routing service or labelled fixture fallback |
| BE-02 ([#13](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/13)) | Sonia | Places endpoint and filters | DATA-01 | Bounded endpoint returns normalised data; relevant check passes |
| INT-01 ([#14](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/14)) | Delta + Alban | Shared integration demo | FE-01, FE-02, BE-01 | Teammate device can complete core flow |
| AI-01 ([#15](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/15)) | Delta | Natural language preferences and grounded explanation | INT-01 | Structured preferences; explanation grounded in returned data |
| MCP-01 ([#16](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/16)) | Delta | MCP adapter over shared services | BE-01 | Tool called successfully from MCP client; instructions documented |
| QA-01 ([#17](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/17)) | Sonia + Ola | Demo checks and fallback assets | INT-01 | Happy/error paths verified; recording and screenshots available |
| PITCH-01 ([#18](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/18)) | Delta | Narrative, delivery, questions | Starts at freeze | Timed rehearsal complete; claims match demo |
| SLIDES-01 ([#19](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/19)) | Alban | Presentation design | Starts at freeze | Clear problem, demo, data, future city, and team slides |

Stretch ideas, including milestones and achievements, the then-and-now era layer, and social walking, remain in IDEA.md until experts explicitly select them. Do not open speculative implementation PRs.
One research check is not stretch work: Sonia verifies a Warsaw tree or drinking-fountain dataset and its licence as part of the source gate (see PLAN.md). Record the result in `docs/DATA.md`.

## Saturday source checks and simulation backlog

Build on the approved starter and collect data fresh during the event. The remote project is source research only; do not copy its implementation or snapshots.
The source inventory in PLAN.md records historical evidence, not guaranteed live availability.

| ID | Owner | Task | Depends on | Done when |
| --- | --- | --- | --- | --- |
| DATA-02 ([#8](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/8)) | Delta + Sonia | Run the 30-minute kickoff source gate | API-01 | Fresh OSM, one useful official dataset, and routing provider classified as verified, simulated or deferred; organiser data rules confirmed |
| DATA-03 ([#20](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/20)) | Sonia | Cache and document event-time source responses | DATA-01 | Source URL/date, fetched time, licence/attribution and record count recorded; no old project assets copied |
| DATA-04 ([#21](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/21)) | Sonia, reviewed by Delta | Verify one official Warsaw dataset and new project key | DATA-02 | Small useful authenticated response works, or failure is recorded; no credentials exposed |
| DATA-05 ([#22](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/22)) | Sonia | Include museum/historic tags in new OSM query | DATA-01 | Actual records checked; absent opening hours remain unknown; no fabricated real-world metadata |
| DATA-06 ([#23](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/23)) | Delta | Verify walking/cycling routing service | DATA-02 | Known pairs return street-following GeoJSON; limits/fallback recorded; otherwise explicitly illustrative routes |
| SIM-01 ([#24](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/24)) | Sonia + Delta | Create environmental and disruption demo fixtures | API-01 | Noise, route air scores, traffic, incidents and roadworks visibly simulated; no fake measured dB or implied live readings |
| SIM-02 ([#25](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/25)) | Sonia + Ola | Create mock event/profile/charging examples | API-01 | Fictional or clearly demo-labelled records; no implication of real availability, bookings or personal account access |
| DATA-07 ([#26](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/26)) | Delta + Alban | Define greenery proxy from fresh park geometry | DATA-03 | Method documented; UI says proxy; no unsupported claim of measured shade/canopy |
| DATA-08 ([#27](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/27)) | Alban + Aryna | Display source modes and dates | API-01 | Cards and route explanations distinguish real, historical, proxy and simulated inputs |
| DATA-09 ([#28](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/28)) | Delta | Timebox optional event/roadwork/GTFS checks | INT-01 | At most 30 minutes; integrate only verified useful responses, otherwise retain simulation or defer |
| DATA-10 ([#29](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/29)) | Sonia + Ola | Test provider failures and demo fallback | INT-01, DATA-08 | Contract remains stable during outages; simulation labels persist; screenshot/recording fallback ready |

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
- Alban + Ola + Aryna: build against the shared fixture immediately; display per-input provenance so mixed real/simulated routes remain clear.
- All: no old-project code, snapshots, credentials, or database imports; no data tasks beyond the 06:00 freeze or 06:30 absolute stop.

