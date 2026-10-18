# Warsaw 2076: frontend redesign review

> **Historical (18 October 2026).** This review led to the "Find YOUR way" shell (#118). Kept as a record; see README.md and docs/DECISIONS.md for what was built.

**Date:** 17 October 2026  
**Status:** Ideas for team review. Implementation is on hold pending Delta’s feedback.

This brief records the requested product direction, feedback on the rejected implementation, and proposals for the next attempt. The team has not approved a replacement layout or rendering approach.

## Current baseline

The local app is restored to commit `4fd1e15`, immediately before PR #83. This includes PR #82’s Moon UI and the existing historical overlay. PR #83 added pitch documentation; it did not introduce the rejected redesign.

[Redesign PR #86](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/pull/86) is closed and unmerged. Its implementation and later unfinished changes remain recoverable on separate local branches. They are reference material, not the approved starting point.

The existing [delivery plan](../PLAN.md), [product concept](../IDEA.md), and [frontend handover](Start_Here_Codex_Design.md) remain relevant. This brief does not replace their scope decisions or deadlines.

## Requested experience

Build a city-friendly route planner with a futuristic character. The opening experience should feel simple, considered, and complete.

A person starts with a basic planning panel. They can describe an outing to an AI agent or choose a destination directly. They can then set preferences, add stops, and leave a comment that adjusts the recommendations.

The map provides context and discovery. A quiet paper-style city surrounds a colourful selected route, with 3D detail concentrated near that route. Place cards connect visibly to their locations.

The core demonstration remains a quiet, green museum outing in Warsaw: describe the outing, compare candidate routes, and inspect places. The redesign should preserve that working flow.

### Intended flow

1. Describe an outing or select a destination.
2. Choose mood, travel mode, available time, and other preferences.
3. Add, remove, or reorder stops and enter an optional comment.
4. Receive candidate routes with understandable differences and grounded explanations.
5. Select a route and inspect location cards on the map or through an accessible list.
6. Refine the request without losing the outing context.
7. Optionally explore history, local offers, city feedback, or the AR concept.

## Visual direction

### Moon components

Use [Moon Design System v1](https://www.figma.com/community/file/1002945721703152933/moon-design-system-v1) as the component reference. The result needs recognisable Moon typography, proportions, spacing, fields, buttons, selection states, and surfaces. Naming CSS variables after Moon is insufficient.

Both light and dark modes are requested. Route colours should express mood while ordinary controls remain consistent and readable. Colour must have a corresponding text label or state indicator.

The requested shared token location is `design/tokens`. That directory was introduced in the archived attempt; the restored baseline keeps Moon variables in `frontend/src/style.css`. The team should agree the token source before moving them again.

Direct inspection of the supplied Figma file was unavailable during the attempt. The implementation used PR #82’s values and later consulted Moon’s public documentation. Exact fidelity to the supplied file remains unverified. Confirm font licensing and any fallback before bundling a font.

### Paper city and route detail

The [existing isometric mockup](../mockups/warsaw-2076/README.md) is the main visual reference for the paper city and route-focused detail.

- Keep the surrounding city quiet enough for the selected route to lead.
- Concentrate 3D buildings and richer detail around the selected route.
- Use a restrained neon glow, colour-coded by the selected or agent-suggested mood.
- Keep route geometry legible beneath buildings, cards, and historical imagery.
- Make cards feel attached to locations, with clear relationships to numbered stops.
- Preserve useful map controls and visible attribution.

Using the original mockup almost literally was proposed after the rejection. **That proposal has not been accepted.** The team should decide how closely the next composition follows it.

## Features discussed

| Area | Requested behaviour | Demo boundary |
| --- | --- | --- |
| Conversation | Interpret the outing, explain choices, and accept follow-up changes | Label rule-based or fixture responses accurately when AI is unavailable |
| Destination and stops | Select a destination, add ordered stops, and customise through comments | The API must confirm that requested stops were applied |
| Route comparison | Explain differences in duration, distance, stops, and preference fit | Keep source labels and identify environmental estimates |
| Location cards | Show landmarks, historical context, shops, and relevant services near the route | Use grounded information; label missing or fictional content |
| Promotions | Show optional offers relevant to the route preferences | Clearly fictional businesses/offers; no real advertising or redemption service |
| Historical layer | Animate a then-and-now comparison with historical image overlays | Preserve existing 1935/1939/1945 imagery, dates, attribution, and availability states |
| City feedback | Record service feedback and missing facilities or conditions at a place or between destinations | Browser-local examples with export/delete; no claim that a municipality received them |
| AR preview | Offer an optional augmented reality concept with place information and historical image overlays | Explicitly simulated; camera access and live AR tracking are not required |

### City feedback purpose

People should be able to describe missing seating, drinking water, accessible crossings, quieter surroundings, or other service needs. Feedback should identify a place or a section between destinations.

The longer-term purpose is to help providers and municipalities understand unmet needs and improve quality of living. Any future submission or aggregation service needs a separate agreement on consent, location detail, moderation, retention, and recipients.

### Existing roadmap

These ideas sit alongside the capabilities already documented in `IDEA.md`. They do not automatically move every roadmap item into the demo.

Personal agent integration, optional calendar context, achievements, social walking, sensory profiles, heat-aware routing, and wider transport support keep their existing scope and data requirements. Interface accessibility does not establish that a real-world route is step-free or safe.

## Feedback on the rejected work

Delta’s feedback was that the whole UI looked unfinished and unpolished, the layouts felt flat, and the components did not feel like Moon. The 3D rendering stuttered and changed inconsistently between zoom levels. Later images still did not demonstrate an acceptable direction.

The attempted revisions did not resolve those concerns. Neither the large sidebar layout nor the subsequent bottom-row route comparison has design approval.

Passing builds, interaction tests, and automated accessibility checks did not establish visual quality. Future reviews must assess the actual composition and interaction, not treat successful checks as design acceptance.

## Rendering requirements and technical options

Buildings should retain their geometry and height as the user zooms, pans, or rotates. Changing the route may change the detailed corridor; changing the camera should not replace the city with visibly different building shapes.

The rejected implementation rebuilt corridor geometry from currently loaded map tiles. Tile detail changed with zoom, and repeated scans created additional work. An archived revision explored fixed cached footprints and filtering in a Web Worker. That is a technical option, not an approved solution.

Before choosing the renderer, compare the existing MapLibre implementation with the mockup’s rendering approach. Preserve the current stack unless the team explicitly agrees a change.

Proposed acceptance checks:

- No visible building shape or height jumps during repeated zoom changes.
- No repeated building-data rebuilds caused only by camera movement.
- No continuing map repaint loop after the view settles.
- Responsive dragging, zooming, route selection, and panel interaction on target devices.
- Clear loading and failure states for 3D detail, tiles, and historical imagery.
- Documented cache coverage, freshness, height estimates, and any visual exaggeration.

Software-rendered browser tests can detect data churn and some stalls. They cannot establish smooth performance on the devices used for the demonstration. The team should agree a device and performance budget before implementation.

## Accessibility and data integrity

The redesigned interface should support keyboard navigation, visible focus, sensible focus return, readable contrast, larger text, and reduced motion. Every map stop needs an equivalent list entry. Mobile controls need adequate touch targets and usable layouts with enlarged text.

Reduced motion must cover camera movement, route effects, historical transitions, and interface animation. Historical comparison also needs direct controls that do not depend on watching an animation.

Keep provenance readable without overwhelming the main task. Green and quiet scores remain labelled proxies. Straight-line fixtures must not look like verified street routes. Historical imagery, cached data, fictional promotions, and simulated AR each need clear labels.

Retain the project’s privacy model. The backend stores city data, not personal profiles or trip history. Demo feedback remains local unless the team separately approves a submission service.

## Backend requests already opened

Both issues were open when this brief was written. Their creation does not establish implementation or an agreed contract.

| Issue | Request |
| --- | --- |
| [#84: Catalogue search](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/84) | Bounded destination/stop search with provenance and suitable matching for Polish place names |
| [#85: Ordered itinerary](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/85) | Explicit destination, ordered intermediate stops, comments, validation, capability signalling, and response confirmation |

The archived frontend proposed `destination_place_id`, `via_place_ids`, and `applied_itinerary`. Delta and Alban should agree the contract before those fields become an integration assumption. REST and MCP must continue to use the same planning services.

## Proposed next phases

1. **Agree the visual target.** Review one complete desktop screen and one phone screen against the mockup and Moon reference.
2. **Validate the renderer.** Demonstrate stable 3D detail and acceptable interaction on the target devices.
3. **Build the core flow.** Integrate planning, route comparison, and place cards using the agreed components and API.
4. **Add optional demo layers.** Introduce history, fictional offers, feedback, and simulated AR without crowding the core flow.
5. **Review and prepare the demo.** Use Better UI, Impeccable, and Improve Animations regularly, alongside visual review and device testing.

These phases are a proposal for team discussion. Feature work remains subject to `PLAN.md`: freeze at 06:00 on 18 October 2026, Europe/Warsaw. A redesign does not justify extending the freeze.

## Decisions for the team

- [ ] Choose the visual reference and the degree of fidelity to the original mockup.
- [ ] Confirm the Moon component examples, typography, and light/dark token source.
- [ ] Agree the desktop and phone composition before rebuilding the full interface.
- [ ] Select the map rendering approach, coverage, and target-device performance budget.
- [ ] Decide how agent-suggested mood interacts with explicit user preferences.
- [ ] Confirm the destination/stop API contract and which demo layers fit the remaining scope.
- [ ] Name the reviewers and define what must be demonstrated before implementation resumes.

Delta will review this brief with the team and return with direction. The restored app remains the working baseline in the meantime.
