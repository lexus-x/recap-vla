# RECAP (R4) — VLA Novelty Mission Full Report (2026-07-10)

> Autonomous multi-agent discovery run: 14-domain landscape scan → novelty audit → six-gate screen → 3-round adversarial debates → revision round (2 independent surgeons) → second gate/debate pass → ranking committee → implementation planning.
> Models: Sonnet workers, Fable 5 judges (Opus 4.8 x-high fallback). ~4.8M tokens. All numbers below trace to run logs or fetched sources; no estimates presented as measurements.

## 0. Executive summary

**Headline finding: at a strict Q1 bar with committee-grade adversarial review, zero of 67 candidate mechanisms fully survived.** 59 mechanisms were mined from 14 non-VLA domains and screened; 8 more were engineered specifically to answer the recorded fatal attacks. Four passed all six gates (C4, C7, R2, S1); all four were then killed in adversarial debates with substantive, checkable defects — not reviewer taste.

This zero-survivor outcome is itself a load-bearing, evidence-backed conclusion (§5): the space of "novel plug-in mechanism that beats bigger VLAs" is structurally foreclosed at this scale, and the recoverable value lies in the pre-registered cheap diagnostics the process produced, plus the winner-with-caveats direction selected by the ranking committee (§6, §7).

*(Ranking, winner, plans and roadmaps in §6–§9 — appended when the committee returned.)*

## 1. Ground rules and constraints

- Sub-500M VLA (SmolVLA 450M baseline; reproduced 49.0% LIBERO-Long, 100 rollouts, seed 1000, commit 1b45c4f). Sim only: LIBERO, LIBERO-Plus, Meta-World.
- Frozen backbone strongly preferred (plug-in module); small novel architectures allowed if trainable in days on the primary compute, **a100 via SSH** (A100 80GB, verified idle, lerobot 0.4.4 stack working).
- Hard exclusions (user): **no world models, no medical**. Killed directions (binding, from `archive/reports/research-direction-report.md` §6 + handoff): 3D-geometry injection, frozen-SSL-encoder robustness, continuation-conditioned AR chunking, sim re-render consistency, failure-DPO, distill-from-RL-teacher, unfreeze+anti-collapse (superseded by the R²=0.75 linear-probe result).
- Reject categories: pure scaling, data scaling, prompt engineering, distillation.

## 2. Bottleneck map (Phase 1, all numbers from fetched sources)

| Bottleneck | Evidence | Severity |
|---|---|---|
| Perturbation robustness collapse | LIBERO-Plus (2510.13626): camera viewpoint OpenVLA 76.5→1.1 (−75.4pt), UniVLA 95.2→4.3 (−90.9pt); robot init-state pi0 94.2→6.6 (−87.6pt). Corroborated by LIBERO-PRO (2510.03827): >90% → 0.0% under generalized perturbation | High — largest reproduced effect size |
| Long-horizon degradation | SmolVLA 71 (self-reported) / 49.0 (our reproduction) vs OFT-7B 97.1 on LIBERO-Long | High — sharpest sub-500M axis with headroom |
| VLM catastrophic forgetting | VLM2VLA (2509.22195): OpenVLA-7B MMStar 38.8→0, TextVQA 42.5→0 after action finetuning | High — but avoided by frozen backbone by construction |
| Language-shortcut / instruction ignorance | LIBERO-Plus + ProGAL-VLA (2604.09824, 30.3→71.5 with grounded-goal verification) + RoVLA (2605.19678) | Medium-high |
| Backbone-dominated latency | Efficient-VLA survey (2510.17111); 3–10Hz for 3–55B models | Medium — standard fixes are crowded/rejected |
| Few-shot adaptation | No controlled 10/25-shot sub-500M protocol found; RIPT-VLA (2505.17016) +21.2 LIBERO-Long over SFT floor implies large few-shot deficit | Medium — uncharacterized |

## 3. Pipeline record

| Phase | Input | Output |
|---|---|---|
| 1. Landscape scan (14 sonnet scanners + bottleneck mapper + fable consolidation) | 21 domains grouped into 14 assignments | 67 raw ideas → 60 consolidated candidates (world-model/medical ideas dropped per exclusions) |
| 2. Novelty audit (10 sonnet auditors; 2/3-vote protocol on weak kills) | 59 candidates | 48 audited: 16 NOVEL, 26 PARTIAL, 4 strong KILL, 2 weak KILL; 11 (C49–C59) audit wedged → sent to gates unaudited with extra Gate-A skepticism |
| 3. Six gates, wave 1 (fable judges) | 42 audited survivors | **2 passed** (C4, C7) |
| 4. Debates, wave 1 (3 independent kill-attempt rounds each) | C4, C7 | **both killed** |
| 3–4 wave 2 | C8, C38 + unaudited C49–C59 (13) | **0 passed gates** |
| Revision round | 2 independent surgeons (Fable, Opus) fed the full kill record | 8 engineered revisions (R1–R4, S1–S4) |
| 3–4 waves 3–4 | 8 revisions | R2, S1 passed gates; **both debate-killed** (R2: 1 round survived; S1: 0) |

