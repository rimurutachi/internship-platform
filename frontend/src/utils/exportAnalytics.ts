// @ts-ignore - file-saver types not available
import { saveAs } from 'file-saver';

// Analytics data types
interface AnalyticsData {
  keyMetrics: {
    activeInterns: number;
    aiAccuracy: number;
    timeSaved: number;
    evaluations: number;
  };
  internPerformance: Array<{
    month: string;
    avgRating: number;
    interns: number;
  }>;
  ratingDistribution: Array<{
    rating: string;
    count: number;
    percentage: number;
  }>;
  aiAccuracy: Array<{
    month: string;
    aiRating: number;
    manualRating: number;
    accuracy: number;
  }>;
  timeSavings: Array<{
    task: string;
    hours: number;
  }>;
  topPerformingInterns: Array<{
    intern: string;
    avgRating: number;
    evaluations: number;
    hireStatus: string;
  }>;
  evaluationStats: Array<{
    type: string;
    count: number;
  }>;
}

// Export as CSV
export const exportAnalyticsToCSV = (data: AnalyticsData) => {
  const lines: string[] = [];
  
  // Header
  lines.push('Supervisor Analytics Report');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');
  
  // Key Metrics
  lines.push('KEY METRICS');
  lines.push('Metric,Value');
  lines.push(`Active Interns,${data.keyMetrics.activeInterns}`);
  lines.push(`AI Accuracy,${data.keyMetrics.aiAccuracy}%`);
  lines.push(`Time Saved,${data.keyMetrics.timeSaved}h`);
  lines.push(`Total Evaluations,${data.keyMetrics.evaluations}`);
  lines.push('');
  
  // Intern Performance Trends
  lines.push('INTERN PERFORMANCE TRENDS');
  lines.push('Month,Average Rating,Intern Count');
  data.internPerformance.forEach(item => {
    lines.push(`${item.month},${item.avgRating},${item.interns}`);
  });
  lines.push('');
  
  // Rating Distribution
  lines.push('RATING DISTRIBUTION');
  lines.push('Rating,Count,Percentage');
  data.ratingDistribution.forEach(item => {
    lines.push(`${item.rating},${item.count},${item.percentage}%`);
  });
  lines.push('');
  
  // AI Accuracy Metrics
  lines.push('AI ACCURACY METRICS');
  lines.push('Month,AI Rating,Manual Rating,Accuracy %');
  data.aiAccuracy.forEach(item => {
    lines.push(`${item.month},${item.aiRating},${item.manualRating},${item.accuracy}`);
  });
  lines.push('');
  
  // Time Savings
  lines.push('TIME SAVINGS');
  lines.push('Task,Hours');
  data.timeSavings.forEach(item => {
    lines.push(`${item.task},${item.hours}`);
  });
  lines.push('');
  
  // Top Performing Interns
  lines.push('TOP PERFORMING INTERNS');
  lines.push('Intern,Average Rating,Evaluations,Hire Status');
  data.topPerformingInterns.forEach(item => {
    lines.push(`${item.intern},${item.avgRating},${item.evaluations},${item.hireStatus}`);
  });
  lines.push('');
  
  // Evaluation Stats
  lines.push('EVALUATION STATUS');
  lines.push('Status,Count');
  data.evaluationStats.forEach(item => {
    lines.push(`${item.type},${item.count}`);
  });
  
  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `supervisor-analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
  saveAs(blob, fileName);
};

// Export as JSON
export const exportAnalyticsToJSON = (data: AnalyticsData) => {
  const report = {
    title: 'Supervisor Analytics Report',
    generatedAt: new Date().toISOString(),
    data
  };
  
  const jsonContent = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const fileName = `supervisor-analytics-report-${new Date().toISOString().split('T')[0]}.json`;
  saveAs(blob, fileName);
};

// Export as Text Report
export const exportAnalyticsToText = (data: AnalyticsData) => {
  const lines: string[] = [];
  
  lines.push('='.repeat(60));
  lines.push('SUPERVISOR ANALYTICS REPORT');
  lines.push('='.repeat(60));
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');
  
  // Key Metrics
  lines.push('KEY METRICS');
  lines.push('-'.repeat(60));
  lines.push(`Active Interns:           ${data.keyMetrics.activeInterns}`);
  lines.push(`AI Accuracy:              ${data.keyMetrics.aiAccuracy}%`);
  lines.push(`Time Saved:               ${data.keyMetrics.timeSaved} hours`);
  lines.push(`Total Evaluations:        ${data.keyMetrics.evaluations}`);
  lines.push('');
  
  // Intern Performance Trends
  lines.push('INTERN PERFORMANCE TRENDS');
  lines.push('-'.repeat(60));
  lines.push('Month        | Avg Rating | Intern Count');
  lines.push('-'.repeat(60));
  data.internPerformance.forEach(item => {
    lines.push(`${item.month.padEnd(12)} | ${item.avgRating.toFixed(1).padStart(10)} | ${item.interns.toString().padStart(11)}`);
  });
  lines.push('');
  
  // Rating Distribution
  lines.push('RATING DISTRIBUTION');
  lines.push('-'.repeat(60));
  lines.push('Rating                            | Count | Percentage');
  lines.push('-'.repeat(60));
  data.ratingDistribution.forEach(item => {
    lines.push(`${item.rating.padEnd(34)} | ${item.count.toString().padStart(5)} | ${item.percentage}%`);
  });
  lines.push('');
  
  // AI Accuracy Metrics
  lines.push('AI ACCURACY METRICS');
  lines.push('-'.repeat(60));
  lines.push('Month  | AI Rating | Manual Rating | Accuracy %');
  lines.push('-'.repeat(60));
  data.aiAccuracy.forEach(item => {
    lines.push(`${item.month.padEnd(6)} | ${item.aiRating.toFixed(1).padStart(9)} | ${item.manualRating.toFixed(1).padStart(13)} | ${item.accuracy.toString().padStart(11)}`);
  });
  lines.push('');
  
  // Time Savings
  lines.push('TIME SAVINGS FROM AUTOMATION');
  lines.push('-'.repeat(60));
  data.timeSavings.forEach(item => {
    lines.push(`${item.task}: ${item.hours} hours`);
  });
  lines.push('');
  
  // Top Performing Interns
  lines.push('TOP PERFORMING INTERNS');
  lines.push('-'.repeat(60));
  lines.push('Intern Name       | Avg Rating | Evaluations | Hire Status');
  lines.push('-'.repeat(60));
  data.topPerformingInterns.forEach(item => {
    lines.push(`${item.intern.padEnd(17)} | ${item.avgRating.toFixed(1).padStart(10)} | ${item.evaluations.toString().padStart(11)} | ${item.hireStatus}`);
  });
  lines.push('');
  
  // Evaluation Stats
  lines.push('EVALUATION STATUS OVERVIEW');
  lines.push('-'.repeat(60));
  lines.push('Status      | Count');
  lines.push('-'.repeat(60));
  data.evaluationStats.forEach(item => {
    lines.push(`${item.type.padEnd(11)} | ${item.count}`);
  });
  lines.push('');
  lines.push('='.repeat(60));
  lines.push('END OF REPORT');
  lines.push('='.repeat(60));
  
  const textContent = lines.join('\n');
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
  const fileName = `supervisor-analytics-report-${new Date().toISOString().split('T')[0]}.txt`;
  saveAs(blob, fileName);
};

