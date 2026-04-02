const { riskPredictorModule } = require("../modules/risk-predictor");
const { branchLockerModule } = require("../modules/branch-locker");
const { semanticsAnalyserModule } = require("../modules/semantics-analyser");
const { teamsNotifierModule } = require("../modules/teams-notifier");

const moduleRegistry = [
    riskPredictorModule,
    branchLockerModule,
    semanticsAnalyserModule,
    teamsNotifierModule,
];

module.exports = {
    moduleRegistry,
};