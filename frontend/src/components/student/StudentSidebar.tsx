'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserContext } from '@/components/providers/UserProvider';
import { 
  BarChart3, 
  Briefcase, 
  FileText, 
  MessageSquare, 
  FileCheck,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard/student' },
  { icon: Briefcase, label: 'Current Internship', path: '/dashboard/student/current-internship' },
  { icon: FileText, label: 'Weekly Reports', path: '/dashboard/student/weekly-reports' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/student/messages' },
  { icon: FileCheck, label: 'Documents', path: '/dashboard/student/documents' },
  { icon: Settings, label: 'Settings', path: '/dashboard/student/settings' },
];

export const StudentSidebar = () => {
  const pathname = usePathname();
  const { user, loading } = useUserContext();

  const getInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.first_name?.charAt(0) || '';
    const lastInitial = user.last_name?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (loading) return 'Loading...';
    if (!user) return 'Student';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Student';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col overflow-y-auto">
      {/* User Profile Section */}
      <div className="p-6 bg-white">
        <div className="flex items-center space-x-3">
          <Avatar className="w-14 h-14 border-2 border-[#4CAF50]">
            <AvatarImage src={user?.profile_data?.avatar_url} alt={getDisplayName()} />
            <AvatarFallback className="bg-[#4CAF50] text-white font-bold text-lg">{getInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-gray-900 text-base">{getDisplayName()}</h3>
            <p className="text-xs text-gray-600">{user?.profile_data?.education || 'Student'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all',
                    isActive
                      ? 'bg-[#4CAF50] text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};