**Net: 67 screened, 4 all-gates passes, 0 debate survivors.**

## 4. Why the four gate-passers died (verified fatal defects)

- **C4 — Uncontrolled-Manifold Loss Reweighting** (optimal feedback control): the feasible variant collapses into classical variance-weighted imitation (Calinon-style minimal-intervention LfD + heteroscedastic regression, Kendall & Gal 2017); the novel variant needs counterfactual perturbation rollout supervision the plan omits; full action-expert retrain per ablation = not a plug-in; no execution-time mechanism for the perception-driven robustness factors.
- **C7 — Evidential Camera-Trust Gate** (Dempster–Shafer multi-view fusion): LIBERO-Plus viewpoint shift is a *displaced-but-informative* view, not sensor corruption — down-weighting it removes the policy's only source of scene geometry pre-grasp; DS fusion with n=2 sources degenerates to a scalar gate; its required synthetic-corruption training doubles as the fair augmentation baseline, confounding attribution.
- **R2 — ProbeAnchor** (execution-time referent-frame retargeting off frozen-feature pose probes): the correction Δ = (probe pose − cached demo-prior pose) is not the policy's error — SmolVLA trains under per-episode pose randomization and partially adapts closed-loop, so adding the full offset double-counts (the same unobservable-error flaw that killed C19); on its headline −88pt init-state factor the objects don't move, so the referent term is identically zero; probes consume privileged MuJoCo supervision the baseline never sees.
- **S1 — Metadata-Disentangled Nuisance-Subspace Repair** (upstream feature repair): identifiability contradiction — clean LIBERO renders have constant camera/lighting, so the metadata-supervised nuisance subspace is unlearnable from clean data; any rescue re-renders varied factors, collapsing the "disentanglement-not-augmentation" differentiator and grazing the killed re-render direction; occlusion/viewpoint (the pre-registered held-out wins) are mechanistically outside a low-rank photometric subspace.

## 5. Structural findings (the reusable conclusions)

1. **Perception-driven OOD collapse cannot be fixed downstream of a frozen backbone.** Every monitor, gate, verifier, or action-space correction died the same death: its own inputs are corrupted by exactly the shift it must fix. (Killed: the entire OOD-monitor/escalation cluster, C7, R2.)
2. **Upstream fixes need factor variation, and factor variation is augmentation.** Any mechanism whose training signal covers the test perturbation factors has a mandatory fair baseline — the same signal used as plain augmentation — that captures most of the gain (C7, S1, S2). The only escapes are test-time information a fixed map cannot hold, and none of the proposed instantiations survived scrutiny.
3. **The ≥3-dimensions requirement is a real filter, not bookkeeping.** The most common death after novelty was one benchmark factor re-counted as three dimensions (C7, S2, R2-AC-round).
4. **The crowded clusters are truly closed at mechanism grain**: adaptive replan cadence (7 candidates), K-sample aggregation, OOD-monitors, caching/latency engineering, few-shot adapter machinery — all have 2025–26 named prior art within one thin twist.
5. **This replicates, by an independent route, the archived research-direction-report's conclusion**: at sub-500M in 2026, the defensible whitespace is *measurement/characterization and evidence-gated composition*, not a new atomic mechanism.

## 6. Ranking committee results (3 lenses: scientist / engineer / reviewer + chair)

Committee alignment was unusually high (no axis diverged >3pts). Chair overrode pure arithmetic twice (R2 demoted for the zero-referent-Δ incoherence on its headline factor; C20 demoted for audit confidence 0.25 vs VLA-Corrector).

