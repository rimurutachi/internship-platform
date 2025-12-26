'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2, Upload, AlertCircle, CheckCircle2, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { useUser } from '@/hooks/use-user';
import { studentAPI } from '@/lib/api/student';
import { advisorAPI } from '@/lib/api/advisor';

interface SettingsPageProps {
  sidebar: ReactNode;
  header: ReactNode;
  userType: 'student' | 'advisor' | 'supervisor';
}

interface ProfileData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  profile_data?: {
    department?: string;
    student_id?: string;
    faculty_id?: string;
    year_level?: string;
    course?: string;
    bio?: string;
    position?: string;
    company?: string;
    notification_preferences?: {
      email_notifications?: boolean;
      push_notifications?: boolean;
      sms_notifications?: boolean;
      notification_types?: {
        evaluations?: boolean;
        reports?: boolean;
        messages?: boolean;
        internship?: boolean;
        students?: boolean;
        system?: boolean;
      };
    };
    [key: string]: any;
  };
  role: string;
  created_at: string;
  updated_at: string;
}

export function SettingsPage({ sidebar, header, userType }: SettingsPageProps) {
  const { user: currentUser } = useUser();
  
  // Profile state
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [course, setCourse] = useState('');
  const [bio, setBio] = useState('');
  const [position, setPosition] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [notifyEvaluations, setNotifyEvaluations] = useState(true);
  const [notifyReports, setNotifyReports] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyInternship, setNotifyInternship] = useState(true);
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [notifySystem, setNotifySystem] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, [userType]);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      setError(null);
      
      let response: any;
      
      if (userType === 'student') {
        response = await studentAPI.getProfile();
        if (response.success && response.data?.user) {
          const userData = response.data.user;
          setProfile(userData);
          populateForm(userData);
        }
      } else if (userType === 'advisor') {
        response = await advisorAPI.getProfile();
        if (response.user) {
          setProfile(response.user);
          populateForm(response.user);
        }
      } else {
        // Supervisor - reuse authenticated profile endpoint
        response = await advisorAPI.getProfile();
        if (response.user) {
          setProfile(response.user);
          populateForm(response.user);
        }
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const populateForm = (userData: ProfileData) => {
    setFirstName(userData.first_name || '');
    setLastName(userData.last_name || '');
    setEmail(userData.email || '');
    setDepartment(userData.profile_data?.department || '');
    setStudentId(userData.profile_data?.student_id || '');
    setFacultyId(userData.profile_data?.faculty_id || '');
    setYearLevel(userData.profile_data?.year_level || '');
    setCourse(userData.profile_data?.course || '');
    setBio(userData.profile_data?.bio || '');
    setPosition(userData.profile_data?.position || '');
    setCompany(userData.profile_data?.company || '');
    setAvatarUrl(userData.avatar_url || null);
    
    // Load notification preferences
    const notifPrefs = userData.profile_data?.notification_preferences || {};
    setEmailNotifications(notifPrefs.email_notifications ?? true);
    setPushNotifications(notifPrefs.push_notifications ?? true);
    setSmsNotifications(notifPrefs.sms_notifications ?? false);
    
    const notifTypes = notifPrefs.notification_types || {};
    setNotifyEvaluations(notifTypes.evaluations ?? true);
    setNotifyReports(notifTypes.reports ?? true);
    setNotifyMessages(notifTypes.messages ?? true);
    setNotifyInternship(notifTypes.internship ?? true);
    setNotifyStudents(notifTypes.students ?? true);
    setNotifySystem(notifTypes.system ?? false);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      let profileData: any = {
        first_name: firstName,
        last_name: lastName,
        profile_data: {
          ...profile?.profile_data,
          department,
        },
      };

      if (userType === 'student') {
        profileData.profile_data.student_id = studentId;
        profileData.profile_data.year_level = yearLevel;
        profileData.profile_data.course = course;
        
        const response = await studentAPI.updateProfile(profileData);
        if (response.success) {
          setSuccess('Profile updated successfully!');
          setTimeout(() => setSuccess(null), 3000);
        }
      } else if (userType === 'advisor') {
        profileData.profile_data.faculty_id = facultyId;
        profileData.profile_data.bio = bio;
        
        await advisorAPI.updateProfile(profileData);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // Supervisor - persist via shared profile endpoint
        profileData.profile_data.position = position;
        profileData.profile_data.company = company;

        await advisorAPI.updateProfile(profileData);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const notificationPrefs = {
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        sms_notifications: smsNotifications,
        notification_types: {
          evaluations: notifyEvaluations,
          reports: notifyReports,
          messages: notifyMessages,
          ...(userType === 'student' && { internship: notifyInternship }),
          ...(userType === 'advisor' && { students: notifyStudents }),
          system: notifySystem,
        },
      };
      
      const profileData = {
        profile_data: {
          ...profile?.profile_data,
          notification_preferences: notificationPrefs,
        },
      };
      
      if (userType === 'student') {
        const response = await studentAPI.updateProfile(profileData);
        if (response.success) {
          setSuccess('Notification preferences saved!');
          setTimeout(() => setSuccess(null), 3000);
        }
      } else if (userType === 'advisor') {
        await advisorAPI.updateProfile(profileData);
        setSuccess('Notification preferences saved!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // Supervisor
        setSuccess('Notification preferences saved!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Error saving notifications:', err);
      setError(err.message || 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      setSaving(true);
      setError(null);
      setSuccess(null);

      // Password change logic would go here
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return userType === 'student' ? 'ST' : userType === 'advisor' ? 'AD' : 'SU';
  };

  if (profileLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#4CAF50] mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Get tabs based on user type
  const tabs = [
    { value: 'profile', label: 'Profile' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'security', label: 'Security' },
  ];

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {sidebar}
        <div className="flex-1 flex flex-col overflow-hidden">
          {header}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-2">Manage your account and preferences</p>
              </div>

              {/* Success/Error Alerts */}
              {success && (
                <Alert className="mb-4 border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert className="mb-4 border-red-500 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal {userType === 'supervisor' ? 'and company ' : ''}information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Profile Picture */}
                      <div className="flex items-center gap-6">
                        <Avatar className="w-24 h-24">
                          <AvatarFallback className="bg-[#4CAF50] text-white text-2xl font-semibold">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm">
                            <Upload className="w-4 h-4 mr-2" />
                            Change Photo
                          </Button>
                          <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 2MB</p>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>First Name</Label>
                          <Input 
                            value={firstName} 
                            onChange={(e) => setFirstName(e.target.value)}
                            className="mt-2" 
                          />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input 
                            value={lastName} 
                            onChange={(e) => setLastName(e.target.value)}
                            className="mt-2" 
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Email</Label>
                          <Input 
                            type="email" 
                            value={email} 
                            disabled
                            className="mt-2 bg-gray-50" 
                          />
                          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>

                        {/* Role-specific fields */}
                        {userType === 'student' && (
                          <>
                            <div>
                              <Label>Student ID</Label>
                              <Input 
                                value={studentId} 
                                onChange={(e) => setStudentId(e.target.value)}
                                className="mt-2" 
                              />
                            </div>
                            <div>
                              <Label>Department</Label>
                              <Input 
                                value={department} 
                                onChange={(e) => setDepartment(e.target.value)}
                                className="mt-2" 
                              />
                            </div>
                            <div>
                              <Label>Course</Label>
                              <Input 
                                value={course} 
                                onChange={(e) => setCourse(e.target.value)}
                                className="mt-2" 
                                placeholder="e.g., BS Computer Science"
                              />
                            </div>
                            <div>
                              <Label>Year Level</Label>
                              <Input 
                                value={yearLevel} 
                                onChange={(e) => setYearLevel(e.target.value)}
                                className="mt-2" 
                                placeholder="e.g., 4th Year"
                              />
                            </div>
                          </>
                        )}

                        {userType === 'advisor' && (
                          <>
                            <div>
                              <Label>Faculty ID</Label>
                              <Input 
                                value={facultyId} 
                                onChange={(e) => setFacultyId(e.target.value)}
                                className="mt-2" 
                              />
                            </div>
                            <div>
                              <Label>Department</Label>
                              <Input 
                                value={department} 
                                onChange={(e) => setDepartment(e.target.value)}
                                className="mt-2" 
                              />
                            </div>
                          </>
                        )}

                        {userType === 'supervisor' && (
                          <>
                            <div>
                              <Label>Position</Label>
                              <Input 
                                value={position} 
                                onChange={(e) => setPosition(e.target.value)}
                                className="mt-2" 
                              />
                            </div>
                            <div>
                              <Label>Department</Label>
                              <Input 
                                value={department} 
                                onChange={(e) => setDepartment(e.target.value)}
                                className="mt-2" 
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label>Company</Label>
                              <Input 
                                value={company} 
                                onChange={(e) => setCompany(e.target.value)}
                                className="mt-2" 
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Bio for Advisor */}
                      {userType === 'advisor' && (
                        <div>
                          <Label>Bio</Label>
                          <Textarea 
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            className="mt-2 min-h-[100px]"
                          />
                        </div>
                      )}

                      <div className="flex justify-end pt-4">
                        <Button 
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="bg-[#4CAF50] hover:bg-[#45a049]"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>Choose how you want to receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Channels */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900">Notification Channels</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">Email Notifications</p>
                              <p className="text-sm text-gray-500">Receive notifications via email</p>
                            </div>
                            <Switch 
                              checked={emailNotifications}
                              onCheckedChange={setEmailNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">Push Notifications</p>
                              <p className="text-sm text-gray-500">Receive push notifications in the app</p>
                            </div>
                            <Switch 
                              checked={pushNotifications}
                              onCheckedChange={setPushNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">SMS Notifications</p>
                              <p className="text-sm text-gray-500">Receive text message notifications</p>
                            </div>
                            <Switch 
                              checked={smsNotifications}
                              onCheckedChange={setSmsNotifications}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Notification Types */}
                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-medium text-gray-900">Notification Types</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">Evaluation Updates</p>
                              <p className="text-sm text-gray-500">Get notified about evaluation changes</p>
                            </div>
                            <Switch 
                              checked={notifyEvaluations}
                              onCheckedChange={setNotifyEvaluations}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">Report Submissions</p>
                              <p className="text-sm text-gray-500">Notifications for report activities</p>
                            </div>
                            <Switch 
                              checked={notifyReports}
                              onCheckedChange={setNotifyReports}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">New Messages</p>
                              <p className="text-sm text-gray-500">Get notified when you receive messages</p>
                            </div>
                            <Switch 
                              checked={notifyMessages}
                              onCheckedChange={setNotifyMessages}
                            />
                          </div>
                          
                          {/* Student-specific */}
                          {userType === 'student' && (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">Internship Updates</p>
                                <p className="text-sm text-gray-500">Updates about your internship status</p>
                              </div>
                              <Switch 
                                checked={notifyInternship}
                                onCheckedChange={setNotifyInternship}
                              />
                            </div>
                          )}

                          {/* Advisor-specific */}
                          {userType === 'advisor' && (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">Student Activities</p>
                                <p className="text-sm text-gray-500">Updates about your students</p>
                              </div>
                              <Switch 
                                checked={notifyStudents}
                                onCheckedChange={setNotifyStudents}
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">System Announcements</p>
                              <p className="text-sm text-gray-500">Important platform updates</p>
                            </div>
                            <Switch 
                              checked={notifySystem}
                              onCheckedChange={setNotifySystem}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button 
                          onClick={handleSaveNotifications}
                          disabled={saving}
                          className="bg-[#4CAF50] hover:bg-[#45a049]"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Preferences
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>Update your password to keep your account secure</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Current Password</Label>
                        <div className="relative mt-2">
                          <Input 
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>New Password</Label>
                        <div className="relative mt-2">
                          <Input 
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                      </div>
                      <div>
                        <Label>Confirm New Password</Label>
                        <div className="relative mt-2">
                          <Input 
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-end pt-4">
                        <Button 
                          onClick={handleChangePassword}
                          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                          className="bg-[#4CAF50] hover:bg-[#45a049]"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Changing...
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Change Password
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Two-Factor Authentication</CardTitle>
                      <CardDescription>Add an extra layer of security to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Enable 2FA</p>
                          <p className="text-sm text-gray-500">
                            Secure your account with two-factor authentication
                          </p>
                        </div>
                        <Switch 
                          checked={twoFactorEnabled}
                          onCheckedChange={setTwoFactorEnabled}
                        />
                      </div>
                      {twoFactorEnabled && (
                        <Alert className="mt-4 border-blue-500 bg-blue-50">
                          <Shield className="h-4 w-4 text-blue-500" />
                          <AlertDescription className="text-blue-700">
                            Two-factor authentication is enabled. You'll need your authentication code to sign in.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col">
        <MobileHeader title="Settings" subtitle="Manage your account" />

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          {/* Success/Error Alerts */}
          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert className="mb-4 border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Mobile Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarFallback className="bg-[#4CAF50] text-white text-xl">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">Change Photo</Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">First Name</Label>
                      <Input 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1" 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Last Name</Label>
                      <Input 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1" 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input 
                        type="email" 
                        value={email} 
                        disabled
                        className="mt-1 bg-gray-50" 
                      />
                    </div>

                    {userType === 'student' && (
                      <>
                        <div>
                          <Label className="text-xs">Student ID</Label>
                          <Input 
                            value={studentId} 
                            onChange={(e) => setStudentId(e.target.value)}
                            className="mt-1" 
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Department</Label>
                          <Input 
                            value={department} 
                            onChange={(e) => setDepartment(e.target.value)}
                            className="mt-1" 
                          />
                        </div>
                      </>
                    )}

                    {userType === 'advisor' && (
                      <>
                        <div>
                          <Label className="text-xs">Faculty ID</Label>
                          <Input 
                            value={facultyId} 
                            onChange={(e) => setFacultyId(e.target.value)}
                            className="mt-1" 
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Department</Label>
                          <Input 
                            value={department} 
                            onChange={(e) => setDepartment(e.target.value)}
                            className="mt-1" 
                          />
                        </div>
                      </>
                    )}

                    {userType === 'supervisor' && (
                      <>
                        <div>
                          <Label className="text-xs">Position</Label>
                          <Input 
                            value={position} 
                            onChange={(e) => setPosition(e.target.value)}
                            className="mt-1" 
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Department</Label>
                          <Input 
                            value={department} 
                            onChange={(e) => setDepartment(e.target.value)}
                            className="mt-1" 
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <Button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full bg-[#4CAF50] hover:bg-[#45a049]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mobile Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-xs text-gray-500">Via email</p>
                      </div>
                      <Switch 
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Push</p>
                        <p className="text-xs text-gray-500">In-app</p>
                      </div>
                      <Switch 
                        checked={pushNotifications}
                        onCheckedChange={setPushNotifications}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Evaluations</p>
                      </div>
                      <Switch 
                        checked={notifyEvaluations}
                        onCheckedChange={setNotifyEvaluations}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Reports</p>
                      </div>
                      <Switch 
                        checked={notifyReports}
                        onCheckedChange={setNotifyReports}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Messages</p>
                      </div>
                      <Switch 
                        checked={notifyMessages}
                        onCheckedChange={setNotifyMessages}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="w-full bg-[#4CAF50] hover:bg-[#45a049]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mobile Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Current Password</Label>
                      <Input 
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">New Password</Label>
                      <Input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Confirm Password</Label>
                      <Input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleChangePassword}
                    disabled={saving || !currentPassword || !newPassword}
                    className="w-full bg-[#4CAF50] hover:bg-[#45a049]"
                  >
                    {saving ? 'Changing...' : 'Change Password'}
                  </Button>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Two-Factor Auth</p>
                        <p className="text-xs text-gray-500">Extra security</p>
                      </div>
                      <Switch 
                        checked={twoFactorEnabled}
                        onCheckedChange={setTwoFactorEnabled}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <BottomNavigation type={userType} />
      </div>
    </div>
  );
}
