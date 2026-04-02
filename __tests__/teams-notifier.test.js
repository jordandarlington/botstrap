const { teamsNotifierModule } = require("../lib/modules/teams-notifier");

describe("teamsNotifierModule", () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        delete global.fetch;
        delete process.env.TEAMS_WEBHOOK_URL;
    });

    it("posts a Teams webhook for a pull request event", async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
        });

        const context = {
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
                    title: "Add teams notifier",
                    html_url: "https://github.com/interactive-investor/botstrap/pull/42",
                },
            },
            log: {
                info: jest.fn(),
            },
        };

        await teamsNotifierModule.handle(context, {
            webhookUrl: "https://example.test/webhook",
        });

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

        expect(payload.title).toBe("Pull request opened: Add teams notifier");
        expect(payload.text).toContain(
            "PR URL: https://github.com/interactive-investor/botstrap/pull/42",
        );
        expect(payload.sections[0].facts).toEqual(
            expect.arrayContaining([
                { name: "Repository", value: "interactive-investor/botstrap" },
                { name: "Pull Request", value: "#42" },
                { name: "Author", value: "jordan" },
                { name: "Action", value: "opened" },
            ]),
        );
        expect(payload.potentialAction[0].targets[0].uri).toBe(
            "https://github.com/interactive-investor/botstrap/pull/42",
        );
    });

    it("falls back to TEAMS_WEBHOOK_URL from the environment", async () => {
        process.env.TEAMS_WEBHOOK_URL = "https://example.test/from-env";
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
        });

        const context = {
            payload: {
                action: "reopened",
                repository: { full_name: "interactive-investor/botstrap" },
                sender: { login: "jordan" },
                pull_request: {
                    number: 5,
                    title: "Retry notifications",
                    html_url: "https://github.com/interactive-investor/botstrap/pull/5",
                },
            },
            log: {
                info: jest.fn(),
            },
        };

        await teamsNotifierModule.handle(context, {});

        expect(global.fetch).toHaveBeenCalledWith(
            "https://example.test/from-env",
            expect.any(Object),
        );
    });
});
