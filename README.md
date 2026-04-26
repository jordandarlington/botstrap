# Botstrap

Botstrap is a modular GitHub bot platform. It models automation as:

- **Modules**: business or development processes, such as greeting new pull requests.
- **Capabilities**: reusable functional actions, such as creating a pull request comment.
- **Runtimes**: where a module or capability can run, currently `github` and `cli`.

Modules compose capabilities. Not every module or capability needs to support every runtime.

## Current Modules

| Module | Runtime | Description |
| --- | --- | --- |
| `pull-request-greeting` | `github` | Posts an initial greeting on newly opened pull requests. |
| `issue-greeting` | `github` | Posts an initial greeting on newly opened issues. |

## Current Capabilities

| Capability | Runtime | Description |
| --- | --- | --- |
| `create-pull-request-comment` | `github` | Creates a comment on a GitHub pull request. |
| `create-issue-comment` | `github` | Creates a comment on a GitHub issue. |

## Configuration

Botstrap reads repository config from:

```text
.github/botstrap.yml
```

Example:

```yaml
modules:
  pull-request-greeting:
    enabled: true
    capabilities:
      create-pull-request-comment:
        body: "Thanks for opening this pull request. We'll take a look shortly."

  issue-greeting:
    enabled: true
    capabilities:
      create-issue-comment:
        body: "Thanks for opening this issue. We'll take a look shortly."
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

Note: the CLI can list modules, list capabilities, validate config, and initialize config today. Running modules through the CLI is supported by the shared runner, but the current modules are marked `github` only, so `botstrap run <module>` will reject them until a module declares `cli` support.

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
