'use client';

import { AnimateIn } from '@/components/ui/AnimateIn';

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <AnimateIn animation="fadeInUp" className="w-full h-full flex flex-col min-h-0">
      {children}
    </AnimateIn>
  );
}
