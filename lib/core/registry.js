const { riskPredictorModule } = require("../modules/risk-predictor");
const { teamsNotifierModule } = require("../modules/teams-notifier");

const moduleRegistry = [riskPredictorModule, teamsNotifierModule];

module.exports = {
    moduleRegistry,
};