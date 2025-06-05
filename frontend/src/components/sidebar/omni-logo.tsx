'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function OmniLogo() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return <div className="h-6 w-6" />;
  }

  const isDark = resolvedTheme === 'dark';
  const logoSrc = isDark ? '/OMNI-Ball Light.png' : '/OMNI-Ball-Dark.png';

  return (
    <div className="flex h-6 w-6 items-center justify-center flex-shrink-0">
      <Image
        src={logoSrc}
        alt="OMNI"
        width={24}
        height={24}
        className="object-contain"
      />
    </div>
  );
}
