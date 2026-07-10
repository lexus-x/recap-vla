export const meta = {
  name: 'vla-phase1-landscape-scan',
  description: 'Phase 1: scan 14 domain groups for mechanisms never applied to VLAs, target 50+ candidates',
  phases: [
    { title: 'Scan', detail: '14 sonnet domain scanners + 1 bottleneck mapper' },
    { title: 'Consolidate', detail: 'fable dedup/merge into numbered candidate list' },
  ],
}

const CONTEXT = `You are one scanner in a multi-agent VLA (Vision-Language-Action) research lab hunting for a genuinely novel, publishable (Q1/Q2 robotics: CoRL/RA-L/T-RO/TMLR) contribution.

SETUP: Working baseline = SmolVLA 450M (SmolVLM2 vision-language backbone + flow-matching action expert, chunk size 50, lerobot 0.4.4), reproduced at 49.0% on LIBERO-Long (100 rollouts). Compute = 1x A100 80GB. Simulation only: LIBERO, LIBERO-Plus, Meta-World. Sub-500M models preferred; a novel small architecture is acceptable IF trainable in <= a few days on the single A100.

THE 7 TARGET DIMENSIONS (an idea must plausibly improve >=3): success rate, generalization, robustness, latency, compute efficiency, parameter efficiency, data efficiency.

EMPIRICAL BOTTLENECKS THAT MATTER (standard LIBERO avg is SATURATED, 94-99% for 0.5B-7B models — do not target it):
- Long-horizon: SmolVLA 49-71% on LIBERO-Long vs 94%+ for OFT-7B.
- Robustness collapse: models at ~95% standard LIBERO drop to 17-70% under LIBERO-Plus perturbations (viewpoint, robot init state, lighting, distractors); worst factors are camera viewpoint and init-state.
- Few-shot data efficiency at 10-25 demos: largely uncharacterized.
- Latency/compute: real-time control needs fast inference; backbone dominates cost.

KILLED DIRECTIONS (binding — do NOT propose these or close variants):
1. 3D/depth/geometry injection for small VLAs (FALCON 2510.17439, SpatialVLA 2501.15830, GeoVLA, Spatial Forcing 2510.12276).
2. Frozen SSL encoder / structural freezing for robustness (2509.11417; frozen encoders empirically collapse -24 to -42 pts).
3. Continuation-conditioned / real-time-chunking AR decoding (2512.05964, 2606.13355).
4. Action-invariant consistency via sim re-render (LIBERO-Plus's own pipeline 2510.13626, 2510.00037).
5. Self-generated failure DPO / recovery data (GRAPE 2411.19309, PLD).
6. Distillation from an RL-tuned teacher (VLA-OPD 2603.26666).
7. Unfreeze + anti-collapse (VICReg-style) recipes — internally superseded: a linear probe on the frozen features already predicts R^2=0.75 of action variance, so 'frozen backbone = information bottleneck' is dead.

CROWDED AREAS (published — only propose if your twist is clearly distinct, and say vs what):
test-time scaling / best-of-N / verifiers (RoboMonkey, MG-Select, RoVer), test-time augmentation, action tokenizers (FAST/FASTer/BEAST/OmniSAT/VQ), action-head comparisons (StarVLA-alpha), RL post-training (SimpleVLA-RL 99.1%, RLinf-VLA), in-context learning for VLA (TOPIC, CapVector), MoE VLAs, dual-system fast/slow VLAs, world-model-augmented VLAs, memory modules for long horizon, speculative decoding for VLA, early-exit (DeeR-VLA), quantization, KV-cache reuse.

ALSO REJECT: pure scaling, pure data scaling, pure prompt engineering, pure distillation, trivial modifications.`

const IDEA_ITEM = {
  type: 'object',
  required: ['name', 'source_domain', 'mechanism', 'source_papers', 'vla_bottleneck', 'mechanistic_story', 'dimensions_improved', 'nearest_vla_prior_art', 'integration_path', 'novelty_confidence'],
  properties: {
    name: { type: 'string', description: 'short memorable name' },
    source_domain: { type: 'string' },
    mechanism: { type: 'string', description: '2-4 sentences, concrete' },
    source_papers: { type: 'array', items: { type: 'string' }, description: 'real papers from the source domain (arXiv id or venue+year), verified to exist via search' },
    vla_bottleneck: { type: 'string', description: 'which named empirical bottleneck it attacks' },
    mechanistic_story: { type: 'string', description: 'WHY it should help, mechanistically' },
    dimensions_improved: { type: 'array', items: { type: 'string' } },
    nearest_vla_prior_art: { type: 'string', description: 'closest existing VLA/robotics work found when spot-checking, or "none found" with the queries tried' },
    integration_path: { type: 'string', description: 'concrete sketch: where it plugs into SmolVLA/lerobot' },
    novelty_confidence: { type: 'number', description: '0-1, confidence no VLA paper does this' },
  },
}

const IDEAS_SCHEMA = {
  type: 'object', required: ['ideas'],
  properties: { ideas: { type: 'array', items: IDEA_ITEM } },
}

