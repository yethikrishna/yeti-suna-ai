"use client";

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
  encodeSrc?: boolean;
}

const SafeImage = ({
  src,
  alt = "Image",
  fallbackSrc = "/placeholder.jpg",
  encodeSrc = true,
  className = "",
  ...props
}: SafeImageProps) => {
  const [error, setError] = useState(false);
  
  // Process the source URL if needed
  const processedSrc = () => {
    if (error) return fallbackSrc;
    
    if (typeof src === 'string' && encodeSrc) {
      // Encode the URL but keep slashes
      return src.split('/').map(part => encodeURIComponent(part)).join('/');
    }
    
    return src;
  };

  return (
    <Image
      src={processedSrc()}
      alt={alt}
      className={`transition-opacity duration-300 ${className}`}
      onError={() => setError(true)}
      {...props}
    />
  );
};

export default SafeImage; 