export const meta = {
  name: 'vla-phase34-gates-debates',
  description: 'Phases 3-4: six-gate screening then 3-round adversarial debates on gate-passers',
  phases: [
    { title: 'Dispatch', detail: 'read survivor file, list IDs' },
    { title: 'Gates', detail: 'fable gate-judges, 4 candidates each, all 6 gates' },
    { title: 'Debates', detail: '3 independent kill-attempt rounds per gate-passer' },
  ],
}

const SCRATCH = 'C:\\Users\\lalit\\AppData\\Local\\Temp\\claude\\C--Users-lalit-Desktop-vla-n\\fe563f22-7b49-4391-a10c-ae93c1fb435c\\scratchpad'
const SURVIVORS_FILE = `${SCRATCH}\\phase3_input_survivors.json`

const MISSION = `VLA research lab mission: find ONE genuinely novel mechanism for sub-500M VLA policies (SmolVLA 450M baseline, 49.0% LIBERO-Long reproduced; sim-only: LIBERO, LIBERO-Plus, Meta-World; 1x A100 80GB; frozen-backbone plug-in modules preferred, small novel architectures acceptable if cheap to train). Publishable Q1/Q2: CoRL/RA-L/T-RO/RSS/TMLR.

EMPIRICAL BOTTLENECKS (verified with sources in Phase 1): (1) perturbation robustness collapse — camera viewpoint up to -91pt, robot init-state up to -88pt on LIBERO-Plus; (2) long-horizon degradation — 23-46pt gap at sub-500M; (3) language-shortcut/instruction-ignorance; (4) few-shot adaptation uncharacterized; (5) latency dominated by backbone (crowded fixes rejected); (6) VLM catastrophic forgetting (avoided by frozen backbone by construction).

HARD EXCLUSIONS: world models / latent dynamics / video prediction / imagination; anything medical; pure scaling/data/prompting/distillation; the 7 killed directions (3D-geometry injection, frozen-SSL-encoder robustness, continuation-conditioned AR chunking, sim re-render consistency, failure-DPO, distill-from-RL-teacher, unfreeze+anti-collapse).`

const GATE_SCHEMA = {
  type: 'object', required: ['results'],
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'A_novelty', 'B_importance', 'C_mechanism', 'D_generality', 'E_efficiency', 'F_publication', 'all_pass', 'reasons'],
        properties: {
          id: { type: 'string' },
          A_novelty: { type: 'boolean', description: 'would a strong PhD reviewer say "this is actually new" given the audit evidence' },
          B_importance: { type: 'boolean', description: 'attacks a real, evidenced bottleneck' },
          C_mechanism: { type: 'boolean', description: 'gains explainable mechanistically, not vibes' },
          D_generality: { type: 'boolean', description: 'attaches to multiple VLAs (SmolVLA, pi0, OpenVLA-OFT class), not one architecture quirk' },
          E_efficiency: { type: 'boolean', description: 'improves without massive scaling; trainable on 1xA100 in days' },
          F_publication: { type: 'boolean', description: 'realistic acceptance chance at CoRL/RA-L/T-RO/RSS/TMLR' },
          all_pass: { type: 'boolean' },
          reasons: { type: 'string', description: 'one line per FAILED gate naming the specific reason; one line overall if all pass' },
        },
      },
    },
  },
}

const DEBATE_SCHEMA = {
  type: 'object', required: ['id', 'round', 'killed', 'attack_summary', 'verdict_reasoning'],
  properties: {
    id: { type: 'string' },
    round: { type: 'string' },
    killed: { type: 'boolean' },
    attack_summary: { type: 'string', description: 'the strongest attack mounted, 2-4 sentences' },
    verdict_reasoning: { type: 'string', description: 'why the idea survived or died, 2-3 sentences' },
  },
}

async function judgeAgent(prompt, label, ph, schema) {
  let r = null
  try { r = await agent(prompt, { label, phase: ph, model: 'fable', schema }) } catch (e) { r = null }
  if (!r) { try { r = await agent(prompt, { label: label + ':opus', phase: ph, model: 'opus', effort: 'xhigh', schema }) } catch (e) { r = null } }
  return r
}

