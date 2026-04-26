const {
    buildTeamsPayload,
    createTeamsMessageCapability,
} = require("../lib/capabilities/create-teams-message");

describe("createTeamsMessageCapability", () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        delete global.fetch;
        delete process.env.TEAMS_WEBHOOK_URL;
    });

    function createPullRequestContext() {
        return {
            payload: {
                action: "opened",
                repository: {
                    full_name: "interactive-investor/botstrap",
                },
                sender: {
                    login: "jordan",
                },
                pull_request: {
                    number: 42,
                    title: "Add Teams capability",
                    html_url: "https://github.com/interactive-investor/botstrap/pull/42",
                },
            },
            log: {
                info: jest.fn(),
            },
        };
    }

    function createIssueContext() {
        return {
            payload: {
                action: "opened",
                repository: {
                    full_name: "interactive-investor/botstrap",
                },
                sender: {
                    login: "jordan",
                },
                issue: {
                    number: 24,
                    title: "Something is broken",
                    html_url: "https://github.com/interactive-investor/botstrap/issues/24",
                },
            },
            log: {
                info: jest.fn(),
            },
        };
    }

    it("posts a Teams webhook with a default pull request payload", async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
        });

        const result = await createTeamsMessageCapability.handle(
            createPullRequestContext(),
            {
                webhookUrl: "https://example.test/webhook",
            },
        );

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            "https://example.test/webhook",
            expect.objectContaining({
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            }),
        );

        const [, request] = global.fetch.mock.calls[0];
        const payload = JSON.parse(request.body);

        expect(payload.title).toBe("Pull request opened: Add Teams capability");
        expect(payload.text).toContain("PR #42");
        expect(payload.sections[0].facts).toEqual(expect.arrayContaining([
            { name: "Repository", value: "interactive-investor/botstrap" },
            { name: "Pull Request", value: "#42" },
            { name: "Author", value: "jordan" },
            { name: "Action", value: "opened" },
        ]));
        expect(payload.potentialAction[0].targets[0].uri).toBe(
            "https://github.com/interactive-investor/botstrap/pull/42",
        );
        expect(result.status).toBe(200);
    });

    it("builds an issue payload with a link to the issue", () => {
        const payload = buildTeamsPayload(createIssueContext());

        expect(payload.title).toBe("Issue opened: Something is broken");
        expect(payload.text).toContain("issue #24");
        expect(payload.sections[0].facts).toEqual(expect.arrayContaining([
            { name: "Repository", value: "interactive-investor/botstrap" },
            { name: "Issue", value: "#24" },
            { name: "Author", value: "jordan" },
            { name: "Action", value: "opened" },
        ]));
        expect(payload.potentialAction).toEqual([
            {
                "@type": "OpenUri",
                name: "Open issue",
                targets: [
                    {
                        os: "default",
                        uri: "https://github.com/interactive-investor/botstrap/issues/24",
                    },
                ],
            },
        ]);
    });

    it("falls back to TEAMS_WEBHOOK_URL from the environment", async () => {
        process.env.TEAMS_WEBHOOK_URL = "https://example.test/from-env";
        global.fetch.mockResolvedValue({
            ok: true,
            status: 202,
        });

        await createTeamsMessageCapability.handle(createPullRequestContext());

        expect(global.fetch).toHaveBeenCalledWith(
            "https://example.test/from-env",
            expect.any(Object),
        );
    });

    it("allows custom title, text, facts, actions, and theme color", () => {
        const payload = buildTeamsPayload(createPullRequestContext(), {
            title: "Custom title",
            text: "Custom text",
            themeColor: "FF00AA",
            facts: [
                { name: "Custom", value: "Fact" },
            ],
            actions: [],
        });

        expect(payload.title).toBe("Custom title");
        expect(payload.text).toBe("Custom text");
        expect(payload.themeColor).toBe("FF00AA");
        expect(payload.sections[0].facts).toEqual([
            { name: "Custom", value: "Fact" },
        ]);
        expect(payload.potentialAction).toEqual([]);
    });

    it("throws when no webhook URL is configured", async () => {
        await expect(
            createTeamsMessageCapability.handle(createPullRequestContext()),
        ).rejects.toThrow("create-teams-message requires webhookUrl or TEAMS_WEBHOOK_URL");
    });

    it("throws when the Teams webhook fails", async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 500,
            text: jest.fn().mockResolvedValue("nope"),
        });

        await expect(
            createTeamsMessageCapability.handle(createPullRequestContext(), {
                webhookUrl: "https://example.test/webhook",
            }),
        ).rejects.toThrow("Teams webhook failed with 500: nope");
    });
});
