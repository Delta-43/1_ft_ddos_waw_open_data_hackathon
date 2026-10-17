# GitHub setup and PR pipeline

Delta owns bootstrap. Do this before feature work. No remote repository, invitation, or ruleset has been created by this starter.

## Bootstrap

1. Confirm the repository owner, visibility, and all five GitHub usernames. Do not infer handles from names.
2. Authenticate GitHub CLI with `gh auth login`, or use the GitHub website.
3. From the project root, initialise once: `git init -b main`.
4. Review `.gitignore`, then run `git add .` and `git diff --cached --stat`. Check no secrets are staged.
5. Commit: `git commit -m "Bootstrap team workspace and CI"`.
6. Create the agreed repository using `gh repo create OWNER/REPO --private --source=. --remote=origin --push` (or select the agreed visibility in the website).
7. Invite the other four verified accounts with Write access through repository Settings → Collaborators. The repository owner performs this step.
8. Open Actions and confirm both jobs pass on the initial push. Fix bootstrap failures before splitting work.
9. Enable branch protection/rulesets for main, where supported by the repository's plan and visibility.

## Protect main early

Require a pull request, one approving review from someone other than the author, and the latest branch to pass `backend-checks` and `frontend-checks`.
Select the actual check names shown by the first successful Actions run. Require resolved conversations and disallow force pushes/deletion.
Use squash merging and delete merged branches. Do not require a merge queue for this small team.
If a merge queue is enabled later, add `merge_group` to CI triggers first.
If the account plan cannot enforce protection, document that limitation and enforce the same review/check procedure manually; do not claim protection is enabled.

`.github/CODEOWNERS` uses the verified handles listed in AGENTS.md.
CODEOWNERS lists eligible reviewers; listing Delta and Alban does not require both to approve. Request both explicitly for shared contract changes.

## Issues and board

Create labels: `backend`, `frontend`, `data`, `contract`, `integration`, `pitch`, `blocked`, and `stretch`.
Create a project board with Ready → In progress → Review → Done. Limit each person to one active implementation issue.
Turn each TODO.md row into an issue. Assign the owner, request the reviewer, copy acceptance criteria, and link dependencies.
Example: `gh issue create --title "DATA-01: Import one Warsaw dataset" --body-file path/to/reviewed-issue.md --assignee VERIFIED_HANDLE`.
Use the Task issue template for new work. Link created issues back in TODO.md once, then track live state in GitHub.

## Daily contribution loop

Each member clones separately or creates a separate Git worktree. Never share a mutable checkout between agents.

```bash
git switch main
git pull --ff-only
git switch -c sonia/12-warsaw-dataset
# Implement one bounded issue and run the checks in DEVELOPMENT.md.
git add <specific-files>
git commit -m "Import Warsaw dataset with provenance"
git push -u origin HEAD
gh pr create --draft
```

Use your own name and real issue number. Experts help novices run this sequence; do not copy placeholders literally.
PRs include the linked issue, observable result, checks run, screenshots for interface changes, and mocked behaviour.
Mark ready when checks pass. The pair reviews; Delta and Alban review shared contracts.
Reviewer asks for fixes or approves; a non-author merges after required checks pass. If CI fails, fix it before merging.
After a merge, update main in the integration checkout and run the smoke test. Avoid bundling unrelated changes.

## CI scope

The supplied workflow runs on all PRs and pushes to main, with read-only repository permissions and no secrets.
Backend: Ruff, API validation behaviour, and response/JSON-schema compatibility.
Frontend: strict TypeScript and production build, using the committed pnpm lockfile.
No external AI, routing, map, or city API is required for CI. Test those manually against the shared demo.
Python dependency ranges are an initial bootstrap convenience; Delta should lock the tested environment before adding service integrations.
Do not introduce self-hosted CI on the demo computer during the event.

References: [required checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks), [Python CI](https://docs.github.com/en/actions/tutorials/build-and-test-code/python).

## Without GitHub CLI

All gh commands are optional. Use the website: New repository, Settings → Collaborators, Issues → New issue, Pull requests → New pull request, then request a reviewer. Use the Checks tab to inspect CI. Each member signs in independently; no shared token or owner agent tooling is needed. For a fresh Saturday scaffold, update workflow commands and required check names to match that build before declaring bootstrap complete.
