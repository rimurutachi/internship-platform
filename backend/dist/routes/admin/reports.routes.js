"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportsController_1 = __importDefault(require("../../controllers/admin/reportsController"));
const router = (0, express_1.Router)();
router.get('/overview', reportsController_1.default.getOverview);
router.get('/monthly-stats', reportsController_1.default.getMonthlyStats);
router.get('/user-growth', reportsController_1.default.getUserGrowth);
router.get('/internship-status', reportsController_1.default.getInternshipStatus);
router.get('/evaluation-metrics', reportsController_1.default.getEvaluationMetrics);
router.get('/performance', reportsController_1.default.getPerformance);
router.get('/activity-timeline', reportsController_1.default.getActivityTimeline);
router.get('/trends/:metric', reportsController_1.default.getMetricTrend);
router.post('/export', reportsController_1.default.exportReport);
exports.default = router;
//# sourceMappingURL=reports.routes.js.map