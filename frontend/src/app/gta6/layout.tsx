'use client';

import { SidebarLeft } from '@/components/sidebar/sidebar-left';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { DeleteOperationProvider } from '@/contexts/DeleteOperationContext';

export default function GTA6Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DeleteOperationProvider>
      <SidebarProvider>
        <SidebarLeft />
        <SidebarInset>
          <div className="relative min-h-screen bg-black/90">
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none"></div>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </DeleteOperationProvider>
  );
} 