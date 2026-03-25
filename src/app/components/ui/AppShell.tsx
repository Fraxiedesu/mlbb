import { Show } from "solid-js";
import { BAN_COUNTS } from "@/app/config/draft";
import { DraftProgress } from "@/app/components/draft/DraftProgress";
import { HeroPool } from "@/app/components/draft/HeroPool";
import { RankSelector } from "@/app/components/draft/RankSelector";
import { TeamColumn } from "@/app/components/draft/TeamColumn";
import { ItemRecommendationPanel } from "@/app/components/panels/ItemRecommendationPanel";
import { SuggestionPanel } from "@/app/components/panels/SuggestionPanel";
import { TeamAnalysisPanel } from "@/app/components/panels/TeamAnalysisPanel";
import { Pill } from "@/app/components/ui/Pill";
import { SectionCard } from "@/app/components/ui/SectionCard";
import { createDraftStore } from "@/app/stores/draft-store";

export function AppShell() {
  const draft = createDraftStore();

  return (
    <main class="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl space-y-6">
        <section class="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,138,61,0.15),rgba(66,198,207,0.12),rgba(7,17,31,0.95))] p-6 shadow-panel">
          <div class="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <div class="space-y-4">
              <div class="flex flex-wrap gap-2">
                <Pill label={`${draft.heroes.length} seeded heroes`} tone="teamA" />
                <Pill label={`${draft.items.length} seeded counter items`} tone="teamB" />
                <Pill label="Liquipedia-linked starter dataset" />
              </div>
              <div>
                <h1 class="font-display text-4xl font-semibold tracking-tight text-dawn-100 sm:text-5xl">MLBB Draft Assistant</h1>
                <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-200/85 sm:text-base">
                  Simulate bans and picks, keep invalid heroes out of the pool, score counter and synergy options after every step, and switch into counter-item recommendations once the draft closes.
                </p>
              </div>
              <RankSelector rank={draft.state.rank} onChange={draft.setRank} />
              <DraftProgress action={draft.currentAction()} step={draft.state.currentStep} total={draft.sequence().length} />
            </div>

            <div class="rounded-3xl border border-white/10 bg-black/15 p-4">
              <p class="mb-2 font-display text-lg font-semibold text-dawn-100">Starter Scope</p>
              <p class="text-sm leading-6 text-slate-300/85">
                The current seed focuses on a production-ready architecture, an explainable scoring engine, and a sourced starter roster. The next data pass can swap in a fuller scrape without rewriting the UI or recommendation formulas.
              </p>
              <div class="mt-4 flex flex-wrap gap-2">
                <button type="button" class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10" onClick={() => draft.undoLast()}>
                  Undo Last
                </button>
                <button type="button" class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10" onClick={() => draft.resetDraft()}>
                  Reset Draft
                </button>
              </div>
            </div>
          </div>
        </section>

        <div class="grid gap-4 xl:grid-cols-2">
          <TeamColumn team="A" bans={draft.teamBans("A")} picks={draft.teamPickEntries("A")} banSlots={BAN_COUNTS[draft.state.rank]} />
          <TeamColumn team="B" bans={draft.teamBans("B")} picks={draft.teamPickEntries("B")} banSlots={BAN_COUNTS[draft.state.rank]} />
        </div>

        <Show
          when={!draft.isComplete()}
          fallback={
            <SectionCard title="Post-Draft Mode" subtitle="The hero pool is hidden after all 10 picks lock so analysis and item recommendations stay in view.">
              <p class="text-sm text-slate-300/85">Counter-item panels and team composition breakdowns are now prioritized below for both teams.</p>
            </SectionCard>
          }
        >
          <div class="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <SectionCard title="Draft Controls" subtitle="Separate ban phase by rank, then follow the configured 1-2-2-2-2-1 pick order.">
              <HeroPool
                heroes={draft.availableHeroes()}
                activeTeam={draft.activeTeam()}
                phase={draft.stage()}
                missingLanes={draft.activeMissingLanes()}
                onSelect={draft.commitHero}
              />
            </SectionCard>

            <SuggestionPanel
              mode={draft.stage() === "ban" ? "ban" : "pick"}
              recommendations={draft.stage() === "ban" ? draft.banRecommendations() : draft.pickRecommendations()}
            />
          </div>
        </Show>

        <TeamAnalysisPanel teamA={draft.analyses().A} teamB={draft.analyses().B} />

        <Show when={draft.itemRecommendations()}>
          {(items) => (
            <div class="space-y-6">
              <ItemRecommendationPanel title="Team A Counter Items" recommendations={items().A} tone="teamA" />
              <ItemRecommendationPanel title="Team B Counter Items" recommendations={items().B} tone="teamB" />
            </div>
          )}
        </Show>
      </div>
    </main>
  );
}

