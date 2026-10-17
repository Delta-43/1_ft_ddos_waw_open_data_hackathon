# Warsaw 2076: Personalised city navigation

Team concept notes for the Warsaw Open Data Hackathon 2026.

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