| Rank | ID | Name | Avg total | One-line verdict |
|---|---|---|---|---|
| 1 | R4 | Declarative Postcondition Retry (DPR) | 29.5 | Unanimous sr_gain 6/6/6 — retry arithmetic p→p(2−p) attacks the multiplicative long-horizon failure structure; only causal chain to survive the full adversarial record intact; novelty is its one deficit |
| 2 | R1 | First-Glance Nuisance Recalibration | 26.2 | Highest novelty (5/5/5, episode-amortized nuisance inference) but the gate-C span gap makes its premise more likely false than true — cheap diagnostic decides |
| 3 | S3 | Kernel-Associative Fast-Binding + Calibrated Abstention | 23.8 | Well-posed closed-form few-shot machinery with genuine abstention axis; ceiling: components map to known GP/selective prediction |
| 4 | R3 | Consensus-Split Decoding | 23.8 | Weakest novelty, but cheapest kill test (2 GPU-h) and its diagnostic doubles as the first stochasticity decomposition of the long-horizon baseline |
| 5 | R2 | ProbeAnchor | 24.2* | *Demoted: referent Δ identically zero under robot-init shift (its headline factor); observable-error assets remain valuable as shared probe infrastructure |
| 6 | C21 | Reconsolidation Associative Memory | 23.3 | Cleanest audited novelty among originals; attractor completion can't invert high-rank viewpoint warps |
| 7 | C26 | Self-Conditioned Action Flow | 21.7 | Proven zero-cost diffusion trick, fits the 4h finetune budget; long-horizon premise unevidenced |
| 8 | C20 | Funnel-Gated Re-Inference | 22.3* | *Demoted: audit 0.25, VLA-Corrector ships the identical event-triggered pattern |
| 9 | C12 | Habit/Goal Reliability Blending | 19.7 | Implemented on robots three times since 2012 |
| 10 | C13 | RD-IB Multi-View Bottleneck Adapter | 19.5 | Real supporting evidence (DRIBO/VDB) — and unpublishable at Q1/Q2 for exactly that reason |

## 7. Winner: R4 — Declarative Postcondition Retry (chair confidence 0.55)

**Mechanism**: ~1–1.5M-param probes on the frozen backbone's features check *declarative* (looked-up, not predicted) subgoal postconditions after each subtask; a violation triggers a scripted retreat-and-reattempt. The world-state reset answers the kill that destroyed every monitor-cluster candidate: the retry changes the *world*, not the query into a corrupted feature space. Retry arithmetic p→p(2−p) per subgoal attacks the multiplicative structure of the 23–46pt long-horizon gap directly.

**Chair justification (condensed)**: maximizes 3 of 4 Phase-9 criteria — strongest expected benchmark improvement (sr_gain 6/6/6, +5–15pt LIBERO-Long if the premise holds), highest publication confidence (only intact causal chain; the quantified failure taxonomy publishes even at moderate gains), most realistic implementation (diagnostic 1 costs **zero GPU** — relabel the existing 49.0% baseline failure logs; kill if <25% of failures are silent postcondition violations). Deficit: novelty (verify-then-retry is classical robotics; gate A failed) — so it publishes as a **rigorous measurement-plus-mechanism paper** (failure taxonomy + retry arithmetic + probe-verified recovery in a sub-500M VLA), targeted at RA-L/TMLR rather than a CoRL novel-mechanism headline.

**Portfolio move (chair-endorsed)**: R4 primary; run R1's cheap diagnostic in parallel — if R1's premise survives its identifiability test, R1 becomes the novelty headline and R4 the reliable second contribution.

## 8. Implementation roadmap (a100 primary, diagnostics-first)

Hard rule carried from project discipline: **every diagnostic below is pre-registered with a kill threshold and runs before any full build.** Frozen backbone throughout; ≥3 seeds for any reported number; matched-horizon-budget controls for R4 (retries consume timesteps).

