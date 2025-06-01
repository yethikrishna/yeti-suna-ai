'use client';

import { SidebarLeft } from '@/components/sidebar/sidebar-left';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { DeleteOperationProvider } from '@/contexts/DeleteOperationContext';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function GTA6Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DeleteOperationProvider>
      <SidebarProvider>
        <SidebarLeft />
        <SidebarInset>
          <div className={`relative min-h-screen transition-colors duration-300 ${
            theme === 'light' 
              ? 'bg-gradient-to-br from-gray-50 to-gray-100' 
              : 'bg-black/90'
          }`}>
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
            <div className={`absolute inset-0 pointer-events-none ${
              theme === 'light'
                ? 'bg-gradient-to-b from-transparent via-transparent to-gray-200/50'
                : 'bg-gradient-to-b from-transparent via-transparent to-black/50'
            }`}></div>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </DeleteOperationProvider>
  );
} 