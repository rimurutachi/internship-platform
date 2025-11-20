'use client';

import { useState } from 'react';
import { UserProvider, useUserContext } from '@/components/providers/UserProvider';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { CurrentInternshipCard } from '@/components/student/CurrentInternshipCard';
import { EvaluationsCard } from '@/components/student/EvaluationsCard';
import { SkillsAssessmentCard } from '@/components/student/SkillsAssessmentCard';
import { QuickActionsCard } from '@/components/student/QuickActionsCard';
import { AIInsightsCard, RecentMessagesCard, UpcomingDeadlinesCard } from '@/components/student/AIInsightsCard';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { QuickActionGrid } from '@/components/mobile/QuickActionGrid';
import { StudentAnalytics } from '@/components/analytics/StudentAnalytics';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, MessageSquare, BarChart3, FileText } from 'lucide-react';

/**
 * StudentDashboard Component
 * 
 * Main dashboard view for students with desktop and mobile layouts.
 * Includes tabs for dashboard and analytics views.
 */
const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useUserContext();
  
  const quickActions = [
    { icon: ClipboardList, label: 'Tasks', color: 'bg-primary' },
    { icon: MessageSquare, label: 'Chat', color: 'bg-blue-500' },
    { icon: BarChart3, label: 'Progress', color: 'bg-purple-500' },
    { icon: FileText, label: 'Docs', color: 'bg-indigo-500' },
  ];

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.first_name?.charAt(0) || '';
    const lastInitial = user.last_name?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  };

  return (
      <div className="h-screen bg-background overflow-hidden">
        {/* Desktop View */}
        <div className="hidden lg:flex h-full">
          {/* Left Sidebar */}
          <StudentSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <StudentHeader />
          
          {/* Dashboard Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-muted mb-6">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <div className="grid lg:grid-cols-4 gap-6">
                  {/* Main Content Area */}
                  <div className="lg:col-span-3 space-y-6">
                    {/* Current Internship Card */}
                    <CurrentInternshipCard />
                    
                    {/* Two Column Layout for Cards */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <EvaluationsCard />
                      <SkillsAssessmentCard />
                    </div>
                    
                    {/* Quick Actions */}
                    <QuickActionsCard />
                  </div>
                  
                  {/* Right Sidebar */}
                  <div className="space-y-6">
                    <AIInsightsCard />
                    <RecentMessagesCard />
                    <UpcomingDeadlinesCard />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                <StudentAnalytics />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader 
          title="Intern-Galing"
          notificationCount={3}
          logo={
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IG</span>
            </div>
          }
        />

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          {/* Welcome Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="p-4 flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-2 border-primary">
                <AvatarImage src={user?.profile_data?.avatar_url} />
                <AvatarFallback className="bg-gradient-primary text-white font-bold text-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Welcome, {user?.first_name || 'Student'}!
                </h2>
                <p className="text-sm text-muted-foreground">
                  {user?.profile_data?.education || 'Computer Science'} \u2022 MIT
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Current Internship Status - Mobile Optimized */}
          <CurrentInternshipCard />

          {/* Quick Actions Grid - Mobile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <QuickActionGrid actions={quickActions} />
            </CardContent>
          </Card>

          {/* Latest Evaluation - Mobile */}
          <EvaluationsCard />

          {/* AI Insights - Mobile */}
          <AIInsightsCard />
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation type="student" />
      </div>
    </div>
  );
};

export default StudentDashboard;