| Step | What | A100-hours | Kill criterion (pre-registered) |
|---|---|---|---|
| 0a | R4 diagnostic 1: relabel the 100 existing baseline failure logs with postcondition outcomes | **0 (CPU)** | <25% of failures are silent postcondition violations with ≥1 chunk of blind continuation |
| 0b | R3 seed-variance decomposition (side value regardless of R3's fate) | ~2 | — (produces the stochasticity decomposition either way) |
| 1 | R4 probes (object-pose + in-gripper heads on cached frozen features, reuses R2 infra) | ~2 | probe error >1cm / false-positive rate >3% |
| 2 | R4 pilot: scripted retreat-and-reattempt on 3 LIBERO-Long tasks | ~12 (0.5 day) | retry-independence assumption fails (second attempt not ≈ fresh draw) |
| 3 | R1 Phase 0: feature cache + re-render + basis fit + span check | ~18–24 | test-time displacement not in span(B) — the gate-C objection, ~60-65% likely to kill |
| 4 | S3 Stage 1: KRR reconstruction + LoRA CV comparison on cached features | ~1–2 | KRR reconstruction L2 >1.5× LoRA's |
| 5 | Conditional full builds of survivors: R4 full LIBERO-Long + Meta-World eval (500 rollouts × 3 seeds), R1 perturbation-slice eval, S3 few-shot protocol | ~40–80 | standard ≥3-seed, mean±std, matched-budget |

Expected total if all three survive diagnostics: **~80–120 A100-hours (~1–2 weeks wall-clock on the shared box)**. Expected if diagnostics kill R1 and S3 (likely): ~20–40 A100-hours for the R4 paper.

## 9. Publication roadmap, risks, confidence

**Publication path (winner)**: RA-L primary (measurement+mechanism papers with real effect sizes fit; TinyVLA precedent), TMLR fallback (correctness-bar, sim-only fine). The paper stands on three legs: (1) the quantified failure taxonomy of a reproduced sub-500M baseline (novel data), (2) probe-verified declarative postcondition checking + physical retry (mechanism), (3) matched-budget honest accounting. If R1's diagnostic survives, elevate to CoRL with R1 as the novelty headline. Before any writing: the **mandatory dedicated novelty sweep** on the exact final claim (project rule), plus a workshop-proceedings pass (known audit gap).

**Top risks**: (1) R4 diagnostic 1 kills the premise — most failures may be early misperception, not silent violations (~50% likely; if so, the failure taxonomy still publishes as the honest negative + measurement core, and the mission's structural findings in §5 stand as the discovery-phase contribution). (2) Retry-horizon confound mishandled → reviewer kill (mitigated: matched-budget results pre-registered). (3) Scoop risk on verify-and-retry for VLAs specifically — SeqVLA-style follow-ups named by the debates; mitigation is speed and the taxonomy's uniqueness to our reproduced baseline.

**Mission confidence**: chair 0.55 that R4 is the right pick for a Q1/Q2 publication; my overall confidence that this run produced a publishable research program (winner + fallbacks + structural negative findings): **medium-high**. Confidence that any candidate here beats much larger VLAs as a headline: **low** — consistent with, and independently re-derived from, the archived research-direction report.

**Process record**: ~5.5M tokens (2–3M budgeted; overrun flagged twice mid-run), 7 workflows + 2 background agents, ~60 subagents total, 4 gate/debate waves, models per standing rule (Sonnet workers / Fable judges / Opus fallback). Multi-agent decision rule honored: every kill/keep/rank decision made by ≥3 independent agents or a 3-lens committee.

## Appendix A — Data provenance

- Phase artifacts: session scratchpad `phase1_result.json` (60 candidates + bottleneck map with citations), `phase34_wave{1..4}_result.json` (all gate verdicts + debate transcripts), `phase5_input_finalists.json` (16 finalists, full records), `revision_proposals{,_b}.json`.
- Workflow run IDs: wf_d6745c87 (scan), wf_bbbc66e2 (audit), wf_db0f359e / wf_1f3b46fd / wf_9dc567fa / wf_c146159e (gates+debates waves 1–4), wf_50ac471b (ranking+planning).
- Known process caveats: (a) 11 candidates (C49–C59) never received a dedicated novelty audit — their gate verdicts used scanner-level evidence with instructed extra skepticism; all 11 failed gates on non-novelty grounds as well. (b) The audit's arXiv/S2 coverage is preprint-centric; workshop proceedings were not systematically searched. (c) Debate verdicts are model judgments — substantive and specific, but not ground truth; every near-miss carries a pre-registered empirical kill-test as the decisive arbiter.

## 10. Novelty sweep addendum (ran 2026-07-10, post-selection)

**Verdict on R4's exact claim: PARTIAL_THIN_DELTA** (4 searchers, 1 adversarial judge; one searcher hallucination caught and purged in verification). Not scooped — no single work covers the four-way conjunction — but bracketed on every side: HELM (2604.18791) has verifier+rollback+LIBERO-Long+matched-budget+taxonomy (lacks only the internal-feature probe); ProbeAct (2606.09740) has probe-on-frozen-internals+recovery (geometric probe, CBF correction); Agentic Robot (2505.23450) has scripted-recovery+retry on LIBERO-Long (external VLM verifier); SAFE/VLA-Corrector/B2FF/FAR/Rewind-IL populate the remaining pairs.

**Surviving claim (use this wording, nothing broader):** first system where a learned subgoal-postcondition probe reading a frozen VLA's own internal features directly triggers scripted retreat-and-reattempt recovery, evaluated on LIBERO-Long under matched timestep budgets against both external-verifier-triggered and continuous-correction baselines, with a quantified taxonomy of silent postcondition violations.

**Execution obligations:** budget-matched head-to-heads vs a HELM/Agentic-Robot-style external verifier AND a ProbeAct-style continuous corrector; engage HELM's LIBERO-Recovery protocol and its 41/33/26 gap breakdown; 18 must-cite papers in `mission-artifacts-2026-07-10/novelty_sweep_r4.json`. Re-run a fresh scan immediately before submission — this exact area produced 4+ bracketing papers in 2026 alone.
