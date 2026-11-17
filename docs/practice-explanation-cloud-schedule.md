# Cloud schedule handoff — not active

The user requires runs while their PC is off. No Windows task has been created.
This session has no general cloud task scheduling capability. This document and
the queue are preparation, not evidence of a registered schedule.

## Proposed cadence

- Timezone: Asia/Rangoon (Myanmar, UTC+06:30).
- Four daily slots: 01:00, 10:00, 15:00, 20:00.
- Gaps are 9, 5, 5 and 5 hours, so never less than five hours.
- First proposed run: November 17, 2026 at 15:00 Myanmar time.
- With N3-1 already completed this morning, the next three slots are November
  17 at 15:00 and 20:00, then November 18 at 01:00. Three additional slots
  cannot all fit before midnight today with five-hour spacing.
- One complete playable set per successful run; 23 sets, 1,613 questions and
  6,452 choices remain. Skip duplicate/empty N3-2 and N3-17 categories.
- Retry an incomplete set at the next slot. Stop when all sets are complete.
- These are scheduled start times, not guaranteed completion times.

Recurrence rule, if the scheduling UI supports it, with timezone explicitly set:

```text
RRULE:FREQ=DAILY;BYHOUR=1,10,15,20;BYMINUTE=0;BYSECOND=0
```

## Source access prerequisite

Use the connected `AungKoKoHein/JLPT` repository and select branch
`codex/jlpt-cloud-baseline-20261117`, which contains the N3-1 implementation,
source snapshots, saved explanations, tests, and batch instructions. Verify this
branch exists on GitHub before activating the task. A task that checks out only
`main` will not see this baseline until the draft PR is merged. A cloud task
cannot infer or recover files from a local computer or the earlier chat.

## Prompt for the cloud Scheduled task

> Continue adding saved Myanmar explanations to the Practice tab in the connected
> AungKoKoHein/JLPT repository. Use the cloud repository environment, not my PC.
> Check out branch codex/jlpt-cloud-baseline-20261117. Read docs/practice-explanation-progress.json and
> docs/practice-explanation-batch-prompt.md from the branch containing the saved
> N3-1 implementation. Complete exactly one remaining playable set per run, in
> ascending order. N3-1 is complete; N3-2 and N3-17 are duplicate/empty categories.
> Cover all four choices in Myanmar: the correct choice's reason, and the meaning
> and actual reason each wrong choice fails this question. For wholly unrelated
> choices, a translation plus a brief mismatch explanation is sufficient. Explain
> close grammar and reading choices precisely. For ★ questions show full order
> and the role of each piece. Verify reading explanations against the passage and
> PDF images. Flag faulty source keys without inventing reasons. Bundle content
> so the button opens saved explanations without on-click AI. Preserve existing
> work, run checks, and update the durable progress record after success. Keep an
> incomplete set pending rather than skipping it. Store completed changes on the
> branch codex/jlpt-cloud-baseline-20261117, committing and pushing each completed
> batch there so the next cloud run can read it. This supersedes the local-only
> publication restriction in the batch prompt for this branch only. Do not merge to
> main or deploy production without separate authorization. Stop scheduling once
> all remaining sets are complete. Report the completed set, counts, check results
> and any blockers after each run.

See the [official scheduled-task documentation](https://learn.chatgpt.com/docs/automations)
for cloud source-access requirements and the Scheduled interface.
