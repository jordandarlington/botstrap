const {
    createIssueCapability,
} = require("../lib/capabilities/create-issue");

describe("createIssueCapability", () => {
    it("creates an issue through the issues API", async () => {
        const create = jest.fn().mockResolvedValue({
            data: {
                number: 31,
                html_url: "https://github.com/interactive-investor/botstrap/issues/31",
                title: "Follow up from automation",
            },
        });
        const repo = jest.fn().mockReturnValue({
            owner: "interactive-investor",
            repo: "botstrap",
            title: "Follow up from automation",
            body: "Please review this follow-up.",
        });

        const context = {
            octokit: {
                rest: {
                    issues: {
                        create,
                    },
                },
            },
            repo,
        };

        const result = await createIssueCapability.handle(context, {
            title: "Follow up from automation",
            body: "Please review this follow-up.",
        });

        expect(repo).toHaveBeenCalledWith({
            title: "Follow up from automation",
            body: "Please review this follow-up.",
        });
        expect(create).toHaveBeenCalledWith({
            owner: "interactive-investor",
            repo: "botstrap",
            title: "Follow up from automation",
            body: "Please review this follow-up.",
        });
        expect(result).toEqual({
            number: 31,
            url: "https://github.com/interactive-investor/botstrap/issues/31",
            title: "Follow up from automation",
        });
    });

    it("supports optional labels, assignees, milestone, and message body alias", async () => {
        const create = jest.fn().mockResolvedValue({
            data: {
                number: 32,
                html_url: "https://github.com/interactive-investor/botstrap/issues/32",
                title: "Triage this",
            },
        });
        const repo = jest.fn().mockReturnValue({
            owner: "interactive-investor",
            repo: "botstrap",
            title: "Triage this",
            body: "Created from a module.",
        });

        const context = {
            octokit: {
                rest: {
                    issues: {
                        create,
                    },
                },
            },
            repo,
        };

        await createIssueCapability.handle(context, {
            title: "Triage this",
            message: "Created from a module.",
            labels: ["automation"],
            assignees: ["octocat"],
            milestone: 2,
        });

        expect(create).toHaveBeenCalledWith({
            owner: "interactive-investor",
            repo: "botstrap",
            title: "Triage this",
            body: "Created from a module.",
            labels: ["automation"],
            assignees: ["octocat"],
            milestone: 2,
        });
    });

    it("requires a title", async () => {
        await expect(createIssueCapability.handle({}, {})).rejects.toThrow(
            "create-issue requires title",
        );
    });
});
