'use client';

import { useState } from 'react';
import { User, Bell, Lock, Globe, Database } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Button } from '@/components/ui/button';
import { SettingsContent } from '@/components/admin/SettingsContent';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AdminHeader />
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Page Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage platform and administrator settings</p>
              </div>

              <SettingsContent />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <MobileHeader
            title="Settings"
            subtitle="Platform Settings"
            logo={
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
            }
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Mobile Tab Selector */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={activeTab === 'general' ? 'default' : 'outline'}
                onClick={() => setActiveTab('general')}
                className="h-auto py-3"
              >
                <User className="w-4 h-4 mr-2" />
                <span className="text-xs">General</span>
              </Button>
              <Button
                variant={activeTab === 'platform' ? 'default' : 'outline'}
                onClick={() => setActiveTab('platform')}
                className="h-auto py-3"
              >
                <Globe className="w-4 h-4 mr-2" />
                <span className="text-xs">Platform</span>
              </Button>
              <Button
                variant={activeTab === 'notifications' ? 'default' : 'outline'}
                onClick={() => setActiveTab('notifications')}
                className="h-auto py-3"
              >
                <Bell className="w-4 h-4 mr-2" />
                <span className="text-xs">Notifications</span>
              </Button>
              <Button
                variant={activeTab === 'advanced' ? 'default' : 'outline'}
                onClick={() => setActiveTab('advanced')}
                className="h-auto py-3"
              >
                <Database className="w-4 h-4 mr-2" />
                <span className="text-xs">Advanced</span>
              </Button>
            </div>

            <SettingsContent />
          </div>
        </div>

        <div className="flex-shrink-0">
          <BottomNavigation type="admin" />
        </div>
      </div>
    </div>
  );
}
