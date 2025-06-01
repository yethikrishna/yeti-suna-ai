"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  [key: string]: any;
}

const SafeImage = ({ src, alt, priority = false, ...props }: SafeImageProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Update imgSrc when src prop changes
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  return hasError ? (
    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400">
      <Camera size={48} />
    </div>
  ) : (
    <Image 
      {...props}
      src={imgSrc}
      alt={alt}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      onError={() => setHasError(true)}
      onLoadingComplete={() => setIsLoading(false)}
      className={`${props.className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
    />
  );
};

export default SafeImage; 