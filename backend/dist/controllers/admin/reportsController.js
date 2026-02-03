"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const reportsService_1 = __importDefault(require("../../services/reportsService"));
const typeGuards_1 = require("../../utils/typeGuards");
class ReportsController {
    static async getOverview(req, res) {
        try {
            const data = await reportsService_1.default.getOverview();
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: 'Failed to fetch overview.' });
        }
    }
    static async getMonthlyStats(req, res) {
        try {
            const months = parseInt(req.query.months) || 12;
            const year = req.query.year ? parseInt(req.query.year) : undefined;
            const data = await reportsService_1.default.generateMonthlyStats(months, year);
            res.json({ data });
        }
        catch (err) {
            res.status(500).json({ error: 'Failed to fetch monthly stats.' });
        }
    }
    static async getUserGrowth(req, res) {
        try {
            const groupBy = req.query.groupBy || 'month';
            const periods = parseInt(req.query.periods) || 12;
            const data = await reportsService_1.default.generateUserGrowth(groupBy, periods);
            res.json({ data });
        }
        catch (err) {
            res.status(500).json({ error: 'Failed to fetch user growth.' });
        }
    }
    static async getInternshipStatus(req, res) {
        try {
            const groupBy = req.query.groupBy || 'status';
            const data = await reportsService_1.default.generateInternshipStatus(groupBy);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: 'Failed to fetch internship status.' });
        }
    }
    static async getEvaluationMetrics(req, res) {
        try {
            let dateRange = {};
            if (typeof req.query.dateRange === 'object' && req.query.dateRange !== null) {
                dateRange = req.query.dateRange;
            }
            else if (typeof req.query.dateRange === 'string') {
                // If passed as a string, try to parse as JSON
                try {
                    dateRange = JSON.parse(req.query.dateRange);
                }
                catch {
                    dateRange = {};
                }
            }
            const data = await reportsService_1.default.generateEvaluationMetrics(dateRange);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: 'Failed to fetch evaluation metrics.' });
        }
    }
    static async getPerformance(req, res) {
        try {
            const data = await reportsService_1.default.generatePerformanceMetrics();
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: 'Failed to fetch performance metrics.' });
        }
    }
    static async getActivityTimeline(req, res) {
        try {
            const timeframe = req.query.timeframe || '24h';
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const data = await reportsService_1.default.generateActivityTimeline(timeframe, page, limit);
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: 'Failed to fetch activity timeline.' });
        }
    }
    static async getMetricTrend(req, res) {
        try {
            const metric = (0, typeGuards_1.ensureString)(req.params.metric, 'metric');
            const days = parseInt(req.query.days) || 30;
            const data = await reportsService_1.default.generateMetricTrend(metric, days);
            res.json({ metric, trend: data });
        }
        catch (err) {
            res.status(500).json({ error: 'Failed to fetch metric trend.' });
        }
    }
    static async exportReport(req, res) {
        try {
            const { format, metrics, dateRange, groupBy } = req.body;
            if (!['csv', 'json', 'pdf'].includes(format)) {
                return res.status(400).json({ error: 'Invalid export format.' });
            }
            const file = await reportsService_1.default.exportReport(format, metrics, dateRange, groupBy);
            res.setHeader('Content-Disposition', `attachment; filename=intern-galing-report-${new Date().toISOString().slice(0, 10)}.${format}`);
            if (format === 'pdf') {
                res.setHeader('Content-Type', 'application/pdf');
                res.send(file);
            }
            else if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.send(file);
            }
            else {
                res.setHeader('Content-Type', 'application/json');
                res.send(file);
            }
        }
        catch (err) {
            if (err.code === '413') {
                res.status(413).json({ error: 'File too large for export.' });
            }
            else {
                res.status(500).json({ error: 'Failed to export report.' });
            }
        }
    }
}
exports.default = ReportsController;
//# sourceMappingURL=reportsController.js.map