const BOTTLENECK_SCHEMA = {
  type: 'object', required: ['bottlenecks'],
  properties: {
    bottlenecks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'evidence', 'citations', 'severity'],
        properties: {
          name: { type: 'string' },
          evidence: { type: 'string', description: 'concrete numbers from fetched sources' },
          citations: { type: 'array', items: { type: 'string' } },
          severity: { type: 'string', description: 'high/medium/low + one-line justification' },
        },
      },
    },
  },
}

const DOMAINS = [
  { key: 'llm-systems', hint: 'LLM/VLM inference and architecture research: KV-cache eviction/compression policies, speculative and parallel decoding variants, state-space models / linear attention, mixture-of-depths, token merging/pruning, register tokens, attention sinks, layer skipping' },
  { key: 'diffusion-flow', hint: 'generative modeling beyond what VLAs use: consistency models, shortcut/mean flows, rectified flow, classifier-free guidance variants, discrete diffusion, stochastic interpolants, distillation-free few-step sampling' },
  { key: 'rl-planning', hint: 'RL and planning mechanisms NOT yet in VLA post-training: successor features, options/HRL, hindsight relabeling, MPPI, lightweight MCTS, goal-conditioned value functions, intrinsic motivation, quasimetric RL' },
  { key: 'world-models', hint: 'latent dynamics and self-supervised prediction: JEPA-style latent prediction, temporal abstraction, video-prediction pretraining, Dreamer-style imagination, object-centric dynamics (slot attention)' },
  { key: 'control-theory', hint: 'classical and modern control: MPC variants, tube/funnel control, contraction metrics, Lyapunov certificates, sliding mode, iterative learning control, impedance control, dynamical movement primitives (DMPs), ProMPs, time-varying LQR' },
  { key: 'neuroscience', hint: 'computational neuroscience of motor control: predictive coding, efference copy / corollary discharge, cerebellar forward models, motor chunking, basal ganglia action gating, active inference, optimal feedback control theory of motor coordination' },
  { key: 'cognitive-science', hint: 'cognitive mechanisms: dual-process arbitration, cognitive-load-adaptive processing, schema learning, curriculum effects, memory consolidation/replay, attention economics, habit formation vs goal-directed control' },
  { key: 'information-theory', hint: 'information-theoretic tools: information bottleneck, rate-distortion allocation, MDL, channel coding / error-correcting codes applied to representations, compressed sensing, mutual-information regularizers with tractable estimators' },
  { key: 'graph-program', hint: 'graph learning and program synthesis: GNN message passing over structured state, learned scene graphs (check VLA prior art carefully), neurosymbolic skill composition, library learning (DreamCoder-style), programmatic policies, execution-guided synthesis' },
  { key: 'multiagent-networking', hint: 'distributed systems and networking mechanisms as metaphors made literal: congestion control (AIMD rate adaptation), consensus protocols, routing under uncertainty, QoS admission control, gossip, load balancing, backpressure' },
  { key: 'systems-architecture', hint: 'computer architecture mechanisms: branch prediction (predict-then-verify cheap path), prefetching, cache hierarchies with learned eviction, out-of-order execution with hazard detection, pipelining with stall/flush, scoreboarding' },
  { key: 'databases', hint: 'database systems: query optimization / learned cost models, adaptive indexing, materialized-view selection, approximate query processing with error bounds, write-ahead logging / checkpoint-rollback, multi-version concurrency' },
  { key: 'physics-biology', hint: 'physics and biology: criticality/edge-of-chaos initialization, reservoir computing, central pattern generators, muscle synergies / motor primitives dimensionality, immune-inspired anomaly detection, morphological computation, minimum-jerk/minimum-intervention principles' },
  { key: 'vla-inward', hint: 'INWARD scan: read limitation sections and future-work sections of 2025-2026 VLA papers and surveys — what do the authors themselves name as missing mechanisms nobody has built? Convert each named gap into a concrete mechanism proposal (possibly borrowed from an adjacent field)' },
]

function scanPrompt(d) {
  return `${CONTEXT}

YOUR DOMAIN ASSIGNMENT: ${d.key} — ${d.hint}

TASK: Find 4-6 mechanisms from YOUR domain that have plausibly NEVER been applied to VLA policies and could improve >=3 of the 7 dimensions. For each:
1. Ground it in >=1 REAL paper from your domain — verify the paper exists via search (arXiv id or exact title+venue). No invented citations.
2. Spot-check VLA prior art: run 2-3 targeted searches like "VLA <mechanism>", "vision-language-action <mechanism>", "robot manipulation policy <mechanism>". Record the closest hit or "none found" plus the queries you tried.
3. Give a mechanistic story tied to a NAMED bottleneck (long-horizon, robustness/perturbation, few-shot, latency) — not vibes.
4. Sketch the integration path into SmolVLA/lerobot (which module, roughly how many params, trainable on 1xA100).

METHOD: First load your search tools with ONE ToolSearch call (select the tools you need, e.g. mcp__arxiv__search_papers, mcp__semantic-scholar__search_papers, WebSearch, WebFetch). Prefer arxiv + semantic-scholar MCP over web search — they are targeted and cheap. Budget ~10-15 searches total. Depth over breadth: 4 well-grounded ideas beat 6 shallow ones.

Return ONLY the structured output.`
}

