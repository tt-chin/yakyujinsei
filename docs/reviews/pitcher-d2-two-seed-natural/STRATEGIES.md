# D2 two-seed natural careers — preregistration

Seeds: `tob0ilu0`, `q77bi1jx`. Position P. Four independent target routes: CPBL, KBO, NPB, MLB (including the MiLB ladder). Eight careers, plus an exact replay of each career for verification. All begin at high school; no fixture changes or forced state.

Frozen strategy v1: allocate stamina until 60, then the lowest of vel/ctl/brk (ties in that order), stamina fallback if no pitching row is available. Use available native points/dice; never Undo, reset, or reroll. Always choose 全力投球, TJ surgery, and the SP conversion choice when presented. Roles remain subject to the game's normal rules.

In the target organization, prioritize available stay choices. Otherwise prefer a legal target contract/transfer/offer; prefer a first-team offer if present, then DOM order. MLB target includes legal MiLB contracts. NPB target includes legal NPB return offers. Never accept a decline/retirement label as a target offer. After these priorities: allocation confirmation/next, draft/pro application/acceptance/entry, first non-retirement option, then first available option. This fallback is not adjusted in response to outcomes.

Execution order: CPBL, KBO, NPB, MLB. Both seeds run in that order within each batch, then both replay. Stop additional batches upon engine exception, resource failure, or replay mismatch. Target not reached is a legitimate natural outcome, not a test failure or evidence of a bug.

Read-only observation reuses the frozen production-browser research driver and round-two hooks. Native functions are invoked once; observation does not draw random values. Preserve annual native stats, final S, complete action windows/choices, and every observed main-RNG value. Each replay must match full S, actions, study observations, and RNG count. Same seed with different target priorities is not an identical choice history.

D2 interpretation uses `PITCHER_AWARDS_D2_ANALYSIS.json.activeDerivation`, not archived sensitivity grids. No award draws are added. P07 is reported only as simultaneous P01/P02/P03 statistical qualification, not an earned triple crown. P08 S1/S2/S3 weights, base score and probability curves remain proposals. No thresholds are lowered after seeing results.

No game, previous research, VERSION, CHANGELOG, CURRENT_SPEC, BACKLOG or manifest modifications. No commit/push/deployment authorized for this investigation.
