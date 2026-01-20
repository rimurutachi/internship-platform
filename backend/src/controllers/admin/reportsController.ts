import ReportsService from '../../services/reportsService';
import { Request, Response } from 'express';
import { ensureString } from '../../utils/typeGuards';

class ReportsController {
  static async getOverview(req: Request, res: Response) {
    try {
      const data = await ReportsService.getOverview();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch overview.' });
    }
  }

  static async getMonthlyStats(req: Request, res: Response) {
    try {
      const months = parseInt(req.query.months as string) || 12;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const data = await ReportsService.generateMonthlyStats(months, year);
      res.json({ data });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch monthly stats.' });
    }
  }

  static async getUserGrowth(req: Request, res: Response) {
    try {
      const groupBy = (req.query.groupBy as string) || 'month';
      const periods = parseInt(req.query.periods as string) || 12;
      const data = await ReportsService.generateUserGrowth(groupBy, periods);
      res.json({ data });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user growth.' });
    }
  }

  static async getInternshipStatus(req: Request, res: Response) {
    try {
      const groupBy = (req.query.groupBy as string) || 'status';
      const data = await ReportsService.generateInternshipStatus(groupBy);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch internship status.' });
    }
  }

  static async getEvaluationMetrics(req: Request, res: Response) {
    try {
      let dateRange: { start?: string; end?: string } = {};
      if (typeof req.query.dateRange === 'object' && req.query.dateRange !== null) {
        dateRange = req.query.dateRange as { start?: string; end?: string };
      } else if (typeof req.query.dateRange === 'string') {
        // If passed as a string, try to parse as JSON
        try {
          dateRange = JSON.parse(req.query.dateRange);
        } catch {
          dateRange = {};
        }
      }
      const data = await ReportsService.generateEvaluationMetrics(dateRange);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch evaluation metrics.' });
    }
  }

  static async getPerformance(req: Request, res: Response) {
    try {
      const data = await ReportsService.generatePerformanceMetrics();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch performance metrics.' });
    }
  }

  static async getActivityTimeline(req: Request, res: Response) {
    try {
      const timeframe = (req.query.timeframe as string) || '24h';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await ReportsService.generateActivityTimeline(timeframe, page, limit);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch activity timeline.' });
    }
  }

  static async getMetricTrend(req: Request, res: Response) {
    try {
      const metric = ensureString(req.params.metric, 'metric');
      const days = parseInt(req.query.days as string) || 30;
      const data = await ReportsService.generateMetricTrend(metric, days);
      res.json({ metric, trend: data });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch metric trend.' });
    }
  }

  static async exportReport(req: Request, res: Response) {
    try {
      const { format, metrics, dateRange, groupBy } = req.body;
      if (!['csv', 'json', 'pdf'].includes(format)) {
        return res.status(400).json({ error: 'Invalid export format.' });
      }
      const file = await ReportsService.exportReport(format, metrics, dateRange, groupBy);
      res.setHeader('Content-Disposition', `attachment; filename=intern-galing-report-${new Date().toISOString().slice(0,10)}.${format}`);
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.send(file);
      } else if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.send(file);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.send(file);
      }
    } catch (err: any) {
      if (err.code === '413') {
        res.status(413).json({ error: 'File too large for export.' });
      } else {
        res.status(500).json({ error: 'Failed to export report.' });
      }
    }
  }
}

export default ReportsController;
