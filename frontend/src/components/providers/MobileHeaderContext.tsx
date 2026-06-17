'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface MobileHeaderContextType {
  title: string;
  subtitle?: string;
  logo?: ReactNode;
  setMobileHeader: (config: { title: string; subtitle?: string; logo?: ReactNode }) => void;
}

const MobileHeaderContext = createContext<MobileHeaderContextType | undefined>(undefined);

/**
 * Provider for dynamically updating the MobileHeader title/subtitle
 * from within child page components, while keeping the header in the layout shell.
 */
export function MobileHeaderProvider({ 
  children,
  defaultTitle = 'Intern-Galing',
  defaultSubtitle,
  defaultLogo,
}: { 
  children: ReactNode;
  defaultTitle?: string;
  defaultSubtitle?: string;
  defaultLogo?: ReactNode;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);
  const [logo, setLogo] = useState<ReactNode>(defaultLogo);

  const setMobileHeader = useCallback((config: { title: string; subtitle?: string; logo?: ReactNode }) => {
    setTitle(config.title);
    setSubtitle(config.subtitle);
    if (config.logo !== undefined) setLogo(config.logo);
  }, []);

  return (
    <MobileHeaderContext.Provider value={{ title, subtitle, logo, setMobileHeader }}>
      {children}
    </MobileHeaderContext.Provider>
  );
}

/**
 * Hook to read and update the mobile header from any child page.
 * 
 * @example
 * function MyPage() {
 *   const { setMobileHeader } = useMobileHeader();
 *   useEffect(() => {
 *     setMobileHeader({ title: 'My Page', subtitle: 'Details' });
 *   }, []);
 * }
 */
export function useMobileHeader() {
  const context = useContext(MobileHeaderContext);
  if (!context) {
    throw new Error('useMobileHeader must be used within a MobileHeaderProvider');
  }
  return context;
}
