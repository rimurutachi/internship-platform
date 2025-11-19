'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BarChart3, 
  Briefcase, 
  TrendingUp, 
  MessageSquare, 
  FileCheck,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard/student', emoji: '📊' },
  { icon: Briefcase, label: 'Current Internship', path: '/dashboard/student/current-internship', emoji: '📋' },
  { icon: TrendingUp, label: 'Evaluations', path: '/dashboard/student/evaluations', emoji: '📈' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/student/messages', emoji: '💬' },
  { icon: FileCheck, label: 'Documents', path: '/dashboard/student/documents', emoji: '📄' },
  { icon: Settings, label: 'Settings', path: '/dashboard/student/settings', emoji: '⚙️' },
];

export const StudentSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col overflow-y-auto">
      {/* User Profile Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src="/placeholder.svg" alt="Student" />
            <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">Juan Martinez</h3>
            <p className="text-sm text-muted-foreground">Computer Science Major</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <span className="text-base">{item.emoji}</span>
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