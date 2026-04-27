# Botstrap

Botstrap is a modular GitHub bot platform. It models automation as:

- **Modules**: business or development processes, such as greeting new pull requests.
- **Capabilities**: reusable functional actions, such as creating a pull request comment.
- **Runtimes**: where a module or capability can run, currently `github` and `cli`.

Modules compose capabilities. Not every module or capability needs to support every runtime.

## Current Modules

| Module | Runtime | Description |
| --- | --- | --- |
| `github-pull-request-initial-comment` | `github` | Posts an initial greeting on newly opened pull requests. |
| `github-issue-initial-action` | `github` | Posts an initial greeting on newly opened issues by posting a comment and Teams message. |
| `github-branch-protection-status` | `cli` | Checks whether a GitHub branch has protection enabled and whether it is locked. |
| `github-draft-pull-request-comment` | `github` | Comments on newly opened draft pull requests. |

## Current Capabilities

| Capability | Runtime | Description |
| --- | --- | --- |
| `create-pull-request-comment` | `github` | Creates a comment on a GitHub pull request. |
| `create-issue` | `github` | Creates a GitHub issue. |
| `create-issue-comment` | `github` | Creates a comment on a GitHub issue. |
| `create-teams-message` | `github` | Creates a Microsoft Teams webhook message. |
| `read-branch-protection-policy` | `github`, `cli` | Reads GitHub branch protection policies for one or more repository branches. |
| `read-pull-request` | `github`, `cli` | Reads GitHub pull request details. |

## Configuration

Botstrap reads repository config from:

```text
.github/botstrap.yml
```

Example:

```yaml
modules:
  github-pull-request-initial-comment:
    enabled: true
    capabilities:
      create-pull-request-comment:
        body: "Thanks for opening this pull request. We'll take a look shortly."

  github-issue-initial-action:
    enabled: true
    capabilities:
      create-issue-comment:
        body: "Thanks for opening this issue. We'll take a look shortly."
      create-teams-message:
        title: "New issue opened"
        message: "A new issue was opened. Use the Teams action to view it in GitHub."
        # Prefer TEAMS_WEBHOOK_URL in the environment. Use webhookUrl only for local/private configs.
        # webhookUrl: https://example.webhook.office.com/replace-me

  github-branch-protection-status:
    enabled: true
    capabilities:
      read-branch-protection-policy:
        owner: interactive-investor
        repo: botstrap
        branches:
          - main
          - develop
        # Prefer GITHUB_TOKEN in the environment. Use token only for local/private configs.
        # token: ghp_replace_me

  github-draft-pull-request-comment:
    enabled: true
    capabilities:
      create-pull-request-comment:
        body: "Thanks for opening this draft pull request. We'll wait until it is ready for review."
```

The `create-issue` capability can be added to a custom module configuration when that module should open a new GitHub issue:

```yaml
capabilities:
  create-issue:
    title: "Follow up required"
    body: "A Botstrap module detected something that needs attention."
    labels:
      - automation
```

The example config lives at [.github/botstrap.example.yml](.github/botstrap.example.yml).

## GitHub App Runtime

Run the Probot app locally:

```bash
npm run dev
```

Supported GitHub events:

- `pull_request.opened`
- `pull_request.reopened`
- `pull_request.converted_to_draft`
- `issues.opened`
- `issue_comment.created`

The current greeting modules run through the `github` runtime only.

## CLI

Install dependencies:

```bash
npm install
```

Run the CLI from this repo:

```bash
node bin/botstrap.js modules
node bin/botstrap.js capabilities
node bin/botstrap.js config validate --config .github/botstrap.example.yml
```

Install the CLI locally:

```bash
npm link
```

Then use:

```bash
botstrap modules
botstrap capabilities
botstrap config validate
```

If a repo does not have `.github/botstrap.yml`, initialize one:

```bash
botstrap init
```

`botstrap init` creates `.github/botstrap.yml` from the example config. It will not overwrite an existing file unless you pass `--force`.

CLI command aliases:

```bash
botstrap modules
botstrap list modules
botstrap capabilities
botstrap list capabilities
botstrap config validate
botstrap config:validate
```

Check branch protection status from a local repo:

```bash
GITHUB_TOKEN=... botstrap run github-branch-protection-status
```

You can also override repository and branch settings from the CLI:

```bash
GITHUB_TOKEN=... botstrap run github-branch-protection-status \
  --owner interactive-investor \
  --repo botstrap \
  --branches main,develop
```

The token is optional for public repositories, but private repositories need `GITHUB_TOKEN`, `--token`, or a `token` value in local config. Avoid committing real tokens to shared repo config.

## Development

Run tests:

```bash
npm test -- --runInBand
```

Key paths:

```text
app.js                         Probot event entrypoint
bin/botstrap.js                CLI entrypoint
lib/modules/                   Module definitions
lib/capabilities/              Capability definitions
lib/core/registry.js           Module registry
lib/core/capability-registry.js Capability registry
lib/utils/bot-runner.js        Shared module/capability runner
lib/cli/                       CLI commands and local config loading
```
