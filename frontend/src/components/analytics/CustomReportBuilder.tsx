'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, Download, Settings, Sparkles, ChevronDown } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface CustomReportBuilderProps {
  onExport: (reportData: any, format: 'csv' | 'json' | 'txt', template: string) => void;
}

type ReportTemplate = 
  | 'executive-summary' 
  | 'accreditation' 
  | 'program-improvement' 
  | 'industry-partner' 
  | 'custom';

export function CustomReportBuilder({ onExport }: CustomReportBuilderProps) {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<ReportTemplate>('executive-summary');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [reportTitle, setReportTitle] = useState('');
  
  // Metrics selection
  const [selectedMetrics, setSelectedMetrics] = useState({
    keyMetrics: true,
    internPerformance: true,
    ratingDistribution: true,
    aiAccuracy: true,
    timeSavings: true,
    topPerformers: true,
    evaluationStats: true,
    historicalTrends: false,
    comparison: false,
  });

  const handleMetricToggle = (metric: keyof typeof selectedMetrics) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const handleTemplateChange = (value: ReportTemplate) => {
    setTemplate(value);
    
    // Auto-configure metrics based on template
    switch (value) {
      case 'executive-summary':
        setSelectedMetrics({
          keyMetrics: true,
          internPerformance: true,
          ratingDistribution: false,
          aiAccuracy: true,
          timeSavings: true,
          topPerformers: true,
          evaluationStats: false,
          historicalTrends: true,
          comparison: true,
        });
        setReportTitle('Executive Summary Report');
        break;
      case 'accreditation':
        setSelectedMetrics({
          keyMetrics: true,
          internPerformance: true,
          ratingDistribution: true,
          aiAccuracy: true,
          timeSavings: false,
          topPerformers: false,
          evaluationStats: true,
          historicalTrends: true,
          comparison: false,
        });
        setReportTitle('Accreditation Compliance Report');
        break;
      case 'program-improvement':
        setSelectedMetrics({
          keyMetrics: true,
          internPerformance: true,
          ratingDistribution: true,
          aiAccuracy: false,
          timeSavings: false,
          topPerformers: true,
          evaluationStats: true,
          historicalTrends: true,
          comparison: true,
        });
        setReportTitle('Program Improvement Analysis Report');
        break;
      case 'industry-partner':
        setSelectedMetrics({
          keyMetrics: true,
          internPerformance: true,
          ratingDistribution: false,
          aiAccuracy: false,
          timeSavings: true,
          topPerformers: true,
          evaluationStats: false,
          historicalTrends: false,
          comparison: false,
        });
        setReportTitle('Industry Partner Performance Report');
        break;
      default:
        break;
    }
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date: Date | undefined): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleGenerateReport = (format: 'csv' | 'json' | 'txt') => {
    // This would normally fetch data based on date range and selected metrics
    // For now, we'll use mock data structure
    const reportData = {
      title: reportTitle || `Custom Report - ${template}`,
      template,
      dateRange: {
        from: formatDate(dateFrom),
        to: formatDate(dateTo),
      },
      selectedMetrics,
      // Include actual data based on selections
      keyMetrics: selectedMetrics.keyMetrics ? {
        activeInterns: 16,
        aiAccuracy: 97,
        timeSaved: 64,
        evaluations: 65,
      } : null,
      // Add other data sections based on selectedMetrics
    };

    onExport(reportData, format, template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 w-full lg:w-auto">
          <Sparkles className="w-4 h-4" />
          Custom Report Builder
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Custom Report Builder
          </DialogTitle>
          <DialogDescription>
            Create customized analytics reports for different stakeholders and purposes
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="template" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="date">Date Range</TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Report Template</CardTitle>
                <CardDescription>Choose a pre-configured template or create a custom report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={template} onValueChange={(value) => handleTemplateChange(value as ReportTemplate)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive-summary">
                        <div className="flex flex-col">
                          <span className="font-medium">Executive Summary</span>
                          <span className="text-xs text-muted-foreground">For university leadership</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="accreditation">
                        <div className="flex flex-col">
                          <span className="font-medium">Accreditation Report</span>
                          <span className="text-xs text-muted-foreground">For compliance and accreditation</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="program-improvement">
                        <div className="flex flex-col">
                          <span className="font-medium">Program Improvement</span>
                          <span className="text-xs text-muted-foreground">For strategic planning</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="industry-partner">
                        <div className="flex flex-col">
                          <span className="font-medium">Industry Partner Report</span>
                          <span className="text-xs text-muted-foreground">For partner decision-making</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">
                        <div className="flex flex-col">
                          <span className="font-medium">Custom Report</span>
                          <span className="text-xs text-muted-foreground">Fully customizable</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Report Title (Optional)</Label>
                  <Input
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Enter custom report title"
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Template Description:</h4>
                  {template === 'executive-summary' && (
                    <p className="text-sm text-muted-foreground">
                      High-level overview with key metrics, trends, and top performers. Includes historical comparison for leadership decision-making.
                    </p>
                  )}
                  {template === 'accreditation' && (
                    <p className="text-sm text-muted-foreground">
                      Comprehensive data for accreditation requirements including detailed metrics, compliance data, and historical trends.
                    </p>
                  )}
                  {template === 'program-improvement' && (
                    <p className="text-sm text-muted-foreground">
                      Detailed analysis focusing on areas for improvement, performance trends, and comparative analysis.
                    </p>
                  )}
                  {template === 'industry-partner' && (
                    <p className="text-sm text-muted-foreground">
                      Performance-focused report highlighting intern achievements, time savings, and top performers for partner engagement.
                    </p>
                  )}
                  {template === 'custom' && (
                    <p className="text-sm text-muted-foreground">
                      Fully customizable report. Select specific metrics and date ranges to create your own report.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Metrics to Include</CardTitle>
                <CardDescription>Choose which analytics sections to include in your report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="keyMetrics"
                      checked={selectedMetrics.keyMetrics}
                      onCheckedChange={() => handleMetricToggle('keyMetrics')}
                    />
                    <Label htmlFor="keyMetrics" className="cursor-pointer">
                      Key Metrics (Active Interns, AI Accuracy, Time Saved, Evaluations)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="internPerformance"
                      checked={selectedMetrics.internPerformance}
                      onCheckedChange={() => handleMetricToggle('internPerformance')}
                    />
                    <Label htmlFor="internPerformance" className="cursor-pointer">
                      Intern Performance Trends
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ratingDistribution"
                      checked={selectedMetrics.ratingDistribution}
                      onCheckedChange={() => handleMetricToggle('ratingDistribution')}
                    />
                    <Label htmlFor="ratingDistribution" className="cursor-pointer">
                      Rating Distribution
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="aiAccuracy"
                      checked={selectedMetrics.aiAccuracy}
                      onCheckedChange={() => handleMetricToggle('aiAccuracy')}
                    />
                    <Label htmlFor="aiAccuracy" className="cursor-pointer">
                      AI Accuracy Metrics
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="timeSavings"
                      checked={selectedMetrics.timeSavings}
                      onCheckedChange={() => handleMetricToggle('timeSavings')}
                    />
                    <Label htmlFor="timeSavings" className="cursor-pointer">
                      Time Savings from Automation
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="topPerformers"
                      checked={selectedMetrics.topPerformers}
                      onCheckedChange={() => handleMetricToggle('topPerformers')}
                    />
                    <Label htmlFor="topPerformers" className="cursor-pointer">
                      Top Performing Interns
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="evaluationStats"
                      checked={selectedMetrics.evaluationStats}
                      onCheckedChange={() => handleMetricToggle('evaluationStats')}
                    />
                    <Label htmlFor="evaluationStats" className="cursor-pointer">
                      Evaluation Status Overview
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="historicalTrends"
                      checked={selectedMetrics.historicalTrends}
                      onCheckedChange={() => handleMetricToggle('historicalTrends')}
                    />
                    <Label htmlFor="historicalTrends" className="cursor-pointer">
                      Historical Trends & Patterns
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="comparison"
                      checked={selectedMetrics.comparison}
                      onCheckedChange={() => handleMetricToggle('comparison')}
                    />
                    <Label htmlFor="comparison" className="cursor-pointer">
                      Period Comparison (vs Previous Period)
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="date" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Date Range Selection</CardTitle>
                <CardDescription>Select the time period for historical data analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${!dateFrom ? 'text-muted-foreground' : ''}`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateFrom ? formatDateDisplay(dateFrom) : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${!dateTo ? 'text-muted-foreground' : ''}`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateTo ? formatDateDisplay(dateTo) : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const sixMonthsAgo = new Date();
                      sixMonthsAgo.setMonth(today.getMonth() - 6);
                      setDateFrom(sixMonthsAgo);
                      setDateTo(today);
                    }}
                  >
                    Last 6 Months
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const oneYearAgo = new Date();
                      oneYearAgo.setFullYear(today.getFullYear() - 1);
                      setDateFrom(oneYearAgo);
                      setDateTo(today);
                    }}
                  >
                    Last Year
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateFrom(undefined);
                      setDateTo(undefined);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Download className="w-4 h-4" />
                Generate Report
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleGenerateReport('csv')}>
                <FileText className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateReport('json')}>
                <FileText className="w-4 h-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateReport('txt')}>
                <FileText className="w-4 h-4 mr-2" />
                Export as Text Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DialogContent>
    </Dialog>
  );
}

