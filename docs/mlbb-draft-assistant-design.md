# MLBB Draft Assistant Design

## 1. Project Overview

This starter app is a SolidJS + Tailwind web tool for Mobile Legends drafting. It supports rank-based bans, alternating picks, explainable hero recommendations, team-composition scans, and post-draft counter-item suggestions.

## 2. Recommended System Design

- Keep raw data in `dataset/` and app code in `src/`.
- Store recommendation weights in config instead of hardcoding behavior in components.
- Model hero strength as explicit tags plus numeric ratings, not opaque learned scores.
- Separate three engine concerns:
  - `recommendations.ts` for pick/ban scoring
  - `team-analysis.ts` for composition metrics
  - `item-recommendations.ts` for post-draft counter builds

## 3. JSON Schemas

Schema files live in `dataset/schemas/`.

- `hero.schema.json`: starter runtime schema for hero seed entries
- `item.schema.json`: starter runtime schema for item seed entries
- `synergy-tags.schema.json`: descriptor schema for synergy tag definitions
- `counter-tags.schema.json`: descriptor schema for counter tag definitions
- `team-composition-metrics.schema.json`: descriptor schema for composition metrics

## 4. Sample Hero And Item JSON

Seed data lives in:

- `dataset/samples/heroes.seed.json`
- `dataset/samples/items.seed.json`

The current starter roster includes 20 heroes and 5 items sourced from Liquipedia-linked pages and normalized into a compact runtime shape.

## 5. Scoring Model

Counter score factors:

- direct overlap with enemy threat tags
- response-tag match against enemy draft profile
- range or mobility advantage
- survivability into enemy burst
- itemization flexibility for bruisers, roamers, and tanks

Synergy score factors:

- overlap with allied tags and roles
- fit with the current team style
- follow-up on allied engage or pick tools
- peel coverage for carries
- damage-type and role-gap correction
- objective-control coverage

Item score factors:

- overlap with enemy threat tags
- role and tag fit for the current hero
- damage-type compatibility
- situational anti-heal, anti-burst, anti-tank, or anti-dive needs

## 6. SolidJS App Architecture

- `src/app/config/`: draft rules, tags, scoring weights
- `src/app/types/`: typed data and draft state models
- `src/app/engines/`: recommendation and analysis logic
- `src/app/stores/`: reactive draft store and derived selectors
- `src/app/components/`: draft UI, panels, and primitives
- `src/App.tsx`: root app mount

## 7. UI Component Plan

- `RankSelector`: Epic, Legend, Mythic draft setup
- `DraftProgress`: active phase and team turn
- `TeamColumn`: bans and picks for each side
- `HeroPool`: searchable available-hero grid
- `SuggestionPanel`: ban or pick recommendations with reasons
- `TeamAnalysisPanel`: metric bars, strengths, weaknesses, playstyle, win condition
- `ItemRecommendationPanel`: post-draft counter build guidance per hero

## 8. Starter Code

Core starter files:

- `src/app/stores/draft-store.ts`
- `src/app/engines/recommendations.ts`
- `src/app/engines/team-analysis.ts`
- `src/app/engines/item-recommendations.ts`
- `src/app/components/ui/AppShell.tsx`

## 9. Next Implementation Priorities

1. Replace the starter seed with a fuller Liquipedia scrape and validation pipeline.
2. Add lane-specific matchup scoring and explicit pick order rules.
3. Add patch/version metadata and data-diff tooling.
4. Add saved draft snapshots and export/share support.
5. Add matchup history, win-rate overlays, and calibration controls for scoring weights.
