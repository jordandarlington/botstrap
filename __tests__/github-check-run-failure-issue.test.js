const {
    githubCheckRunFailureIssueModule,
    matchesConfiguredCheckRun,
} = require("../lib/modules/github-check-run-failure-issue");

describe("githubCheckRunFailureIssueModule", () => {
    function createContext(overrides = {}) {
        const createComment = jest.fn().mockResolvedValue({
            data: { id: 123 },
        });
        const create = jest.fn().mockResolvedValue({
            data: {
                number: 77,
                html_url: "https://github.com/interactive-investor/botstrap/issues/77",
                title: "Fix failing ci check for PR #42",
            },
        });
        const repo = jest.fn((params) => ({
            owner: "interactive-investor",
            repo: "botstrap",
            ...params,
        }));

        return {
            payload: {
                repository: {
                    full_name: "interactive-investor/botstrap",
                },
                check_run: {
                    name: "ci",
                    conclusion: "failure",
                    html_url: "https://github.com/interactive-investor/botstrap/runs/1",
                    details_url: "https://ci.example.test/build/1",
                    pull_requests: [
                        {
                            number: 42,
                            html_url: "https://github.com/interactive-investor/botstrap/pull/42",
                        },
                    ],
                    ...overrides.check_run,
                },
            },
            octokit: {
                rest: {
                    issues: {
                        createComment,
                        create,
                    },
                },
            },
            repo,
            log: {
                info: jest.fn(),
            },
        };
    }

    it("comments on the pull request and creates an issue for a configured failed check run name", async () => {
        const context = createContext();

        const result = await githubCheckRunFailureIssueModule.handle(context, {
            checkRunNames: ["lint", "ci"],
            capabilities: {
                "create-pull-request-comment": {
                    body: "ci failed",
                },
                "create-issue": {
                    labels: ["ci-failure"],
                },
            },
        });

        expect(context.octokit.rest.issues.createComment).toHaveBeenCalledWith({
            owner: "interactive-investor",
            repo: "botstrap",
            issue_number: 42,
            body: "ci failed",
        });
        expect(context.octokit.rest.issues.create).toHaveBeenCalledWith({
            owner: "interactive-investor",
            repo: "botstrap",
            title: "Fix failing ci check for PR #42",
            body: [
                "The 'ci' check run failed for pull request #42.",
                "",
                "Pull request: https://github.com/interactive-investor/botstrap/pull/42",
                "Check run: https://github.com/interactive-investor/botstrap/runs/1",
                "Repository: interactive-investor/botstrap",
            ].join("\n"),
            labels: ["ci-failure"],
        });
        expect(result).toMatchObject({
            commented: true,
            issueCreated: true,
            issue: {
                number: 77,
                url: "https://github.com/interactive-investor/botstrap/issues/77",
            },
        });
    });

    it("skips failed check runs outside the configured name list", async () => {
        const context = createContext();

        const result = await githubCheckRunFailureIssueModule.handle(context, {
            checkRunNames: ["security", "deploy"],
        });

        expect(context.octokit.rest.issues.createComment).not.toHaveBeenCalled();
        expect(context.octokit.rest.issues.create).not.toHaveBeenCalled();
        expect(result).toMatchObject({
            commented: false,
            issueCreated: false,
        });
    });

    it("skips check runs that are not failures", async () => {
        const context = createContext({
            check_run: {
                conclusion: "success",
            },
        });

        const result = await githubCheckRunFailureIssueModule.handle(context, {
            checkRunName: "ci",
        });

        expect(context.octokit.rest.issues.createComment).not.toHaveBeenCalled();
        expect(context.octokit.rest.issues.create).not.toHaveBeenCalled();
        expect(result).toMatchObject({
            commented: false,
            issueCreated: false,
        });
    });

    it("skips failed check runs without pull requests", async () => {
        const context = createContext({
            check_run: {
                pull_requests: [],
            },
        });

        const result = await githubCheckRunFailureIssueModule.handle(context, {
            checkRunName: "ci",
        });

        expect(context.octokit.rest.issues.createComment).not.toHaveBeenCalled();
        expect(context.octokit.rest.issues.create).not.toHaveBeenCalled();
        expect(result).toMatchObject({
            commented: false,
            issueCreated: false,
        });
    });

    it("matches check run aliases and configured name lists", () => {
        expect(matchesConfiguredCheckRun({ name: "ci" }, { runName: "ci" })).toBe(true);
        expect(matchesConfiguredCheckRun({ name: "ci" }, { name: "ci" })).toBe(true);
        expect(matchesConfiguredCheckRun({ name: "ci" }, { checkRunNames: ["lint", "ci"] })).toBe(true);
        expect(matchesConfiguredCheckRun({ name: "ci" }, { checkRunNames: "ci" })).toBe(true);
        expect(matchesConfiguredCheckRun({ name: "ci" }, {})).toBe(true);
    });
});
