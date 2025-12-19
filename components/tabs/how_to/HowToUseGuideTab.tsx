import { SectionCard, StatTile } from '../../ui';

interface HowToUseGuideProps {
  profileLoaded: boolean;
  playerReady: boolean;
  opponentReady: boolean;
  rallyReady: boolean;
  fightReady: boolean;
  hasError: boolean;
  errorMessage?: string | null;
  playerCapacity: number | null;
  opponentCapacity: number | null;
  roundsSimulated: number;
}

type GuideStepStatus = 'complete' | 'pending' | 'error';

interface GuideStep {
  id: string;
  title: string;
  summary: string;
  checklist: string[];
  status: GuideStepStatus;
}

export default function HowToUseGuideTab({
  profileLoaded,
  playerReady,
  opponentReady,
  rallyReady,
  fightReady,
  hasError,
  errorMessage,
  playerCapacity,
  opponentCapacity,
  roundsSimulated
}: HowToUseGuideProps) {
  const steps: GuideStep[] = [
    {
      id: 'profiles',
      title: '1. Configure Player & Opponent',
      summary: 'Load permanent stats, heroes, pets, and additive stacks so the calculator mirrors your in-game account.',
      checklist: [
        'Use the Player/Opponent tabs to enter gear, research, city buffs, pets, and VIP values.',
        'Assign heroes per troop type plus up to four joiners; rally leaders pull their exclusive skills and weapon bonuses automatically.',
        'Verify capacity overrides only when you need to match a manual number from screenshots.'
      ],
      status: playerReady && opponentReady ? 'complete' : profileLoaded ? 'pending' : 'pending'
    },
    {
      id: 'rally',
      title: '2. Build the Rally Config',
      summary: 'Pick march leaders, stack capacity sources, and set troop ratios that reflect the rally you plan to launch.',
      checklist: [
        'Confirm the Capacity Breakdown (Base + Temporary) matches your deployment/rally totals.',
        'Use the Troop Mix Quick Editors to match the desired march size for both sides.',
        'Surface leader/joiner bonuses and multipliers directly in this tab to ensure parity.'
      ],
      status: rallyReady ? 'complete' : 'pending'
    },
    {
      id: 'results',
      title: '3. Interpret the Results',
      summary: 'Run the fight simulation, then compare troop losses, special bonuses, capacity deltas, and the damage debug table.',
      checklist: [
        'Battle Predictor mirrors an in-game report: Player left, Opponent right, including survivors and hero kill counts.',
        'Special Bonuses table enumerates additive buffs; Capacity Comparison shows where deployment numbers come from.',
        'Damage Calculation Debug exposes every multiplier (√troops, morale, type advantage) so you can validate parity with reports.'
      ],
      status: hasError ? 'error' : fightReady ? 'complete' : 'pending'
    }
  ];

  const dataFlowOverview = [
    'Player/Opponent tabs capture permanent stats and convert them into SideBaseStats.',
    'Rally Config combines stats with leaders/joiners, capacity stacks, and troop mix to build FighterSnapshots.',
    'Fight simulation iterates BattleRound → Fight, applying morale, type advantage, DOT, and control effects each round.',
    'Results tab visualizes totals, special bonuses, capacity deltas, and per-hit math via the Damage Calculation Debug panel.'
  ];

  const interpretationTips = [
    'Troop Mix Quick Editor accepts any percentages; the sim normalizes internally but the UI keeps your raw inputs for clarity.',
    'Special Bonuses table is additive-only; multiplicative sources (city, pet skills) stay inside the stat pipeline per Whiteout rules.',
    'Capacity Comparison highlights manual overrides; if totals look off, trace each line item rather than adjusting results.',
    'Damage Calculation Debug chips map directly to the guide’s formula: Offense ÷ Mitigation = troop losses.',
    'Battle Analysis now charts defender casualties per turn; spikes point to skill bursts or targeting changes—expand turns to see the exact math.'
  ];

  const diminishingReturnsGuide = [
    'Damage uses √(troops) per hit: doubling bodies gives ~1.41× power at large rally sizes, not 2×.',
    'Examples: 1k→4k ≈ 2× power; 10k→20k ≈ 1.41×. Each extra troop contributes less than the one before.',
    'Stat gains (Attack, Lethality, Defense, HP, tier) beat raw count once you are at 300k+ marches or rallies.',
    'Test at realistic march sizes; 1–2k troop trials understate losses because √ scaling accelerates with size.'
  ];

  const damageFoundationPoints = [
    'Damage = Coefficient × √(Troops) × Attack × Lethality ÷ Enemy Defense (mirrors the Damage Calculation Debug chips).',
    'Coefficient captures hidden troop-type/tier/Fire Crystal factors; √(Troops) encodes diminishing returns.',
    'Attack and Lethality push offense; Enemy Defense and HP absorb it; troop count helps but asymptotically.'
  ];

  const statInfluence: Array<{ stat: string; note: string }> = [
    { stat: 'Attack', note: 'Boosts raw outgoing damage.' },
    { stat: 'Lethality', note: 'Cuts through enemy defense.' },
    { stat: 'Defense', note: 'Reduces incoming damage.' },
    { stat: 'Health (HP)', note: 'Increases survivability across hits.' },
    { stat: 'Troop Count', note: 'Adds strength with diminishing returns via √(troops).' }
  ];

  return (
    <div className="tab-content active">
      <div className="card info-card">
        <h3>How-to-Use</h3>
        <p className="text-sm text-gray-400 dark:text-gray-400 mt-2">
          Follow this flow to keep the calculator aligned with the “Whiteout Survival: Battle Stat & Damage Calculation Guide”.
          Every tab feeds the fight engine, and this overview spells out what to fill in and how to read the outputs.
        </p>

        <div className="grid gap-4 lg:grid-cols-3 mt-4">
          {steps.map((step) => (
            <GuideStepCard key={step.id} step={step} />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <StatTile
            label="Player Rally Capacity"
            value={typeof playerCapacity === 'number' ? playerCapacity.toLocaleString() : '—'}
            description="Sum of base + temporary stacks driving the Player mix and Troop Power Comparison totals."
          />
          <StatTile
            label="Opponent Rally Capacity"
            value={typeof opponentCapacity === 'number' ? opponentCapacity.toLocaleString() : '—'}
            description="Mirrors the Opponent section inputs so both sides simulate comparable march sizes."
          />
          <StatTile
            label="Simulation Status"
            value={hasError ? 'Needs attention' : fightReady ? `${roundsSimulated} rounds` : 'Waiting for inputs'}
            description={
              hasError
                ? 'Fix the highlighted inputs (usually capacity or mix) and rerun.'
                : fightReady
                  ? 'Current rally configuration fed the fight engine above.'
                  : 'Complete Player/Opponent profiles and Rally Config to unlock results.'
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <SectionCard title="Data Flow Overview" collapsible defaultCollapsed>
            <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
              {dataFlowOverview.map((item, index) => (
                <li key={`data-flow-${index}`}>{item}</li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Interpreting the Dashboard" collapsible defaultCollapsed>
            <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
              {interpretationTips.map((item, index) => (
                <li key={`tips-${index}`}>{item}</li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Diminishing Returns: √Troops Rule" collapsible defaultCollapsed>
            <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
              {diminishingReturnsGuide.map((item, index) => (
                <li key={`returns-${index}`}>{item}</li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr] mt-6">
          <SectionCard title="Damage Foundation" description="Damage = Coefficient × √(Troops) × Attack × Lethality ÷ Enemy Defense">
            <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1 mt-2">
              {damageFoundationPoints.map((item) => (
                <li key={item.substring(0, 32)}>{item}</li>
              ))}
            </ul>
            <div className="mt-3 rounded-xl bg-black/30 border border-white/5 p-3">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Balance Equation</div>
              <p className="font-mono text-xs text-white mt-1">
                ((Attacker_HP×Attacker_ATK×Attacker_LETH×Attacker_DEF)) / ((Defender_HP×Defender_ATK×Defender_LETH×Defender_DEF)) = ((Defender_Troops)/(Attacker_Troops))^1.5
              </p>
              <p className="text-[11px] text-gray-400 mt-1">1 = attacker wins; &lt;1 = defender holds.</p>
            </div>
          </SectionCard>

          <SectionCard title="Stat Influence Overview">
            <ul className="mt-3 space-y-2">
              {statInfluence.map((item) => (
                <li key={item.stat} className="text-sm text-gray-300">
                  <span className="font-semibold text-white">{item.stat}:</span> {item.note}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-gray-400 mt-3">
              All interact — imbalance in any stat weakens total efficiency. √(troops) scaling keeps large marches from winning on bodies alone.
            </p>
          </SectionCard>
        </div>

        {hasError && (
          <SectionCard
            title="Troubleshooting"
            className="mt-6 border-rose-500/40 bg-rose-950/40"
          >
            <p className="text-sm text-rose-100">
              The last simulation failed with: <span className="font-mono">{errorMessage ?? 'Unknown issue'}</span>. Revisit the Rally Config
              and capacity stacks for missing values, ensure both sides have troops assigned, then rerun the Results tab.
            </p>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

function GuideStepCard({ step }: { step: GuideStep }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">{step.id}</div>
          <div className="text-base font-semibold text-white">{step.title}</div>
        </div>
        <GuideStatusBadge status={step.status} />
      </div>
      <p className="text-sm text-gray-300 dark:text-gray-300">{step.summary}</p>
      <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
        {step.checklist.map((item) => (
          <li key={`${step.id}-${item.substring(0, 12)}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function GuideStatusBadge({ status }: { status: GuideStepStatus }) {
  const config: Record<GuideStepStatus, { label: string; className: string }> = {
    complete: { label: 'Ready', className: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30' },
    pending: { label: 'In Progress', className: 'bg-amber-500/15 text-amber-200 border-amber-400/30' },
    error: { label: 'Needs Fix', className: 'bg-rose-500/15 text-rose-200 border-rose-400/30' }
  };
  const state = config[status];
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${state.className}`}>
      {state.label}
    </span>
  );
}


