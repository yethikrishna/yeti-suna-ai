import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function OmniLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-6 w-6 bg-muted rounded animate-pulse" />
    );
  }

  return (
    <Image
      src="/omni-symbol.svg"
      width={24}
      height={24}
      alt="OMNI"
      className="h-6 w-6"
    />
  );
} 