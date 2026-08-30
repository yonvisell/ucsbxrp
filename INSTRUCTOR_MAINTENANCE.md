# UCSBXRP instructor maintenance

This guide is for instructors who curate the public UCSBXRP course and deploy
it at <https://yonvisell.github.io/ucsbxrp/>. It covers repository access,
review, coordinated challenge changes, validation, deployment, and recovery.
Student use of the IDE and robot is documented in the course Guide instead.

## Repository and release path

- Source repository: <https://github.com/yonvisell/ucsbxrp>
- Owner: the personal GitHub account `yonvisell`
- Default and deployment branch: `main`
- Deployment workflow: [`.github/workflows/pages.yml`](.github/workflows/pages.yml)
- Public site: <https://yonvisell.github.io/ucsbxrp/>
- Current release record: [`vendor/current/release.json`](vendor/current/release.json)
- Published project catalog:
  [`vendor/current/project_catalog.json`](vendor/current/project_catalog.json)

The Pages workflow runs on a push to `main` or a manual dispatch. Its `build`
job runs `npm run check:fast` and uploads `dist`; `browser-tests` separately
runs `npm run test:browser`; `deploy` publishes the build artifact to the
`github-pages` environment only after both jobs pass. Check both validation
jobs and the deploy job before accepting a release.

