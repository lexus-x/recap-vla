export const meta = {
  name: 'vla-phase56-ranking-planning',
  description: 'Phase 5: 3-ranker committee + chair -> top10/top3/winner; Phase 6: implementation plans for top 3',
  phases: [
    { title: 'Dispatch', detail: 'read finalists file' },
    { title: 'Rank', detail: '3 independent fable rankers, 7 axes' },
    { title: 'Chair', detail: 'fable chair merges, picks top10/top3/winner' },
    { title: 'Plan', detail: 'implementation plan per top-3 idea' },
  ],
}

const SCRATCH = 'C:\\Users\\lalit\\AppData\\Local\\Temp\\claude\\C--Users-lalit-Desktop-vla-n\\fe563f22-7b49-4391-a10c-ae93c1fb435c\\scratchpad'
const FINALISTS_FILE = `${SCRATCH}\\phase5_input_finalists.json`

const MISSION = `VLA research lab mission: ONE genuinely novel mechanism for sub-500M VLA policies (SmolVLA 450M baseline, 49.0% LIBERO-Long reproduced; sim-only: LIBERO, LIBERO-Plus, Meta-World; 1x A100 80GB; frozen backbone preferred). Publishable Q1/Q2: CoRL/RA-L/T-RO/RSS/TMLR. Bottlenecks: perturbation robustness collapse (viewpoint -91pt, init-state -88pt), long-horizon gap (23-46pt at sub-500M), language-shortcut failure, uncharacterized few-shot axis, backbone-dominated latency. Each finalist has passed a novelty audit, all six gates, and three adversarial debate rounds.`

async function judgeAgent(prompt, label, ph, schema) {
  let r = null
  try { r = await agent(prompt, { label, phase: ph, model: 'fable', schema }) } catch (e) { r = null }
  if (!r) { try { r = await agent(prompt, { label: label + ':opus', phase: ph, model: 'opus', effort: 'xhigh', schema }) } catch (e) { r = null } }
  return r
}

phase('Dispatch')
const DISPATCH_SCHEMA = { type: 'object', required: ['ids'], properties: { ids: { type: 'array', items: { type: 'string' } } } }
const dispatch = await agent(`Read the JSON file at ${FINALISTS_FILE} (Read tool). It is an array of candidate objects. Return the list of their "id" fields in file order. Do nothing else.`, { label: 'dispatch', phase: 'Dispatch', model: 'sonnet', effort: 'low', schema: DISPATCH_SCHEMA })
const ids = dispatch.ids
log(`${ids.length} finalists to rank`)

phase('Rank')
const RANK_SCHEMA = {
  type: 'object', required: ['scores'],
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'novelty', 'sr_gain', 'latency_gain', 'robustness_gain', 'implementation_difficulty', 'publication_potential', 'expected_impact', 'one_line'],
        properties: {
          id: { type: 'string' },
          novelty: { type: 'number' }, sr_gain: { type: 'number' }, latency_gain: { type: 'number' },
          robustness_gain: { type: 'number' }, implementation_difficulty: { type: 'number', description: '0=trivial, 10=impossible — lower is better' },
          publication_potential: { type: 'number' }, expected_impact: { type: 'number' },
          one_line: { type: 'string' },
        },
      },
    },
  },
}
const LENSES = [
  { key: 'scientist', style: 'Score as a rigorous scientist: mechanistic soundness, falsifiability, expected effect sizes grounded in the cited evidence.' },
  { key: 'engineer', style: 'Score as the implementation engineer who must build every one of these on a single A100 with lerobot/SmolVLA in weeks: integration friction, hidden costs, eval-harness reality (LIBERO-Plus/Meta-World availability), risk of silent confounds.' },
  { key: 'reviewer', style: 'Score as a CoRL/RA-L senior reviewer: novelty vs the named nearest prior art, positioning, what the paper headline would be, acceptance realism at Q1/Q2 venues.' },
]
const rankResults = await parallel(LENSES.map(l => () =>
  judgeAgent(`${MISSION}

You are ranking committee member "${l.key}". ${l.style}

Read the finalists JSON at ${FINALISTS_FILE} (Read tool) — each entry has the full mechanism, integration path, novelty-audit evidence, gate reasons, and debate summaries. Score EVERY finalist on all 7 axes, 0-10 (implementation_difficulty: lower is better). Use the full scale — differentiate, do not cluster everything at 6-8. No searching.

Return ONLY the structured output with one entry per finalist.`, `rank:${l.key}`, 'Rank', RANK_SCHEMA)
))
// barrier justified: chair needs all three score sets
const validRanks = rankResults.filter(Boolean)
log(`${validRanks.length}/3 rankers returned scores`)
if (validRanks.length < 2) throw new Error(`only ${validRanks.length}/3 rankers succeeded — session limit likely still active, resume later`)

