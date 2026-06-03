'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserContext } from '@/components/providers/UserProvider';
import { useSidebar } from '@/components/providers/SidebarContext';
import { 
  BarChart3, 
  Briefcase, 
  FileText, 
  FileCheck,
  ClipboardList,
  MessageSquare,
  Settings,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard/student' },
  { icon: Briefcase, label: 'Current Internship', path: '/dashboard/student/current-internship' },
  { icon: FileText, label: 'Daily Reports', path: '/dashboard/student/daily-reports' },

  { icon: FileCheck, label: 'Documents', path: '/dashboard/student/documents' },
  { icon: ClipboardList, label: 'Requirements', path: '/dashboard/student/requirements' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/student/messages' },
  { icon: Settings, label: 'Settings', path: '/dashboard/student/settings' },
];

export const StudentSidebar = () => {
  const pathname = usePathname();
  const { user, loading } = useUserContext();
  const { isCollapsed, toggle } = useSidebar();

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
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'bg-background border-r border-border h-screen flex flex-col overflow-y-auto flex-shrink-0 transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-[68px]' : 'w-56 lg:w-64'
        )}
      >
        {/* User Profile Section */}
        <div className={cn('bg-background', isCollapsed ? 'p-3' : 'p-4 lg:p-6')}>
          <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'space-x-2 lg:space-x-3')}>
            <Avatar className={cn(
              'border-2 border-primary flex-shrink-0 transition-all duration-300',
              isCollapsed ? 'w-9 h-9' : 'w-10 h-10 lg:w-14 lg:h-14'
            )}>
              <AvatarImage src={user?.profile_data?.avatar_url} alt={getDisplayName()} />
              <AvatarFallback className={cn(
                'bg-primary text-primary-foreground font-bold',
                isCollapsed ? 'text-xs' : 'text-sm lg:text-lg'
              )}>
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-foreground text-sm lg:text-base truncate">{getDisplayName()}</h3>
                <p className="text-[10px] lg:text-xs text-muted-foreground truncate">{user?.profile_data?.education || 'Student'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className={cn('flex-1', isCollapsed ? 'px-1.5 py-3' : 'px-2 lg:px-3 py-3 lg:py-4')}>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              
              const linkContent = (
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center rounded-lg text-sm lg:text-base font-medium transition-all',
                    isCollapsed
                      ? 'justify-center px-2 py-2.5'
                      : 'space-x-2 lg:space-x-3 px-3 lg:px-4 py-2.5 lg:py-3',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );

              return (
                <li key={item.path}>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse Toggle */}
        <div className={cn('border-t border-border', isCollapsed ? 'p-2' : 'p-2 lg:p-3')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className={cn(
              'w-full flex items-center transition-all text-muted-foreground hover:text-foreground',
              isCollapsed ? 'justify-center px-2' : 'justify-start px-3 gap-2'
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronsLeft className="w-4 h-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};