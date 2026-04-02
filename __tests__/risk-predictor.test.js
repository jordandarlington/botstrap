const { riskPredictorModule } = require("../lib/modules/risk-predictor");

describe("riskPredictorModule", () => {
    it("posts a pull request comment through the issues API", async () => {
        const createComment = jest.fn().mockResolvedValue({
            data: { id: 123 },
        });
        const issue = jest.fn().mockReturnValue({
            owner: "interactive-investor",
            repo: "botstrap",
            issue_number: 42,
            body: "[botstrap] Module called: risk-predictor",
        });

        const context = {
            octokit: {
                issues: {
                    createComment,
                },
            },
            issue,
        };

        await riskPredictorModule.handle(context, {});

        expect(issue).toHaveBeenCalledWith({
            body: "[botstrap] Module called: risk-predictor",
        });
        expect(createComment).toHaveBeenCalledWith({
            owner: "interactive-investor",
            repo: "botstrap",
            issue_number: 42,
            body: "[botstrap] Module called: risk-predictor",
        });
    });
});
