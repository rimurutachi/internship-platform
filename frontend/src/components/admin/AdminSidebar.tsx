'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  Users, 
  Server, 
  Shield,
  FileText,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/admin', emoji: '📊' },
  { icon: Users, label: 'Users', path: '/dashboard/admin/users', emoji: '👥' },
  { icon: FileText, label: 'Documents', path: '/dashboard/admin/documents', emoji: '📄' },
  { icon: Server, label: 'System', path: '/dashboard/admin/system', emoji: '🖥️' },
  { icon: Shield, label: 'Security', path: '/dashboard/admin/security', emoji: '🔒' },
  { icon: Settings, label: 'Reports', path: '/dashboard/admin/reports', emoji: '📈' },
  { icon: Settings, label: 'Settings', path: '/dashboard/admin/settings', emoji: '⚙️' },
];

export const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col overflow-y-auto">
      {/* User Profile Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src="/placeholder.svg" alt="Admin" />
            <AvatarFallback className="bg-gradient-primary text-white font-bold">AD</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">System Admin</h3>
            <p className="text-sm text-muted-foreground">Administrator</p>
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
