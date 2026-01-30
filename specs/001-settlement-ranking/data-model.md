# Data Model

## Source Schema (galaxy JSON records)
Each line in the input file represents a **Star System** object. The sample in [galaxy_small.json](galaxy_small.json) is an array of these objects, but the CLI will operate on line-delimited JSON records.

### StarSystem
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id64` | number | yes | Stable system identifier. |
| `name` | string | yes | System name (used for tie-breaker). |
| `coords` | object | yes | 3D position used for distance calculations. |
| `coords.x` | number | yes | X coordinate. |
| `coords.y` | number | yes | Y coordinate. |
| `coords.z` | number | yes | Z coordinate. |
| `population` | number | yes | Populated if $> 0$. |
| `bodyCount` | number | no | Count of bodies. |
| `allegiance` | string \| null | no | Optional faction metadata. |
| `government` | string | no | Optional metadata. |
| `primaryEconomy` | string | no | Optional metadata. |
| `secondaryEconomy` | string | no | Optional metadata. |
| `security` | string | no | Optional metadata. |
| `date` | string | no | Observation timestamp. |
| `bodies` | Body[] | yes | List of stars/planets; required for scoring. |
| `stations` | Station[] | no | Ignored by scoring. |
| `controllingFaction` | object | no | Optional metadata. |
| `factions` | array | no | Optional metadata. |

### Body
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id64` | number | yes | Body identifier. |
| `bodyId` | number | yes | Body index within the system. |
| `name` | string | yes | Body name. |
| `type` | string | yes | `"Star"` or `"Planet"` (others ignored). |
| `subType` | string | no | Planet/star subtype (used for scoring). |
| `isLandable` | boolean | no | Landable planet indicator. |
| `terraformingState` | string | no | `"Terraformable"`, `"Not terraformable"`, etc. |
| `distanceToArrival` | number | no | Not used for scoring. |
| `mainStar` | boolean | no | Not used for scoring. |
| `stations` | Station[] | no | Ignored by scoring. |
| `rings` | Ring[] | no | Icy rings used for tritium scoring. |

### Ring (for tritium scoring)
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | yes | Ring name. |
| `ringClass` | string | yes | Ring type; `"Icy"` indicates tritium candidate. |
| `reserveLevel` | string | no | `"Pristine"` = 10 points, otherwise 5 points. |

### Station (non-scoring)
Stations appear within systems and bodies; they are ignored for scoring and eligibility.

## Derived Entities

### SettlementCandidate
| Field | Type | Notes |
| --- | --- | --- |
| `systemName` | string | From `StarSystem.name`. |
| `distanceToSol` | number | Computed from `coords` vs. Sol. |
| `totalScore` | number | Sum of scoring components. |
| `scoreBreakdown` | object | Counts and points for each rule. |

## Validation Rules
- Reject records missing `name`, `coords.{x,y,z}`, `population`, or `bodies`.
- Treat population $> 0$ as populated; $\le 0$ as empty.
- A system is eligible for ranking only if it is empty and has at least one planet.
- Ignore systems with zero planets by assigning score 0 and excluding from results.
- Score calculations rely on body `type`, `subType`, `isLandable`, and `terraformingState`.
- Icy ring detection requires `rings` array to exist with at least one ring where `ringClass === "Icy"`.
- Missing or null `rings` array treated as having 0 icy rings.

## Scoring Mapping (per requirements)

### Industrial Strategy (default)
- Star: +1 (per body where `type == "Star"`).
- Neutron Star: +2 (per body where `type == "Star"` and `subType` indicates neutron).
- Planet: +5 (per body where `type == "Planet"`).
- Gas Giant: +4 (per body where `subType` includes "gas giant").
- Landable: +7 (per body where `isLandable == true`).
- Water World: +8 (per body where `subType` includes "water world").
- Terraformable: +9 (per body where `terraformingState == "Terraformable"`).
- High Metal Content: +10 (per body where `subType` includes "high metal content").

### Agriculture Strategy
- Identical to Industrial strategy (MVP placeholder for future agricultural-specific rules).

### Tritium Strategy
- Icy Ring (Regular): +5 (per ring where `ringClass === "Icy"` and `reserveLevel` is not "Pristine").
- Icy Ring (Pristine): +10 (per ring where `ringClass === "Icy"` and `reserveLevel === "Pristine"`).
- Systems with 0 icy rings are filtered out during read phase (not scored).
