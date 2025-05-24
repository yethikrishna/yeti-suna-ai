"use client";

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { StaticImageData } from 'next/image';

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src: string | StaticImageData;
  fallbackSrc?: string;
  encodeSrc?: boolean;
  showPlaceholderUntilLoaded?: boolean;
}

export default function SafeImage({ 
  src, 
  alt, 
  fallbackSrc = '/placeholder.jpg', 
  encodeSrc = true,
  showPlaceholderUntilLoaded = false,
  ...props 
}: SafeImageProps) {
  // Função para garantir que a URL da imagem seja codificada corretamente
  const getSafeImageSrc = (imageSrc: string | StaticImageData): string | StaticImageData => {
    // Se não for string, retorne o valor original (pode ser um objeto StaticImageData)
    if (typeof imageSrc !== 'string') return imageSrc;
    
    // Se encodeSrc for false, retorne a string original
    if (!encodeSrc) return imageSrc;
    
    try {
      // Verifica se a string já está codificada
      const decoded = decodeURIComponent(imageSrc);
      if (decoded === imageSrc) {
        // Se não estiver codificada, codifique-a (exceto para URLs absolutas)
        return imageSrc.startsWith('http') ? imageSrc : encodeURI(imageSrc);
      }
      return imageSrc; // Já está codificada
    } catch (e) {
      // Em caso de erro, retorne a string original
      console.error('Error encoding image URL:', e);
      return imageSrc;
    }
  };

  // Process the source URL correctly before use
  const initialProcessedSrc = getSafeImageSrc(src);
  const [imgSrc, setImgSrc] = useState(showPlaceholderUntilLoaded ? fallbackSrc : initialProcessedSrc);
  const [hasError, setHasError] = useState(false);
  
  const handleLoad = () => {
    // If we started with a placeholder, switch to the real image after loading
    if (showPlaceholderUntilLoaded && imgSrc === fallbackSrc) {
      setImgSrc(initialProcessedSrc);
    }
  };
  
  const handleError = () => {
    setHasError(true);
    setImgSrc(fallbackSrc);
  };

  return (
    <Image
      src={hasError ? fallbackSrc : imgSrc}
      alt={alt || 'Image'}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
} 