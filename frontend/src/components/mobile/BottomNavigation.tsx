'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Home,
  Briefcase,
  FileCheck,
  Settings,
  Users,
  Brain,
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  MessageSquare,
  ClipboardList,
  FileSignature,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogoutConfirmDialog } from '@/components/shared/LogoutConfirmDialog';

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

/* ──────────────────────────────────────────────
   Nav items per role — synced with desktop sidebars
   ────────────────────────────────────────────── */

// Matches StudentSidebar.tsx menu items
const studentNavItems: NavItem[] = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard/student' },
  { icon: Briefcase, label: 'Internship', path: '/dashboard/student/current-internship' },
  { icon: FileText, label: 'Reports', path: '/dashboard/student/daily-reports' },
  { icon: FileCheck, label: 'Documents', path: '/dashboard/student/documents' },
  { icon: ClipboardList, label: 'Require.', path: '/dashboard/student/requirements' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/student/messages' },
  { icon: Settings, label: 'Settings', path: '/dashboard/student/settings' },
];

// Matches SupervisorSidebar.tsx menu items
const supervisorNavItems: NavItem[] = [
  { icon: Users, label: 'Interns', path: '/dashboard/supervisor/interns' },
  { icon: FileText, label: 'Evaluations', path: '/dashboard/supervisor/evaluations' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/supervisor/messages' },
  { icon: Settings, label: 'Settings', path: '/dashboard/supervisor/settings' },
];

// Matches AdvisorSidebar.tsx menu items
const advisorNavItems: NavItem[] = [
  { icon: Users, label: 'Students', path: '/dashboard/advisor/students' },
  { icon: Brain, label: 'Evaluations', path: '/dashboard/advisor/evaluations' },
  { icon: FileCheck, label: 'Documents', path: '/dashboard/advisor/documents' },
  { icon: ClipboardList, label: 'Require.', path: '/dashboard/advisor/requirements' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/advisor/messages' },
  { icon: Settings, label: 'Settings', path: '/dashboard/advisor/settings' },
];

// Matches AdminSidebar.tsx menu items
const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/admin' },
  { icon: Users, label: 'Users', path: '/dashboard/admin/users' },
  { icon: Building2, label: 'Companies', path: '/dashboard/admin/companies' },
  { icon: Briefcase, label: 'Internships', path: '/dashboard/admin/internships' },
  { icon: FileCheck, label: 'Evaluations', path: '/dashboard/admin/evaluations' },
  { icon: ClipboardList, label: 'Rubrics', path: '/dashboard/admin/rubrics' },
  { icon: FileText, label: 'Documents', path: '/dashboard/admin/documents' },
  { icon: FileSignature, label: 'MOA', path: '/dashboard/admin/moa' },
  { icon: BarChart3, label: 'Reports', path: '/dashboard/admin/reports' },
  { icon: Settings, label: 'Settings', path: '/dashboard/admin/settings' },
];

interface BottomNavigationProps {
  type: 'student' | 'supervisor' | 'advisor' | 'admin';
}

export const BottomNavigation = ({ type }: BottomNavigationProps) => {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledEnd, setIsScrolledEnd] = useState(false);

  const navItems =
    type === 'student'
      ? studentNavItems
      : type === 'advisor'
      ? advisorNavItems
      : type === 'admin'
      ? adminNavItems
      : supervisorNavItems;

  // Total items = nav items + logout
  const totalItems = navItems.length + 1;
  // If 6 or fewer items we can fit them equally, otherwise scrollable
  const isScrollable = totalItems > 6;

  /* ── Scroll-fade indicator logic ── */
  const checkScrollEnd = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    setIsScrolledEnd(atEnd);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isScrollable) return;
    checkScrollEnd();
    el.addEventListener('scroll', checkScrollEnd, { passive: true });
    return () => el.removeEventListener('scroll', checkScrollEnd);
  }, [isScrollable, checkScrollEnd]);

  /* ── Active-item auto-scroll into view ── */
  useEffect(() => {
    if (!isScrollable) return;
    const el = scrollRef.current;
    if (!el) return;
    const activeLink = el.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeLink) {
      activeLink.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    }
  }, [pathname, isScrollable]);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div
        ref={scrollRef}
        className={cn(
          'flex h-[4.25rem] sm:h-[4.75rem] overflow-x-auto scrollbar-hide pb-safe'
        )}
      >
        {navItems.map((item) => {
          // For dashboard base paths, only match exact path
          const isBaseDashboard =
            item.path === '/dashboard/student' ||
            item.path === '/dashboard/supervisor' ||
            item.path === '/dashboard/advisor' ||
            item.path === '/dashboard/admin';
          const isActive = isBaseDashboard
            ? pathname === item.path
            : pathname === item.path || pathname?.startsWith(item.path + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              data-active={isActive}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-colors relative',
                'px-2 sm:px-3 flex-1 min-h-[52px]',
                isScrollable && 'min-w-[4.25rem] sm:min-w-[4.75rem]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground active:bg-muted/50'
              )}
              style={!isScrollable ? { minWidth: `${100 / totalItems}%` } : undefined}
            >
              {/* Active pill indicator */}
              {isActive && (
                <span className="absolute top-1 sm:top-1.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary pointer-events-none" />
              )}
              <Icon
                className={cn(
                  'w-[22px] h-[22px] sm:w-6 sm:h-6 flex-shrink-0',
                  isActive && 'fill-primary/10'
                )}
              />
              <span className="text-[10px] sm:text-[11px] font-medium text-center leading-tight line-clamp-1 max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Logout — always last item */}
        <LogoutConfirmDialog
          trigger={
            <button
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-colors',
                'px-2 sm:px-3 flex-1 min-h-[52px]',
                'text-muted-foreground hover:text-destructive active:bg-muted/50',
                isScrollable && 'min-w-[4.25rem] sm:min-w-[4.75rem]'
              )}
              style={!isScrollable ? { minWidth: `${100 / totalItems}%` } : undefined}
              type="button"
            >
              <LogOut className="w-[22px] h-[22px] sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-[11px] font-medium text-center leading-tight">Log out</span>
            </button>
          }
        />
      </div>
    </nav>
  );
};