phase('Dispatch')
const DISPATCH_SCHEMA = {
  type: 'object', required: ['ids'],
  properties: { ids: { type: 'array', items: { type: 'string' } } },
}
const dispatch = await agent(`Read the JSON file at ${SURVIVORS_FILE} (Read tool). It is an array of candidate objects. Return the list of their "id" fields in file order. Do nothing else.`, { label: 'dispatch', phase: 'Dispatch', model: 'sonnet', effort: 'low', schema: DISPATCH_SCHEMA })
const ids = dispatch.ids
log(`${ids.length} survivors entering gates`)

phase('Gates')
const chunks = []
for (let i = 0; i < ids.length; i += 4) chunks.push(ids.slice(i, i + 4))
const gateResults = (await parallel(chunks.map((chunk, i) => () =>
  judgeAgent(`${MISSION}

You are the gate judge. Read the JSON file at ${SURVIVORS_FILE} (Read tool). Judge ONLY candidates ${chunk.join(', ')}. Each object contains the full mechanism, source papers, integration path, novelty-audit verdict, audit evidence and nearest prior art — judge from this material, do NOT search.

For each candidate apply all six gates STRICTLY (a gate fails unless the case is affirmatively strong):
A Novelty — given the audit's nearest prior art, would a strong PhD reviewer say "actually new"? PARTIAL-verdict candidates pass ONLY if the surviving twist is itself substantial.
B Problem importance — does it attack one of the evidenced bottlenecks with a plausible effect size?
C Mechanistic justification — is there a concrete causal story from mechanism to metric, falsifiable in an ablation?
D Generality — does it plug into at least SmolVLA-class AND OFT/pi0-class VLAs without retraining the backbone?
E Efficiency — trainable/runnable on 1x A100 80GB in days; no scaling dependence; must plausibly improve >=3 of: SR, generalization, robustness, latency, compute, params, data efficiency.
F Publication — would this survive a CoRL/RA-L program committee as a contribution, accounting for the crowded areas?

Be a harsh reviewer: the downstream debate phase is expensive, only defensible candidates should pass all six.

Return ONLY the structured output, one entry per candidate.`, `gates:${chunk[0]}-${chunk[chunk.length - 1]}`, 'Gates', GATE_SCHEMA)
))).filter(Boolean).flatMap(r => r.results)
const passers = gateResults.filter(r => r.all_pass).map(r => r.id)
log(`gates: ${passers.length}/${gateResults.length} passed all six: ${passers.join(', ')}`)

phase('Debates')
const ROUNDS = [
  { round: 'R1-supporter-vs-critic', style: 'Stage an internal debate: first the strongest SUPPORTER case (why this works and gets accepted), then the strongest CRITIC case (why it fails or gets rejected), then adjudicate honestly. Kill if the critic case clearly dominates.' },
  { round: 'R2-reviewer2', style: 'You are the notoriously harsh Reviewer #2. Attack novelty (is the delta over nearest prior art real?), attack the evaluation plan (can LIBERO-Plus/Meta-World actually show the claimed gain?), attack hidden costs. Kill unless the idea survives your best attack.' },
  { round: 'R3-area-chair', style: 'You are the Area Chair with a full batch of competing submissions. Attack significance and positioning: even if correct and novel, is this MORE than a workshop paper? Does the mechanism plausibly move >=3 target dimensions enough to matter? Kill borderline-significance ideas.' },
]
const debateResults = await parallel(passers.flatMap(id =>
  ROUNDS.map(rd => () =>
    judgeAgent(`${MISSION}

Candidate under debate: ${id}. Read its full entry (mechanism, audit evidence, nearest prior art) in the JSON file at ${SURVIVORS_FILE} (Read tool). ${rd.style}

Your goal is to KILL the idea if it deserves killing — a false survivor wastes a GPU-month downstream; a false kill only costs one idea among many. Judge from the provided material; no searching.

Return ONLY the structured output with round="${rd.round}".`, `debate:${id}:${rd.round}`, 'Debates', DEBATE_SCHEMA)
  )
))
const debates = debateResults.filter(Boolean)
const killedIds = new Set(debates.filter(d => d.killed).map(d => d.id))
const finalSurvivors = passers.filter(id => !killedIds.has(id))
log(`debates: ${finalSurvivors.length}/${passers.length} survived all 3 rounds: ${finalSurvivors.join(', ')}`)

return { gates: gateResults, debates, gate_passers: passers, final_survivors: finalSurvivors }
