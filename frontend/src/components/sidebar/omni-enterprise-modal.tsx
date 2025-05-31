'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTheme } from 'next-themes';
import Image from 'next/image';

export function OmniProcessModal() {
  const [open, setOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSchedule = () => {
    // Open Cal.com modal
    const cal = (window as any).Cal;
    if (cal) {
      cal('ui', {
        styles: { branding: { brandColor: '#000000' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
      cal('openModal', {
        calLink: 'team/omni/enterprise-demo',
        config: { layout: 'month_view' },
      });
    } else {
      // Fallback to direct link
      window.open('https://cal.com/team/omni/enterprise-demo', '_blank');
    }
    setOpen(false);
  };

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs bg-background/50 hover:bg-background/80"
        disabled
      >
        Loading...
      </Button>
    );
  }

  const logoSrc =
    resolvedTheme === 'dark' ? '/omni-logo-white.svg' : '/omni-logo.svg'

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs bg-background/50 hover:bg-background/80"
          >
            Enterprise Demo
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] p-6">
          <DialogHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <Image
                src={logoSrc}
                alt="OMNI Logo"
                width={140}
                height={28}
                className="h-7 w-auto"
              />
            </div>
            <DialogTitle className="text-2xl font-semibold">
              Transform Your Business with AI Employees
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground leading-relaxed">
              Discover how OMNI Operator can revolutionize your workflows with
              autonomous AI agents that handle complex tasks across your
              organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-primary mt-2.5 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium text-sm">Custom AI Workflows</h4>
                  <p className="text-xs text-muted-foreground">
                    Deploy specialized AI agents tailored to your business
                    processes and requirements.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-primary mt-2.5 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium text-sm">Enterprise Security</h4>
                  <p className="text-xs text-muted-foreground">
                    SOC 2 compliant infrastructure with advanced data protection
                    and privacy controls.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-primary mt-2.5 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium text-sm">24/7 Expert Support</h4>
                  <p className="text-xs text-muted-foreground">
                    Dedicated support team and implementation specialists to
                    ensure success.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Ready to see OMNI Operator in action? Book a personalized demo
                with our team.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleSchedule}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Schedule Demo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 