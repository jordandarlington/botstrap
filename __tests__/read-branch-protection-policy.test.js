const {
    getBranches,
    normalizeBranchProtectionPolicy,
    readBranchProtectionPolicyCapability,
} = require("../lib/capabilities/read-branch-protection-policy");

describe("readBranchProtectionPolicyCapability", () => {
    afterEach(() => {
        delete global.fetch;
        delete process.env.GITHUB_TOKEN;
    });

    it("queries branch protection through octokit", async () => {
        const getBranchProtection = jest.fn().mockResolvedValue({
            data: {
                lock_branch: {
                    enabled: true,
                },
            },
        });
        const context = {
            octokit: {
                rest: {
                    repos: {
                        getBranchProtection,
                    },
                },
            },
            log: {
                info: jest.fn(),
            },
        };

        const result = await readBranchProtectionPolicyCapability.handle(context, {
            owner: "interactive-investor",
            repo: "botstrap",
            branch: "main",
        });

        expect(getBranchProtection).toHaveBeenCalledWith({
            owner: "interactive-investor",
            repo: "botstrap",
            branch: "main",
        });
        expect(result).toEqual({
            owner: "interactive-investor",
            repo: "botstrap",
            branch: "main",
            protected: true,
            locked: true,
            policy: {
                lock_branch: {
                    enabled: true,
                },
            },
        });
    });

    it("returns unprotected status for a 404 response", async () => {
        const error = new Error("Not found");
        error.status = 404;

        const context = {
            octokit: {
                rest: {
                    repos: {
                        getBranchProtection: jest.fn().mockRejectedValue(error),
                    },
                },
            },
            log: {
                info: jest.fn(),
            },
        };

        const result = await readBranchProtectionPolicyCapability.handle(context, {
            owner: "interactive-investor",
            repo: "botstrap",
            branch: "main",
        });

        expect(result).toEqual({
            owner: "interactive-investor",
            repo: "botstrap",
            branch: "main",
            protected: false,
            locked: false,
            policy: null,
        });
    });

    it("queries branch protection through fetch for cli contexts", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({
                lock_branch: {
                    enabled: false,
                },
            }),
        });

        const context = {
            log: {
                info: jest.fn(),
            },
        };

        const result = await readBranchProtectionPolicyCapability.handle(context, {
            owner: "interactive-investor",
            repo: "botstrap",
            branch: "main",
            token: "secret",
        });

        expect(global.fetch).toHaveBeenCalledWith(
            "https://api.github.com/repos/interactive-investor/botstrap/branches/main/protection",
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer secret",
                }),
            }),
        );
        expect(result.locked).toBe(false);
        expect(result.protected).toBe(true);
    });

    it("queries multiple branches when branches are configured", async () => {
        const getBranchProtection = jest
            .fn()
            .mockResolvedValueOnce({
                data: {
                    lock_branch: {
                        enabled: false,
                    },
                },
            })
            .mockRejectedValueOnce(Object.assign(new Error("Not found"), {
                status: 404,
            }));
        const context = {
            octokit: {
                rest: {
                    repos: {
                        getBranchProtection,
                    },
                },
            },
            log: {
                info: jest.fn(),
            },
        };

        const result = await readBranchProtectionPolicyCapability.handle(context, {
            owner: "interactive-investor",
            repo: "botstrap",
            branches: ["main", "develop"],
        });

        expect(getBranchProtection).toHaveBeenNthCalledWith(1, {
            owner: "interactive-investor",
            repo: "botstrap",
            branch: "main",
        });
        expect(getBranchProtection).toHaveBeenNthCalledWith(2, {
            owner: "interactive-investor",
            repo: "botstrap",
            branch: "develop",
        });
        expect(result).toEqual([
            expect.objectContaining({
                branch: "main",
                protected: true,
                locked: false,
            }),
            expect.objectContaining({
                branch: "develop",
                protected: false,
                locked: false,
            }),
        ]);
    });

    it("normalizes branch config from branch, branches, or default branch", () => {
        expect(getBranches({ branch: "main" }, {})).toEqual(["main"]);
        expect(getBranches({ branches: ["main", "develop"] }, {})).toEqual(["main", "develop"]);
        expect(getBranches({ branches: "main" }, {})).toEqual(["main"]);
        expect(getBranches({}, {
            payload: {
                repository: {
                    default_branch: "trunk",
                },
            },
        })).toEqual(["trunk"]);
    });

    it("normalizes missing policy as unlocked and unprotected", () => {
        expect(normalizeBranchProtectionPolicy({
            owner: "interactive-investor",
            repo: "botstrap",
            branch: "main",
            policy: null,
        })).toEqual({
            owner: "interactive-investor",
            repo: "botstrap",
            branch: "main",
            protected: false,
            locked: false,
            policy: null,
        });
    });
});
