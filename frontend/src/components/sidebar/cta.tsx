'use client';

import { OmniProcessModal } from '@/components/sidebar/omni-enterprise-modal';
import { useAuth } from '@/components/AuthProvider';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function CTACard() {
  const { user } = useAuth();

  if (!user?.email?.endsWith('@omni.ai')) {
    return null;
  }

  return (
    <div className="border border-border bg-muted/30 rounded-lg p-3 group-data-[collapsible=icon]:hidden">
      <h3 className="text-xs text-muted-foreground mb-2 font-medium">OMNI Team</h3>
      <div className="flex flex-col gap-2">
        <OmniProcessModal />
        <Link
          href="https://www.omni.ai/careers"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground/80 hover:text-muted-foreground transition-colors"
        >
          Careers ↗
        </Link>
      </div>
    </div>
  );
}
