'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import { useState, useEffect, useRef } from 'react';
import { Save, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { adminSettingsAPI } from '@/lib/api/admin-settings';
import type {
  AdminProfile,
  PlatformSettings,
  NotificationSettings,
  AdvancedSettings,
  Timezone
} from '../../types/settings';

export function SettingsContent() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for each settings section
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings | null>(null);
  const [timezones, setTimezones] = useState<Timezone[]>([]);

  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPlatform, setIsLoadingPlatform] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isLoadingAdvanced, setIsLoadingAdvanced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadProfile();
    loadPlatformSettings();
    loadNotificationSettings();
    loadAdvancedSettings();
    loadTimezones();
  }, []);

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const data = await adminSettingsAPI.getProfile();
      setProfile(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to load profile', variant: 'destructive' });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadPlatformSettings = async () => {
    setIsLoadingPlatform(true);
    try {
      const data = await adminSettingsAPI.getPlatformSettings();
      setPlatformSettings(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to load platform settings', variant: 'destructive' });
    } finally {
      setIsLoadingPlatform(false);
    }
  };

  const loadNotificationSettings = async () => {
    setIsLoadingNotifications(true);
    try {
      const data = await adminSettingsAPI.getNotificationSettings();
      setNotificationSettings(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to load notification settings', variant: 'destructive' });
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const loadAdvancedSettings = async () => {
    setIsLoadingAdvanced(true);
    try {
      const data = await adminSettingsAPI.getAdvancedSettings();
      setAdvancedSettings(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to load advanced settings', variant: 'destructive' });
    } finally {
      setIsLoadingAdvanced(false);
    }
  };

  const loadTimezones = async () => {
    try {
      const data = await adminSettingsAPI.getTimezones();
      setTimezones(data.timezones);
    } catch (error: any) {
      console.error('Failed to load timezones:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const updatedProfile = await adminSettingsAPI.updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone
      });
      setProfile(updatedProfile);
      toast({ title: 'Success', description: 'Profile updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update profile', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
      toast({ title: 'Error', description: 'Please upload a JPG, PNG, or GIF file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File size must be less than 5MB', variant: 'destructive' });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await adminSettingsAPI.uploadAvatar(file);
      setProfile(prev => prev ? { ...prev, avatar_url: result.avatar_url } : null);
      toast({ title: 'Success', description: 'Avatar uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to upload avatar', variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSavePlatformSettings = async () => {
    if (!platformSettings) return;
    setIsSaving(true);
    try {
      const updated = await adminSettingsAPI.updatePlatformSettings(platformSettings);
      setPlatformSettings(updated);
      toast({ title: 'Success', description: 'Platform settings updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update platform settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    if (!notificationSettings) return;
    setIsSaving(true);
    try {
      const updated = await adminSettingsAPI.updateNotificationSettings(notificationSettings);
      setNotificationSettings(updated);
      toast({ title: 'Success', description: 'Notification settings updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update notification settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAdvancedSettings = async () => {
    if (!advancedSettings) return;
    setIsSaving(true);
    try {
      const updated = await adminSettingsAPI.updateAdvancedSettings({
        maintenance_mode_enabled: advancedSettings.maintenance_mode_enabled,
        api_rate_limit_per_minute: advancedSettings.api_rate_limit_per_minute
      });
      setAdvancedSettings(prev => prev ? { ...prev, ...updated } : null);
      toast({ title: 'Success', description: 'Advanced settings updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update advanced settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    try {
      const result = await adminSettingsAPI.triggerBackup();
      toast({ title: 'Success', description: result.message || 'Backup started successfully' });
      await loadAdvancedSettings();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to trigger backup', variant: 'destructive' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      const result = await adminSettingsAPI.clearCache();
      toast({ title: 'Success', description: `Cache cleared: ${result.cleared_caches.join(', ')}` });
      await loadAdvancedSettings();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to clear cache', variant: 'destructive' });
    } finally {
      setIsClearingCache(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 24) return date.toLocaleString();
    else if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    else if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    else return 'Just now';
  };

  const getInitials = () => {
    if (!profile) return 'AD';
    return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'AD';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif"
        onChange={handleAvatarUpload}
        className="hidden"
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Administrator Profile</CardTitle>
              <CardDescription>Manage your admin account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingProfile ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : profile ? (
                <>
                  <div className="flex items-center gap-6">
                    <Avatar className="w-24 h-24">
                      {profile.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt={profile.first_name} />
                      ) : (
                        <AvatarFallback className="bg-gradient-primary text-white text-2xl font-semibold">
                          {getInitials()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Change Photo
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input
                        value={profile.first_name}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input
                        value={profile.last_name}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={profile.email}
                        disabled
                        className="mt-2 bg-muted"
                        title="Email cannot be changed for security reasons"
                      />
                    </div>
                    <div>
                      <Label>Phone (Optional)</Label>
                      <Input
                        type="tel"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingNotifications ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : notificationSettings ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-semibold">System Alerts</Label>
                        <p className="text-sm text-muted-foreground mt-1">Receive alerts for system issues</p>
                      </div>
                      <Switch
                        checked={notificationSettings.notify_system_alerts}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, notify_system_alerts: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-semibold">User Management</Label>
                        <p className="text-sm text-muted-foreground mt-1">New user registrations and changes</p>
                      </div>
                      <Switch
                        checked={notificationSettings.notify_user_management}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, notify_user_management: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-semibold">Security Events</Label>
                        <p className="text-sm text-muted-foreground mt-1">Security alerts and threats</p>
                      </div>
                      <Switch
                        checked={notificationSettings.notify_security_events}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, notify_security_events: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-semibold">Platform Performance</Label>
                        <p className="text-sm text-muted-foreground mt-1">Performance metrics and reports</p>
                      </div>
                      <Switch
                        checked={notificationSettings.notify_platform_performance}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, notify_platform_performance: checked })
                        }
                      />
                    </div>
                  </div>

                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleSaveNotificationSettings}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Notification Settings
                  </Button>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
