'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImageType {
  src: string;
  alt: string;
}

interface ProductGalleryProps {
  images: ImageType[];
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ images }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Se não houver imagens, use um placeholder
  if (images.length === 0) {
    images = [{ src: '', alt: 'Produto sem imagem' }];
  }
  
  const mainImage = images[selectedImageIndex];
  
  return (
    <div className="w-full md:w-1/2 flex flex-col md:flex-row">
      {/* Miniaturas verticais - apenas desktop */}
      {images.length > 1 && (
        <div className="hidden md:flex flex-col justify-center gap-2 mr-4 w-20">
          <div className="flex justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
          
          {images.slice(0, 3).map((image, index) => (
            <div
              key={index}
              className={`relative h-20 w-full rounded-md overflow-hidden cursor-pointer border ${
                selectedImageIndex === index ? 'border-[#FF6700]' : 'hover:border-[#FF6700] border-gray-200'
              }`}
              onClick={() => setSelectedImageIndex(index)}
            >
              {image.src && (
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                />
              )}
            </div>
          ))}
          
          <div className="flex justify-center mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Imagem principal */}
      <div className="flex-1">
        <div className="relative h-[500px] rounded-lg overflow-hidden">
          {mainImage.src ? (
            <Image
              src={mainImage.src}
              alt={mainImage.alt}
              fill
              className="object-contain"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>
        
        {/* Miniaturas horizontais - apenas mobile */}
        {images.length > 1 && (
          <div className="flex md:hidden flex-row gap-2 mt-2 overflow-x-auto">
            {images.slice(0, 3).map((image, index) => (
              <div
                key={index}
                className={`relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden cursor-pointer border ${
                  selectedImageIndex === index ? 'border-[#FF6700]' : 'hover:border-[#FF6700] border-gray-200'
                }`}
                onClick={() => setSelectedImageIndex(index)}
              >
                {image.src && (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Zoom button */}
        <div className="flex items-center mt-4 text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm">Zoom</span>
        </div>
      </div>
    </div>
  );
};

export default ProductGallery;