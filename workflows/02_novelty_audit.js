export const meta = {
  name: 'vla-phase2-novelty-audit',
  description: 'Phase 2: per-candidate VLA prior-art audit, second vote on low-confidence kills',
  phases: [
    { title: 'Audit', detail: '10 sonnet auditors, 6 candidates each' },
    { title: 'SecondVote', detail: 'fable/opus re-check of low-confidence kills' },
  ],
}

const SCRATCH = 'C:\\Users\\lalit\\AppData\\Local\\Temp\\claude\\C--Users-lalit-Desktop-vla-n\\fe563f22-7b49-4391-a10c-ae93c1fb435c\\scratchpad'

const KILL_CONTEXT = `You are a novelty auditor in a VLA (Vision-Language-Action) research lab. The lab seeks a genuinely novel mechanism for sub-500M VLA policies (SmolVLA-class, LIBERO/LIBERO-Plus/Meta-World sim benchmarks), publishable at CoRL/RA-L/T-RO/TMLR.

KILL a candidate if ANY of these hold:
- The mechanism (or a close variant) already exists in VLA / robot imitation-learning policy literature.
- It closely resembles existing VLA work with only a trivial twist.
- It is a pure scaling trick, pure data scaling, pure prompt engineering, or pure distillation.
- It is a world model / latent dynamics model / video-prediction / imagination mechanism, or medical/clinical (user hard exclusions).
- It matches a killed direction: 3D/depth injection; frozen-SSL-encoder robustness; continuation-conditioned/real-time-chunking AR decoding; sim re-render action-invariance; failure-DPO/self-recovery data; distill-from-RL-teacher; unfreeze+anti-collapse recipes.

KNOWN CROWDED AREAS (a candidate touching one needs a clearly distinct core mechanism to survive): test-time scaling/BoN/verifiers (RoboMonkey, MG-Select, RoVer), TTA, action tokenizers (FAST/FASTer/BEAST/OmniSAT/VQ), head comparisons (StarVLA), RL post-training (SimpleVLA-RL, RLinf-VLA), ICL-for-VLA (TOPIC, CapVector), MoE, dual-system fast/slow, memory modules, speculative decoding, early-exit (DeeR-VLA), quantization, KV-cache reuse, retrieval-augmented VLA.`

const AUDIT_SCHEMA = {
  type: 'object', required: ['audits'],
  properties: {
    audits: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'verdict', 'kill_reason', 'evidence_papers', 'queries_tried', 'novelty_confidence', 'kill_confidence', 'nearest_prior_art', 'notes'],
        properties: {
          id: { type: 'string' },
          verdict: { type: 'string', enum: ['NOVEL', 'PARTIAL', 'KILL'] },
          kill_reason: { type: 'string', description: 'empty if not KILL; else which kill rule + the specific paper' },
          evidence_papers: { type: 'array', items: { type: 'string' }, description: 'arXiv ids / titles actually found in search results' },
          queries_tried: { type: 'array', items: { type: 'string' } },
          novelty_confidence: { type: 'number', description: '0-1 that no VLA paper does this mechanism' },
          kill_confidence: { type: 'number', description: 'if KILL: 0-1 confidence the kill is correct; else 0' },
          nearest_prior_art: { type: 'string' },
          notes: { type: 'string', description: 'one or two sentences max; for PARTIAL say exactly what the surviving distinct twist is' },
        },
      },
    },
  },
}

const batchFiles = Array.from({ length: 10 }, (_, i) => `${SCRATCH}\\audit_batch_${String(i + 1).padStart(2, '0')}.json`)

phase('Audit')
const auditResults = await parallel(batchFiles.map((f, i) => () =>
  agent(`${KILL_CONTEXT}

TASK: Read the candidate batch file at ${f} (use the Read tool). For EACH candidate in it, run a focused prior-art check:
- 2-4 targeted searches per candidate. Prefer mcp__arxiv__search_papers and mcp__semantic-scholar__search_papers (load your tools with ONE ToolSearch call: those two plus WebSearch). Search "<mechanism keywords> vision-language-action", "<mechanism keywords> robot manipulation policy", and the candidate's own nearest_vla_prior_art claim to verify or refute it.
- Judge against the kill rules. KILL requires a NAMED specific paper or reject-category match — "feels crowded" is PARTIAL, not KILL.
- NOVEL = no VLA/robot-policy prior art found for the core mechanism. PARTIAL = adjacent prior art exists but a distinct twist survives (name it precisely).
- Budget: ~15 searches TOTAL for the whole batch. Terse notes. No invented citations — only papers you actually saw in results.

Return ONLY the structured output with one audit entry per candidate, in the batch file's order.`,
    { label: `audit:batch${i + 1}`, phase: 'Audit', model: 'sonnet', schema: AUDIT_SCHEMA })
))
// barrier justified: second-vote selection needs the full audit set
const audits = auditResults.filter(Boolean).flatMap(r => r.audits)
const kills = audits.filter(a => a.verdict === 'KILL')
const weakKills = kills.filter(a => a.kill_confidence < 0.8)
log(`${audits.length} audited: ${audits.filter(a => a.verdict === 'NOVEL').length} NOVEL, ${audits.filter(a => a.verdict === 'PARTIAL').length} PARTIAL, ${kills.length} KILL (${weakKills.length} low-confidence, getting second vote)`)

phase('SecondVote')
const VOTE_SCHEMA = {
  type: 'object', required: ['id', 'uphold_kill', 'reasoning'],
  properties: {
    id: { type: 'string' },
    uphold_kill: { type: 'boolean' },
    reasoning: { type: 'string', description: '2-3 sentences' },
  },
}

async function judgeAgent(prompt, label, schema) {
  let r = null
  try { r = await agent(prompt, { label, phase: 'SecondVote', model: 'fable', schema }) } catch (e) { r = null }
  if (!r) { try { r = await agent(prompt, { label: label + ':opus', phase: 'SecondVote', model: 'opus', effort: 'xhigh', schema }) } catch (e) { r = null } }
  return r
}

const votes = await parallel(weakKills.map(k => () =>
  judgeAgent(`${KILL_CONTEXT}

A first-pass auditor KILLED candidate ${k.id} with sub-0.8 confidence. Decide whether the kill stands. Their case:
- kill_reason: ${k.kill_reason}
- evidence_papers: ${JSON.stringify(k.evidence_papers)}
- nearest_prior_art: ${k.nearest_prior_art}
- notes: ${k.notes}

Uphold the kill ONLY if the cited evidence genuinely matches the candidate's core mechanism or a reject category clearly applies. If the evidence is adjacent-but-distinct, overturn to PARTIAL (uphold_kill=false). You may run 1-2 verification searches if the cited paper's relevance is unclear (load search tools via ONE ToolSearch call). Candidate details are in the batch files at ${SCRATCH}\\audit_batch_*.json — Read the one containing ${k.id} if you need the full mechanism text.

Return ONLY the structured output for ${k.id}.`, `vote:${k.id}`, VOTE_SCHEMA)
))

const overturned = new Set(votes.filter(Boolean).filter(v => !v.uphold_kill).map(v => v.id))
const finalAudits = audits.map(a =>
  a.verdict === 'KILL' && overturned.has(a.id)
    ? { ...a, verdict: 'PARTIAL', notes: a.notes + ' [kill overturned on second vote]' }
    : a
)
const survivors = finalAudits.filter(a => a.verdict !== 'KILL').map(a => a.id)
log(`final: ${survivors.length} survivors (${overturned.size} kills overturned)`)
return { audits: finalAudits, survivors, votes: votes.filter(Boolean) }