The workflow grants only `contents: read`, `pages: write`, and
`id-token: write`. These are the permissions required for a custom Pages
workflow; it uses GitHub's short-lived `GITHUB_TOKEN` and OpenID Connect rather
than a stored personal token. See GitHub's documentation for
[custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
and [Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Grant a co-instructor access

### Choose the least access that supports the work

A repository owned by a personal account has only two repository roles: owner
and collaborator. A collaborator can read, push, review, and merge; a personal
repository cannot give that person a narrower organization-style `Maintain` or
`Triage` role. See
[permission levels for a personal repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository).

- If the co-instructor only needs to propose occasional changes, no invitation
  is required: this is a public repository, so they can fork it and submit pull
  requests. The owner remains the only merger.
- If the co-instructor must create repository branches, curate pull requests,
  and merge approved course changes, **Collaborator** is the minimum available
  access. Do not share the owner's account, password, token, or SSH key.
- If more granular roles or teams become necessary, move the repository to a
  GitHub organization. That is an ownership change and should be planned
  separately.

### Owner: send the invitation

1. Obtain the co-instructor's exact GitHub username.
2. Open the repository, then **Settings → Collaborators → Add people**.
3. Select the correct account and send the invitation.

The authoritative procedure is GitHub's
[inviting collaborators to a personal repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository).

### Co-instructor: accept and verify

1. Sign in to the invited GitHub account and accept the email or GitHub
   notification.
2. Open <https://github.com/yonvisell/ucsbxrp>.
3. Confirm that a new non-`main` branch can be created. Do not test access by
   committing directly to `main`.

Acceptance grants collaborator write access. Repository settings, access
management, and other owner-only controls remain with `yonvisell`.

## Protect `main` before relying on collaborator access

Branch protection is GitHub-hosted state and is not encoded in this checkout.
At the checked repository inspection on 2026-08-29, the public repository API
exposed no active repository ruleset, while legacy branch-protection state
could not be confirmed without owner authentication. The owner should verify
the live settings rather than infer protection from this file.

For this two-instructor repository, create a rule for `main` under
**Settings → Rules → Rulesets** or **Settings → Branches**:

1. Require a pull request before merging.
2. Require one approval from the instructor who did not author the change.
3. Require resolution of review conversations.
4. Block force pushes and branch deletion.
5. Do not give the collaborator routine bypass permission.

GitHub documents the available controls under
[protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
and [repository rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository).

Do not yet require the current `build` or `browser-tests` jobs as pull-request
status checks: the tracked workflow has no `pull_request` trigger, so those jobs
do not run on a pull request. A future workflow revision should add a
pull-request validation path while keeping deployment gated to pushes to
`main`. Only then should those job names become required checks. GitHub explains
[required status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
and [repository Actions settings](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository).

There is currently no tracked `CODEOWNERS` file or pull-request template, so
assign the other instructor as reviewer explicitly.

## Ordinary change workflow

Use one short-lived branch per coherent correction, for example
`instructor/challenge-3-wording` or `instructor/range-demo-tuning`.

1. Start from current `main` and create the branch.
2. Make one coherent change. Do not combine course-content changes with
   unrelated application refactoring.
3. Validate only the affected behavior during iteration, then run the release
   boundary checks specified below.
4. Open a pull request to `main`. State the student-visible result, files or
   interfaces changed, exact validation performed, and whether a physical XRP
   was exercised.
5. Request review from the other instructor. Review the rendered course text,
   executable behavior, and release coordination—not merely the diff shape.
6. Merge only after approval and applicable checks. Confirm the Pages workflow
   and the deployed origin separately.

For one Markdown, text, or JSON correction, first create and select a non-`main`
branch in GitHub's branch selector. Edit the file on that branch, commit the
change to the same branch, then open a pull request. GitHub's
[web file editor](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files)
and `github.dev` are sufficient when no generated artifact or executable test
is affected.

For a multi-file challenge, Python change, reference implementation, release
update, browser application, or physical-XRP change, use a local clone. GitHub
Desktop can manage cloning, branches, commits, pushes, and pull requests
without command-line Git; see
[managing branches in GitHub Desktop](https://docs.github.com/en/desktop/making-changes-in-a-branch/managing-branches-in-github-desktop)
and [creating a pull request](https://docs.github.com/en/desktop/working-with-your-remote-repository-on-github-or-github-enterprise/creating-an-issue-or-pull-request-from-github-desktop).
The local project still needs the Node version in `.nvmrc`, `npm ci`, Python 3,
and the validation commands below. `github.dev` cannot run the MicroPython,
offline, browser, USB, or robot checks.

## Editing a published challenge

The files that define one challenge are coordinated rather than independent:

| Responsibility | Authoritative repository location |
| --- | --- |
| Student task, flow, configuration, world, checks, and cumulative project | `vendor/current/starters/challenge_N/` |
| Browser label, summary, source, component boundary, and publication state | `vendor/current/project_catalog.json` |
| Canonical documented student component stub | `vendor/current/student_component_templates/<component>.py` |
| Readable supplied implementation | `vendor/current/reference_source/ucsb_xrp_reference/` |
| Generated supplied implementation used by browser and robot | `vendor/current/reference_mpy/ucsb_xrp_reference/` |
| Public course library and service behavior | `vendor/current/ucsb_xrp/` and `device_service/` |
| Public API/course definition | the three `v2_*.txt` files, `docs/COURSE_AND_LIBRARY_SUMMARY.md`, and relevant rendered Guide/API source |
| Release identity, hashes, compiler identity, and robot compatibility floor | `vendor/current/release.json` |

Use these rules:

- Change an existing published challenge directly in its starter directory and
  update its existing catalog entry. `challenge_authoring.py create` is for a
  new ID and refuses an existing one; `publish` only changes a checked draft to
  published. There is no repository `update` or `unpublish` command.
- `world.json` is the single source for bounds, initial pose, obstacles, and
  markers used by project Python, the simulator, and the Monitor. Do not copy
  those coordinates into prose or another JavaScript world.
- Each `complete_challenge_N` catalog entry shares the same starter source and
  selects supplied implementations. Do not create a second solution project;
  keep the challenge and complete catalog labels consistent.
- If a canonical student component contract or starter explanation changes,
  edit the canonical file under `student_component_templates` and then run
  `python3 scripts/sync_student_component_templates.py`. This command
  deliberately overwrites that component in every cumulative starter from its
  introduction onward; inspect the entire resulting diff.
- If supplied behavior changes, edit retained reference **source**, rebuild the
  `.mpy` artifacts, and update their manifest. Never edit an `.mpy` file.
  Reference-module ownership is not necessarily one module per challenge;
  inspect `course_setup.py` imports before adding a new module.
- Keep component selection explicit in `course_setup.py`. Do not add hidden
  browser, service, or simulator clamps that alter student inputs or outputs.
  Bounds or protective behavior must be visible in the public runtime contract,
  project configuration, or explicitly selected component so students can
  observe, reason about, and fail against it.
- Preserve Challenges 1–2 as orientation and integration steps. Make a narrow
  correction when it removes a real ambiguity or failure; do not make early
  projects architecturally elaborate merely to match later extensions.

The detailed new-challenge workflow is in
[`docs/INSTRUCTOR_CHALLENGE_AUTHORING.md`](docs/INSTRUCTOR_CHALLENGE_AUTHORING.md).

### Reference bytecode and release metadata

The reference build is intentionally explicit and reproducible:

```sh
python3 scripts/reference_bytecode.py build \
  --mpy-cross /absolute/path/to/pinned-mpy-cross
python3 scripts/reference_bytecode.py verify
```

The script requires the MicroPython 1.28.0 `mpy-cross` identity recorded in
`scripts/reference_bytecode.py`, compiles twice, and rejects differing output.
It writes generated bytecode and prints the compiler/artifact manifest; it does
**not** rewrite `release.json`. Copy the reviewed `reference_compiler` and
`reference_artifacts` values into the release record deliberately.

If `vendor/current/ucsb_xrp/` changes, obtain its new recorded identity with:

```sh
python3 scripts/course_release.py hash
```

Update `source_file_count` and `source_sha256` in `release.json`, then verify:

```sh
python3 scripts/course_release.py verify
```

For every published bundle, advance `release_id` and the monotonic
`release_sequence`; never reuse a published identity for different bytes.
Raise `compatibility.minimum_robot_release_sequence` only when the physical
robot must contain a newer service, course library, or supplied `.mpy`. A
browser-only wording or layout change does not by itself require a newer robot.
When the robot runtime changes, keep `device_service/ucsb_xrp_service/service.py`
and the commissioning bundle aligned with the new release. Update the public
API revision and all three active course documents only for a coordinated
public-interface change.

## Proportional validation

During editing, use the smallest check that can expose the plausible error.
Before merging a published release, use the applicable release boundary below.

### Text or link only

- Inspect the rendered Markdown or page at narrow and ordinary widths.
- Follow every changed link.
- Run `git diff --check`; do not run robot or unrelated challenge suites.

### Existing or new challenge, demo, or tutorial

For a challenge, run its structural check:

```sh
python3 scripts/challenge_authoring.py check challenge_N
```

Demos and tutorials do not use `challenge_authoring.py`; compile and exercise
the affected template directly in the IDE.

Then, in the IDE:

1. Compile the affected project with the browser's MicroPython compiler.
2. Run its component checks when it has student components.
3. Run the supplied/complete task on the Virtual XRP and inspect the Monitor
   world, completion, final zero command, and assignment evidence.
4. Introduce one representative student defect for each changed assessment
   boundary and confirm that the intended check fails; restore the source.
5. Exercise the physical XRP only when physical sensing, timing, calibration,
   communication, or motion plausibly changed. Record release, project commit,
   configuration, motion safety condition, and observed result.

For a catalog or bundled-project change, also run:

```sh
npm run check:fast
npx playwright test tests/e2e/course-starters.spec.ts --project=stable-chrome
```

Run the focused instructor-authoring browser file only if the specification,
wizard, generator, or authoring contract changed:

```sh
npx playwright test tests/e2e/instructor-authoring.spec.ts --project=stable-chrome
```

### Reference class, public library, target, or application change

- Run the relevant focused Python/Vitest/Playwright file while iterating.
- Run `python3 scripts/reference_bytecode.py verify` after any reference change.
- Run `python3 scripts/course_release.py verify` after any course-library change.
- Run one complete affected Virtual-XRP workflow.
- Run the bounded physical workflow when target/service/hardware behavior
  changed; hardware evidence is not inferred from simulator success.
- At the coherent release boundary, run `npm run check`. Do not repeat it after
  edits that cannot affect its results.

`npm run check` comprises formatting, Python, MicroPython, unit, build, offline,
and stable-browser checks. It is a release boundary, not a substitute for the
student-visible virtual or physical task.

## Deploy and verify Pages

1. Merge the reviewed pull request into `main`. Do not commit built `dist/`;
   the workflow builds and uploads it.
2. In the repository's **Actions** tab, open **Deploy course tools to GitHub
   Pages** for the merge commit. Require `build` and `browser-tests` to pass and
   confirm `deploy` published that same commit. GitHub documents
   [workflow-run inspection](https://docs.github.com/en/actions/how-tos/monitor-workflows/view-workflow-run-history).
3. Compare the deployed record with the merged source, bypassing an edge-cache
   hit with a unique query value:

   ```sh
   curl -fsS \
     "https://yonvisell.github.io/ucsbxrp/course/current/release.json?verify=MERGE_SHA"
   ```

4. Open the public Home, IDE, Monitor, Guide/API, and any affected project. The
   Home footer and release endpoint must show the intended release. Verify the
   changed workflow at the **public HTTPS origin**, not only on localhost.
5. Allow the existing service worker to acquire the complete new shell and
   reload at its state-safe boundary. An old open tab or offline profile may
   continue showing the preceding complete release until that handoff.

The owner should also verify **Settings → Pages → Source: GitHub Actions** and
**Settings → Actions → General** after any permission change. The Pages job's
`github-pages` environment can be restricted to `main`; environment protection
is described in GitHub's
[deployment-environment documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments).

## Rollback and recovery

- Before publication, amend or close the branch; do not rewrite `main`.
- For an ordinary merged change, use GitHub's **Revert** action to create a new
  reviewed pull request. See
  [reverting a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/reverting-a-pull-request).
- If the change was already a published course release, restore the known-good
  content in a **new, higher** release sequence. Do not republish an old release
  ID or decrement the sequence: offline clients and commissioned robots use
  monotonic release and compatibility identities.
- A Pages rollback does not reconfigure an XRP. If the failed release changed
  robot runtime bytes or raised the compatibility floor, issue a forward
  corrective release and commission it through the normal transactional
  setup/repair path.
- After recovery, require the same applicable checks and public-origin
  verification. Do not force-push `main` or manually replace Pages artifacts.

## Public-data and credential boundaries

This repository is public. Anything committed—including Git history—is public.

- Never commit Wi-Fi passwords, GitHub tokens, private keys, student records,
  unsanitized diagnostic logs, or student Working folders.
- `.hardware-private/`, `outputs/`, local hardware evidence, `STATUS.md`, Codex
  handoffs, and internal user/development harness files are intentionally
  ignored. Keep them local unless a separately reviewed public artifact is
  deliberately created.
- `vendor/current/reference_source/` is excluded from the student Pages bundle
  but is tracked in this public GitHub repository. It is not confidential.
- The workflow currently requires no repository secret. Do not add a long-lived
  personal access token for Pages; use the scoped workflow permissions already
  present.
- Before every commit, inspect both `git status --short` and the staged file
  list. Add intended paths explicitly rather than staging the entire working
  tree.
- No license file is currently tracked. Public visibility is not, by itself, a
  software license; choose and add one deliberately if external reuse terms
  need to be granted.

## Browser authoring: current and future capability

**Current capability.** The public
[challenge author](https://yonvisell.github.io/ucsbxrp/author/) creates a new
challenge specification, validates its teaching fields and worlds, opens a
generated unpublished draft in the IDE, and reopens a saved specification. The
downloaded JSON can be passed to `scripts/challenge_authoring.py create`, then
checked and explicitly published. It does not load an existing deployed
catalog entry for editing, modify this repository, create a pull request,
change GitHub permissions, or deploy Pages. Existing Challenge 1–8 corrections
therefore use the repository workflow in this guide.

**Proposed future workflow—not implemented.** An instructor editor should load
a published challenge with an explicit source revision, edit its assignment and
`world.json`, run the generated project virtually, and export a deterministic
repository patch or GitHub branch/pull request. GitHub authorization should use
a narrowly scoped GitHub App or OAuth flow, never a pasted personal token. The
result should still require review, coordinated release generation, CI, and
Pages verification; the browser editor should not write directly to `main` or
deploy independently.
