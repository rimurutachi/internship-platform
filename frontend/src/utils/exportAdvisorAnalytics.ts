// @ts-expect-error - file-saver types not available
import { saveAs } from 'file-saver';

// Advisor Analytics data types
interface AdvisorAnalyticsData {
  keyMetrics: {
    activeStudents: number;
    aiAccuracy: number;
    timeSaved: number;
    biasAlerts: number;
  };
  cohortPerformance: Array<{
    month: string;
    avgGrade: number;
    students: number;
  }>;
  gradeDistribution: Array<{
    grade: string;
    count: number;
    percentage: number;
  }>;
  aiAccuracy: Array<{
    month: string;
    aiGrade: number;
    manualGrade: number;
    accuracy: number;
  }>;
  timeSavings: Array<{
    task: string;
    hours: number;
  }>;
  companyPartnerships: Array<{
    company: string;
    interns: number;
    avgRating: number;
    hireRate: number;
  }>;
  biasDetection: Array<{
    type: string;
    detected: number;
    resolved: number;
  }>;
}

// Export as CSV
export const exportAdvisorAnalyticsToCSV = (data: AdvisorAnalyticsData) => {
  const lines: string[] = [];
  
  // Header
  lines.push('Advisor Analytics Report');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');
  
  // Key Metrics
  lines.push('KEY METRICS');
  lines.push('Metric,Value');
  lines.push(`Active Students,${data.keyMetrics.activeStudents}`);
  lines.push(`AI Accuracy,${data.keyMetrics.aiAccuracy}%`);
  lines.push(`Time Saved,${data.keyMetrics.timeSaved}h`);
  lines.push(`Bias Alerts,${data.keyMetrics.biasAlerts}`);
  lines.push('');
  
  // Cohort Performance Trends
  lines.push('COHORT PERFORMANCE TRENDS');
  lines.push('Month,Average Grade,Student Count');
  data.cohortPerformance.forEach(item => {
    lines.push(`${item.month},${item.avgGrade},${item.students}`);
  });
  lines.push('');
  
  // Grade Distribution
  lines.push('GRADE DISTRIBUTION');
  lines.push('Grade,Count,Percentage');
  data.gradeDistribution.forEach(item => {
    lines.push(`${item.grade},${item.count},${item.percentage}%`);
  });
  lines.push('');
  
  // AI Accuracy Metrics
  lines.push('AI ACCURACY METRICS');
  lines.push('Month,AI Grade,Manual Grade,Accuracy %');
  data.aiAccuracy.forEach(item => {
    lines.push(`${item.month},${item.aiGrade},${item.manualGrade},${item.accuracy}`);
  });
  lines.push('');
  
  // Time Savings
  lines.push('TIME SAVINGS');
  lines.push('Task,Hours');
  data.timeSavings.forEach(item => {
    lines.push(`${item.task},${item.hours}`);
  });
  lines.push('');
  
  // Company Partnerships
  lines.push('COMPANY PARTNERSHIP METRICS');
  lines.push('Company,Interns Placed,Average Rating,Hire Rate %');
  data.companyPartnerships.forEach(item => {
    lines.push(`${item.company},${item.interns},${item.avgRating},${item.hireRate}`);
  });
  lines.push('');
  
  // Bias Detection
  lines.push('BIAS DETECTION REPORTS');
  lines.push('Bias Type,Detected,Resolved');
  data.biasDetection.forEach(item => {
    lines.push(`${item.type},${item.detected},${item.resolved}`);
  });
  
  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `advisor-analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
  saveAs(blob, fileName);
};

// Export as JSON
export const exportAdvisorAnalyticsToJSON = (data: AdvisorAnalyticsData) => {
  const report = {
    title: 'Advisor Analytics Report',
    generatedAt: new Date().toISOString(),
    data
  };
  
  const jsonContent = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const fileName = `advisor-analytics-report-${new Date().toISOString().split('T')[0]}.json`;
  saveAs(blob, fileName);
};

// Export as Text Report
export const exportAdvisorAnalyticsToText = (data: AdvisorAnalyticsData) => {
  const lines: string[] = [];
  
  lines.push('='.repeat(60));
  lines.push('ADVISOR ANALYTICS REPORT');
  lines.push('='.repeat(60));
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');
  
  // Key Metrics
  lines.push('KEY METRICS');
  lines.push('-'.repeat(60));
  lines.push(`Active Students:          ${data.keyMetrics.activeStudents}`);
  lines.push(`AI Accuracy:              ${data.keyMetrics.aiAccuracy}%`);
  lines.push(`Time Saved:               ${data.keyMetrics.timeSaved} hours`);
  lines.push(`Bias Alerts:              ${data.keyMetrics.biasAlerts}`);
  lines.push('');
  
  // Cohort Performance Trends
  lines.push('COHORT PERFORMANCE TRENDS');
  lines.push('-'.repeat(60));
  lines.push('Month        | Avg Grade | Student Count');
  lines.push('-'.repeat(60));
  data.cohortPerformance.forEach(item => {
    lines.push(`${item.month.padEnd(12)} | ${item.avgGrade.toString().padStart(9)} | ${item.students.toString().padStart(12)}`);
  });
  lines.push('');
  
  // Grade Distribution
  lines.push('GRADE DISTRIBUTION');
  lines.push('-'.repeat(60));
  lines.push('Grade                            | Count | Percentage');
  lines.push('-'.repeat(60));
  data.gradeDistribution.forEach(item => {
    lines.push(`${item.grade.padEnd(34)} | ${item.count.toString().padStart(5)} | ${item.percentage}%`);
  });
  lines.push('');
  
  // AI Accuracy Metrics
  lines.push('AI ACCURACY METRICS');
  lines.push('-'.repeat(60));
  lines.push('Month  | AI Grade | Manual Grade | Accuracy %');
  lines.push('-'.repeat(60));
  data.aiAccuracy.forEach(item => {
    lines.push(`${item.month.padEnd(6)} | ${item.aiGrade.toString().padStart(8)} | ${item.manualGrade.toString().padStart(12)} | ${item.accuracy.toString().padStart(11)}`);
  });
  lines.push('');
  
  // Time Savings
  lines.push('TIME SAVINGS FROM AUTOMATION');
  lines.push('-'.repeat(60));
  data.timeSavings.forEach(item => {
    lines.push(`${item.task}: ${item.hours} hours`);
  });
  lines.push('');
  
  // Company Partnerships
  lines.push('COMPANY PARTNERSHIP METRICS');
  lines.push('-'.repeat(60));
  lines.push('Company Name       | Interns | Avg Rating | Hire Rate %');
  lines.push('-'.repeat(60));
  data.companyPartnerships.forEach(item => {
    lines.push(`${item.company.padEnd(19)} | ${item.interns.toString().padStart(7)} | ${item.avgRating.toFixed(1).padStart(10)} | ${item.hireRate.toString().padStart(10)}`);
  });
  lines.push('');
  
  // Bias Detection
  lines.push('BIAS DETECTION REPORTS');
  lines.push('-'.repeat(60));
  lines.push('Bias Type          | Detected | Resolved');
  lines.push('-'.repeat(60));
  data.biasDetection.forEach(item => {
    lines.push(`${item.type.padEnd(18)} | ${item.detected.toString().padStart(8)} | ${item.resolved.toString().padStart(8)}`);
  });
  lines.push('');
  lines.push('='.repeat(60));
  lines.push('END OF REPORT');
  lines.push('='.repeat(60));
  
  const textContent = lines.join('\n');
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
  const fileName = `advisor-analytics-report-${new Date().toISOString().split('T')[0]}.txt`;
  saveAs(blob, fileName);
};

