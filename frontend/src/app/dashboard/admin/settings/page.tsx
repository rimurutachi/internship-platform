'use client';

import { SettingsContent } from '@/components/admin/SettingsContent';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage platform settings and configurations
        </p>
      </div>
      <SettingsContent />
    </div>
  );
}
