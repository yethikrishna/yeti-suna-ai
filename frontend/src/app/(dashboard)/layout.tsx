'use client';

import { useEffect, useState } from 'react';
import { SidebarLeft } from '@/components/sidebar/sidebar-left';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
// import { PricingAlert } from "@/components/billing/pricing-alert"
import { MaintenanceAlert } from '@/components/maintenance-alert';
import { useAccounts } from '@/hooks/use-accounts';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { checkApiHealth } from '@/lib/api';
import { MaintenancePage } from '@/components/maintenance/maintenance-page';
import { DeleteOperationProvider } from '@/contexts/DeleteOperationContext';
import { StatusOverlay } from '@/components/ui/status-overlay';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // const [showPricingAlert, setShowPricingAlert] = useState(false)
  const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);
  const [isApiHealthy, setIsApiHealthy] = useState(true);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const { data: accounts } = useAccounts();
  const personalAccount = accounts?.find((account) => account.personal_account);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // setShowPricingAlert(false)
    setShowMaintenanceAlert(false);
  }, []);

  useEffect(() => {
    setIsApiHealthy(true);
    setIsCheckingHealth(false);
    
    return () => {};
  }, []);

  
  // Show loading state while checking health
  if (isCheckingHealth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Always allow access regardless of authentication status

  // Show maintenance page if API is not healthy
  if (!isApiHealthy) {
    return <MaintenancePage />;
  }

  return (
    <DeleteOperationProvider>
      <SidebarProvider>
        <SidebarLeft />
        <SidebarInset>
          <div className="bg-background">{children}</div>
        </SidebarInset>

        {/* <PricingAlert 
          open={showPricingAlert} 
          onOpenChange={setShowPricingAlert}
          closeable={false}
          accountId={personalAccount?.account_id}
          /> */}

        <MaintenanceAlert
          open={showMaintenanceAlert}
          onOpenChange={setShowMaintenanceAlert}
          closeable={true}
        />

        {/* Status overlay for deletion operations */}
        <StatusOverlay />
      </SidebarProvider>
    </DeleteOperationProvider>
  );
}