const bottleneckPrompt = `${CONTEXT}

TASK: You are the bottleneck mapper. Compile the ranked list of empirically-documented open bottlenecks in current VLAs (2025-2026), each with concrete numbers from fetched sources. Cover at minimum: long-horizon degradation, perturbation robustness (LIBERO-Plus factor-level numbers), few-shot adaptation, inference latency/control rate, catastrophic forgetting of VLM capabilities, sim-to-real notes (we are sim-only but reviewers care), and any bottleneck named by >=2 recent surveys that the list above misses.

METHOD: ONE ToolSearch call to load search tools (arxiv MCP, semantic-scholar MCP, WebSearch, WebFetch). Fetch 5-8 sources (recent surveys, LIBERO-Plus paper, benchmark reports). Every number must come from a fetched source — cite the arXiv id. Budget ~15 searches/fetches.

Return ONLY the structured output.`

phase('Scan')
const scans = await parallel([
  () => agent(bottleneckPrompt, { label: 'bottleneck-map', phase: 'Scan', model: 'sonnet', schema: BOTTLENECK_SCHEMA }),
  ...DOMAINS.map(d => () => agent(scanPrompt(d), { label: `scan:${d.key}`, phase: 'Scan', model: 'sonnet', schema: IDEAS_SCHEMA })),
])
// barrier justified: consolidation needs the full idea set for cross-scanner dedup
const bottlenecks = scans[0]
const scanResults = scans.slice(1).filter(Boolean)
const ideas = scanResults.flatMap(r => r.ideas)
log(`${ideas.length} raw ideas from ${scanResults.length}/14 scanners`)

phase('Consolidate')
const CONSOLIDATED_SCHEMA = {
  type: 'object', required: ['candidates', 'dropped'],
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'source_domain', 'mechanism', 'source_papers', 'vla_bottleneck', 'mechanistic_story', 'dimensions_improved', 'nearest_vla_prior_art', 'integration_path', 'novelty_confidence', 'pre_flag'],
        properties: {
          id: { type: 'string', description: 'C1, C2, ...' },
          name: { type: 'string' },
          source_domain: { type: 'string' },
          mechanism: { type: 'string' },
          source_papers: { type: 'array', items: { type: 'string' } },
          vla_bottleneck: { type: 'string' },
          mechanistic_story: { type: 'string' },
          dimensions_improved: { type: 'array', items: { type: 'string' } },
          nearest_vla_prior_art: { type: 'string' },
          integration_path: { type: 'string' },
          novelty_confidence: { type: 'number' },
          pre_flag: { type: 'string', description: 'empty string, or a warning: overlaps crowded area X / adjacent to killed direction Y / scanner found close prior art' },
        },
      },
    },
    dropped: {
      type: 'array',
      items: {
        type: 'object', required: ['name', 'reason'],
        properties: { name: { type: 'string' }, reason: { type: 'string' } },
      },
    },
  },
}

const consolidatePrompt = `${CONTEXT}

TASK: You are the consolidation judge. Below are ${ideas.length} raw candidate ideas from 14 domain scanners. Produce the consolidated candidate list:
1. MERGE semantic duplicates (same core mechanism from different domains) — keep the best-articulated version, fold in the best details from duplicates.
2. DROP: exact matches to the killed-directions list, ideas violating the reject categories (pure scaling/data/prompting/distillation), and ideas whose own scanner found direct VLA prior art doing the same thing (nearest_vla_prior_art is essentially the same mechanism).
3. HARD EXCLUSIONS (user-imposed, drop regardless of quality): (a) WORLD MODELS — any idea whose core mechanism is a world model, latent dynamics model, video-prediction pretraining, JEPA-style predictive model, or imagination/dreaming-based planning; (b) MEDICAL — anything clinical/healthcare/medical-domain.
4. PRE-FLAG (do not drop) ideas adjacent to crowded areas or with partial prior-art hits — the novelty-audit phase decides their fate.
5. Number candidates C1..CN, roughly ordered by (novelty_confidence x bottleneck severity). Keep at least 50 if the raw pool supports it after exclusions.

RAW IDEAS JSON:
${JSON.stringify(ideas)}

Return ONLY the structured output.`

let consolidated = await agent(consolidatePrompt, { label: 'consolidate', phase: 'Consolidate', model: 'opus', effort: 'xhigh', schema: CONSOLIDATED_SCHEMA })
if (!consolidated) {
  log('opus consolidation failed, retrying on sonnet max effort')
  consolidated = await agent(consolidatePrompt, { label: 'consolidate-retry', phase: 'Consolidate', model: 'sonnet', effort: 'max', schema: CONSOLIDATED_SCHEMA })
}
if (!consolidated) throw new Error('consolidation failed on both opus and sonnet')

log(`consolidated: ${consolidated.candidates.length} candidates, ${consolidated.dropped.length} dropped`)
return { bottlenecks, candidates: consolidated.candidates, dropped: consolidated.dropped, raw_count: ideas.length }