phase('Chair')
const CHAIR_SCHEMA = {
  type: 'object', required: ['top10', 'top3', 'winner'],
  properties: {
    top10: {
      type: 'array',
      items: {
        type: 'object', required: ['rank', 'id', 'name', 'avg_total', 'rationale'],
        properties: { rank: { type: 'number' }, id: { type: 'string' }, name: { type: 'string' }, avg_total: { type: 'number' }, rationale: { type: 'string' } },
      },
    },
    top3: { type: 'array', items: { type: 'string' } },
    winner: {
      type: 'object', required: ['id', 'justification', 'confidence'],
      properties: { id: { type: 'string' }, justification: { type: 'string' }, confidence: { type: 'number', description: '0-1 that this is the right pick for a Q1/Q2 publication' } },
    },
    disagreements: { type: 'string', description: 'axes where rankers diverged by >3 points and how you resolved them' },
  },
}
const chair = await judgeAgent(`${MISSION}

You are the ranking committee CHAIR. Three committee members (scientist, engineer, reviewer lenses) scored every finalist on 7 axes. Their full score sets:

${JSON.stringify(validRanks)}

Read the finalists JSON at ${FINALISTS_FILE} (Read tool) for the underlying material. Produce:
1. top10 — ranked list (use averaged totals with implementation_difficulty inverted, but override pure arithmetic where one lens exposes a fatal flaw; explain in rationale).
2. top3 — the three ideas most worth prototyping in parallel; they should be DIVERSE (not three variants of the same cluster).
3. winner — Phase 9 criteria: highest novelty AND highest publication confidence AND strongest expected benchmark improvement AND most realistic implementation. One id, honest justification, calibrated confidence.
4. disagreements — where rankers diverged >3 pts and your resolution.

Return ONLY the structured output.`, 'chair', 'Chair', CHAIR_SCHEMA)
if (!chair) throw new Error('chair failed on both fable and opus — resume later')
log(`chair: winner=${chair.winner.id} conf=${chair.winner.confidence}; top3=${chair.top3.join(', ')}`)

phase('Plan')
const PLAN_SCHEMA = {
  type: 'object',
  required: ['id', 'architecture', 'theory', 'equations', 'training_pipeline', 'eval_pipeline', 'compute_estimate', 'ablation_plan', 'failure_analysis', 'params_added', 'expected_gains'],
  properties: {
    id: { type: 'string' },
    architecture: { type: 'string', description: 'component diagram in ASCII or mermaid + prose; exactly where it attaches to SmolVLA/lerobot' },
    theory: { type: 'string', description: 'the mechanistic theory, assumptions made explicit' },
    equations: { type: 'string', description: 'key equations in LaTeX' },
    training_pipeline: { type: 'string', description: 'data, losses, hyperparameters, schedule, seeds (>=3), success criterion WRITTEN BEFORE launch' },
    eval_pipeline: { type: 'string', description: 'benchmarks, rollout counts, seeds, baselines to compare, metrics incl. latency/params/GPU-hours' },
    compute_estimate: { type: 'string', description: 'A100-hours per stage, total, wall-clock' },
    ablation_plan: { type: 'string', description: 'which components get ablated to isolate the mechanism' },
    failure_analysis: { type: 'string', description: 'top 3 ways it fails, early kill signals, fallback framing' },
    params_added: { type: 'string' },
    expected_gains: { type: 'string', description: 'per target dimension, with honest probability' },
  },
}
const plans = await parallel(chair.top3.map(id => () =>
  agent(`${MISSION}

You are the systems architect + training engineer. Write the full implementation plan for finalist ${id}. Read its complete entry in ${FINALISTS_FILE} (Read tool) first. Stack facts: SmolVLA 450M via lerobot 0.4.4 on the a100 host (conda env "lerobot", torch 2.7.1+cu126, MUJOCO_GL=egl, mujoco 3.4.0 + robosuite 1.4.0 pinned, LIBERO datasets cached in LeRobot format, ~67GB VRAM free); baseline eval = 49.0% LIBERO-Long at 100 rollouts, seed 1000, ~5h. Design for: frozen backbone unless the mechanism requires otherwise; >=3 seeds; success criteria stated before launch; honest negative-result fallback.

Return ONLY the structured output.`, { label: `plan:${id}`, phase: 'Plan', model: 'sonnet', effort: 'high', schema: PLAN_SCHEMA })
))

return { rankers: validRanks, chair, plans: plans.filter(Boolean) }
