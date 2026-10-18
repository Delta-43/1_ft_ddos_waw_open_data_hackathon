# Warsaw 2076: Personalised city navigation

Team concept notes for the Warsaw Open Data Hackathon 2026.

## What the demo implements (18 October 2026)

The product shipped as **Find YOUR way**: a calm, agent-led route guide for central Warsaw. A language model
picks one of six predefined outings from free text; real street routes; a dark map lit only along the route
with OSM buildings, parks and culture cards; timetable-driven buses and trams heading your way; a car-free
example with a grocery stop; toilets and AEDs on request; event and offer flags; reports kept in the browser;
EN/PL; MCP for agents; Docker for anyone. What is real, estimated or invented: README.md and
docs/Build_State_For_Pitch.md. Everything else below is the concept and roadmap.

## Event and challenge

- **Event:** Warsaw Open Data Hackathon 2026
- **Dates:** 17–18 October 2026
- **Venue:** 42 Warsaw, al. Solidarności 171B
- **Selected challenge:** Challenge 1 — Warsaw 2076
- **Official information:** [Hackathon website](https://42warsaw.pl/pl/hackathon-otwarte-dane-warszawa/)
- **Data starting point:** [Warsaw open data portal](https://dane.um.warszawa.pl/)

### Challenge brief

Imagine Warsaw in 50 years: its environment, appearance, and social challenges. Design a solution to a current urban problem that helps build the Warsaw we want to live in by 2076.

This is a paraphrase of the organiser's challenge brief.

## Core idea

A personalised city navigation tool that plans routes around people's habits, mood, interests, daily tasks, and available time.

The app combines city data with personal preferences to suggest useful routes and outings across Warsaw. Routes can include multiple stops and transport changes.

### Problem to address

A route needs to account for more than a destination. People also need to manage errands, time limits, traffic, charging, and their surroundings.

### Connection to Warsaw 2076

Make greener, quieter, and more practical travel choices easier today. Build towards a city where personal AI agents help people use public infrastructure and discover local culture.

## Example use cases

| User | Need | Example route |
| --- | --- | --- |
| Tourist | Visit several museums in an organised itinerary | A route connecting museums and historic locations |
| Resident | Complete daily errands and reach work | Collect laundry, drop children at school, and reach work while avoiding traffic and roadworks |
| Cyclist | Ride through quieter, greener surroundings | A cycling route that prioritises greenery and lower noise |
| Group of friends | Plan an evening pub outing | A route connecting several pubs |
| Electric car driver | Charge the car and reach the opera on time | Drive to a nearby charging station, then change transport to reach the venue |
| Food enthusiast | Explore different cuisines throughout the day | English breakfast, Ethiopian lunch, and a French gourmet dinner |

## Main capabilities

### Personalised routes

- Plan routes with multiple stops.
- Consider habits, mood, interests, and time constraints.
- Account for traffic, accidents, and roadworks where data is available.
- Support walking, cycling, public transport, and driving, including transport changes.
- Consider air quality, noise, greenery, and charging needs.

### Suggested outings

- Suggest events and places based on hobbies, mood, and available time.
- Build themed itineraries, such as museum visits, historic walks, restaurant outings, or pub routes.
- Use calendar availability and habits where the user chooses to provide them.

### AI agent

- Interpret what the user wants in natural language.
- Match requests semantically with places, events, and relevant city data.
- Suggest outings and explain route choices.
- Provide short summaries of landmarks and events.

### Personal agent integration

Expose city data and route capabilities to personal agents on users' devices.

The original notes mention Muse (Meta) and Dots (OpenAI) as examples. These names and possible integrations need verification before the pitch.

### Milestones and achievements

Reward people for exploring Warsaw and make repeat use more engaging.

- Track progress such as total distance walked or cycled, places visited, museums seen, parks crossed, and districts explored.
- Unlock achievements, for example "First 10 km on foot", "Five museums", "Every district on the Vistula", or "Quiet-route regular".
- Show progress on the map and in a small profile panel, with a short celebration when a milestone unlocks.
- Link achievements to Warsaw 2076: count greener choices, such as distance by foot or bike instead of car.

Constraints:

- Compute progress on the user's device from their own trip history. See [Privacy and security](#privacy-and-security).
- Count only completed or confirmed trips. A planned route is not a visited place.
- Do not invent environmental savings. Label estimates, such as CO2 avoided, as estimates and state the method.
- Status: stretch idea. Not in the core build until the experts select it. A demo could show a mock achievements panel with clearly fictional progress.

## Cultural layer, community and future-ready directions

Added 17 October 2026. All items are stretch or roadmap. None is core scope; PLAN.md and `docs/DECISIONS.md` record the status. Do not open speculative implementation PRs until the experts select an item.

### Then and now: the cultural time-travel toggle

On a route, a toggle shows what stood at or near each stop about 50 years ago (around 1976), plus key events nearby. A year selector (1945 / 1976 / today) is optional. The mirror image is a labelled "plan, not prediction" view of the city's planned next 50 years (for example metro extensions and riverfront plans).

- **Thin version:** 6–10 hand-curated entries along the demo route. Each has place, year, short text, event, source and licence. They are served as an `era` layer through the same bounded place-card API.
- **Narration rule:** the model may explain only curated entries. It must not write history freely. This follows the existing rule that code and data supply facts and the model explains them.
- **Labels:** every entry shows *curated*, its source and its licence.
- **Candidate sources (licences unverified):** Wikidata and Wikimedia Commons; Polona and the National Digital Archive; the city's [Warsaw history portal](https://warszawa19115.pl/en/-/the-warsaw-history-portal-is-launched); the Warsaw Rising Museum's [Korzenie Miasta](https://korzeniemiasta.sla.foreto.com/en/home/) aerial photos. No licence statement was found for the portal or Korzenie Miasta. The main 1945 Soviet aerial archive is reported as not publicly available. A raster overlay of historical imagery is therefore out of scope until reuse terms are confirmed.
- **Schema:** a new layer contract. Agree it with Delta and Alban before any change.

### Social walking: aggregate signals and opt-in meetups

Goal: help people on similar walks find each other without building a social network profile.

1. **Aggregate signal.** At a stop, the place card shows a count such as "2 walkers with a similar vibe are here or planned here today". Count only; no names, no live position. Show it only at or above a minimum threshold.
2. **Opt-in "open to chat here".** Nothing is broadcast until the user taps it.
3. **Place-bound, time-boxed wave.** Opted-in people at the same place see a pseudonymous wave: random handle and vibe tags only. It expires after about 30 minutes or when the user leaves.
4. **Mutual consent.** Anything beyond a wave opens only if both people accept. For the demo, hand off to a channel the user picks rather than building a chat, which would need block, report, rate limiting and moderation.
5. **Planned meetups.** A user publishes "walking route X, Saturday 10:00, meet at a named public place" and others can join. This is the safer path for longer connections.

Privacy constraints:

- The server would hold only an ephemeral record: handle, place ID (not coordinates), vibe tag and expiry. Keep it in memory or a short-TTL store. Never write it to SQLite or link it to a profile or history.
- This is a deliberate exception to "backend holds city data only". It needs Delta's explicit sign-off (see `docs/DECISIONS.md`) and is not part of the demo backend.
- Precise location is sensitive personal data under GDPR. A real version needs consent, retention and deletion rules, safety features and age rules.
- **Demo:** simulated walkers from fictional, labelled profiles, with a visible *Simulated* label. Real matching is a roadmap slide with the privacy design.
- Backend work needs an agreed contract with Alban (presence count plus wave) and its own issue and branch.

### Future-ready directions

| Direction | Why | Status |
| --- | --- | --- |
| Accessibility and ageing mode: step-free paths, rest points at set intervals, toilets | Poland's population is projected to shrink and age (see evidence). Same routing engine, different weights | Roadmap slide; needs verified data |
| Heat-resilient "cool route": favour shade, fountains and drinking water | European cities lack shade near homes (see evidence) | Roadmap slide. Warsaw tree and fountain datasets and licences are **unverified**; Sonia checks first. Keep the existing greenery proxy label |
| Pluggable city layers: each layer has an ID, geometry, time range and provenance | History, air quality, noise and events become one pattern. Pitch: "add a layer, don't rewrite the app" | Architecture talking point; the era layer is the first instance |
| Agent-ready by design | MCP is now a Linux Foundation standard (see evidence). The app already exposes MCP and plans token-scoped personal context | Existing core work; pitch point |
| Wikidata-linked place IDs | Stable IDs help future digital twins, AR layers and other cities. Cheap now, costly to retrofit | Optional; add only if a place pipeline already carries IDs |
| Sensory profiles: quiet, low-crowd, low-stimulation routing | Extends the quiet-route concept to sensory-sensitive users | Roadmap slide |
| Community memory: resident-contributed stories and photos | Needs moderation, consent and rights management | Roadmap only; do not build |
| AR walk overlay | Excluded from the core build by AGENTS.md. The era layer is the data foundation an AR device would render | Concept slide only |

### Research evidence (17 October 2026)

Gathered from web search summaries and secondary coverage, not primary reports. Verify any figure before it appears on a slide.

- **Ageing:** GUS's 2025 projection puts Poland's population about 6.6 million lower by 2060, with a median age above 50. A separate low-fertility simulation reaches about 28.4 million. Figures differ between reports, so cite direction only. [Intellinews](https://www.intellinews.com/polish-population-to-shrink-by-6-6mn-by-2060-404057), [Intellinews simulation](https://www.intellinews.com/poland-s-population-could-shrink-by-9mn-to-to-28-4mn-by-2060-simulation-shows-410121/).
- **Heat and shade:** a 2026 RMIT analysis found 84% of 5.5 million buildings in seven European countries below the 30% nearby canopy level linked to reducing urban heat. A Loughborough analysis (preliminary) found over 90% of buildings in London, Paris and Madrid lacked enough shade. A 2023 Lancet modelling study, reported secondhand, found 30% tree cover cuts about 0.4 °C locally. [RMIT](https://www.rmit.edu.au/news/all-news/2026/jul/european-heatwave), [Loughborough](https://www.lboro.ac.uk/media-centre/press-releases/2026/september/trees-cool-down-cities/), [Khaleej Times](https://www.khaleejtimes.com/world/europe/trees-could-cut-urban-heatwave-mortality-by-a-third-study?amp=1).
- **Agent interoperability:** Anthropic donated MCP to the Linux Foundation's Agentic AI Foundation. It reports more than 10,000 active public MCP servers. The announcement date differs between sources, and a download-count figure is unverified. [Anthropic](https://www.anthropic.com/news/donating%2Dthe%2Dmodel%2Dcontext%2Dprotocol%2Dand%2Destablishing%2Dof%2Dthe%2Dagentic%2Dai%2Dfoundation).
- **Digital identity:** eIDAS 2.0 requires every EU member state to offer at least one certified EU Digital Identity Wallet by 24 December 2026. Whether Poland builds it into mObywatel or a separate app is contested. Check the Ministry of Digital Affairs before claiming either. [bank.pl](https://bank.pl/?p=559565), [Tabletowo](https://www.tabletowo.pl/?p=1037674), [android.com.pl](https://android.com.pl/tech/1019960-mobywatel-ue-eidas-2-0-eudi-wallet/).
- **Tourism demand:** international arrivals grew about 4% in 2025 to roughly 1.52 billion; UN Tourism expects 3–4% growth in 2026. No current overtourism data was found. [Moodie Davitt Report](https://moodiedavittreport.com/international-tourist-arrivals-climb-4-in-2025-as-travel-returns-to-pre-pandemic-growth-path/).
- **Not verified:** Warsaw tree and drinking-fountain datasets and their licences; licences for historical imagery. Warsaw city data requires crediting the source, creation time and retrieval date ([terms](https://mapa.um.warszawa.pl/en/warunki.html)).
- **Horizon note:** forecasts to 2076 are scenarios, not predictions. Present near-term trends as evidence-backed and anything beyond about 2045 as speculation.

## Data requirements

These are desired data categories. Availability, coverage, freshness, and access still need to be checked.

| Category | Desired data |
| --- | --- |
| Roads and traffic | Traffic conditions, accidents, ongoing roadworks, and planned roadworks |
| Transport | Public transport routes, cycling routes, and locations for transport changes |
| Vehicle services | Petrol stations and electric vehicle charging locations |
| Environment | Air quality readings, noise levels, and greenery |
| Places | Museums, landmarks, historic locations, restaurants, and pubs |
| Activities | Events, meetups, and promotions |
| Personal context | User calendar, habits, interests, saved locations, and preferences |

### Data approach

- Use available open data where practical.
- Mock missing data needed to demonstrate the concept.
- Clearly identify mocked data in the demo.
- Treat personal context as optional user-provided information.

## Privacy and security

Target design for a production version. The hackathon demo does not implement it, but must not contradict it.

- **User-side storage:** Preferences, habits, saved places, trip history, and achievements stay on the user's device by default. The server does not keep user profiles.
- **Token-scoped requests:** When a service needs personal context, the client sends only the fields that request needs, with a short-lived, scoped access token. The server uses the data for that request and does not store it.
- **Least privilege:** Each token grants one purpose, such as route planning, for a limited time. Users can revoke access at any time.
- **Personal agents:** The same rules apply to agents that call the MCP server. The agent asks the user's device for context through a token; the server never holds the user's history.
- **Transport and secrets:** HTTPS only. API keys and provider credentials stay on the backend and never reach the browser.
- **User control:** Users can view, export, and delete their local data.

### What this means for the demo

- Keep route requests stateless. Do not store preferences or trip history in the backend SQLite database; it holds city data only.
- Demo profiles and trip history are fictional fixtures, labelled as such.
- In the pitch, describe token-based access as the planned design, not as a working feature.
- Social walking (see Cultural layer, community and future-ready directions) is simulated in the demo with fictional, labelled walkers. A real version would need an ephemeral presence store, which is an explicit, Delta-approved exception to the rules above.

## Planned deliverables

| Deliverable | Purpose |
| --- | --- |
| Model Context Protocol (MCP) server | Provide city data and relevant capabilities to AI agents |
| Web interface | Show the map, routes, places, and recommendations |
| Progressive web app (PWA) | Allow optional installation on a device |
| Augmented reality (AR) compatibility mock-up | Demonstrate how the experience could work on future AR devices |

## Visual direction

- A 2D isometric map of Warsaw.
- Colour-coded, glowing, and highlighted routes.
- 3D renders of landmark buildings.
- Pop-up cards above locations with AI summaries of landmarks or events.
- A visual identity that combines futuristic technology with recognisable Warsaw landmarks and character.

## Monetisation concept

Offer an advertising platform for museums, event organisers, bars, and restaurants, including special promotions.

How promotions affect recommendations remains a team decision. A suggested principle is to label sponsored placements clearly.

## Pitch hooks

- **Warsaw 2076:** Show how a useful tool today supports the city's longer-term future.
- **Greener travel:** Highlight routes that consider cycling, public transport, greenery, and electric vehicle charging.
- **AI agents:** Present city data as something personal agents can use to support everyday decisions.
- **Augmented reality:** Show a mock-up of route guidance and place information on AR devices.
- **Cyberpunk 2077:** Use it as a creative reference for the futuristic presentation.
- **Warsaw DNA:** Keep the city's landmarks, culture, and identity central to the experience.

### Suggested pitch line

“A personalised guide to Warsaw that plans your route around your day, your interests, and the city around you.”

## Decisions for the team

The following are planning prompts, added to help turn the concept into a hackathon build.

- [ ] Choose one primary user scenario for the demonstration.
- [ ] Confirm which city datasets are usable.
- [ ] Decide which data and integrations to mock.
- [ ] Agree on the minimum working route-planning flow.
- [ ] Prioritise the deliverables within the hackathon time limit.
- [ ] Choose the technology stack and divide responsibilities.
- [ ] Prepare the pitch narrative and demonstration sequence.

**Next step:** Agree on the main demo scenario and the smallest working version that proves the idea.

## Build scope

The full concept above is the vision. PLAN.md defines the hackathon scope and mandatory stop.
