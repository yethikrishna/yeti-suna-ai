'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronsUpDown,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar, 
} from '@/components/ui/sidebar';
import { useTheme } from 'next-themes';

export function NavUserWithTeams() {
  const { isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Menu</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'top'}
            align="start"
            sideOffset={4}
          >
            {/* User Settings Section */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="gap-2">
                  <Settings className="size-4 shrink-0" />
                  Impostazioni
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Theme Toggle */}
            <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="gap-2">
              {theme === 'light' ? (
                 <Moon className="size-4 shrink-0" />
               ) : (
                 <Sun className="size-4 shrink-0" />
               )}
              Cambia Tema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
