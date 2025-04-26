"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const images = [
  "/banners/264_banner638572418194433613.webp",
  "/banners/307_banner638639742366652260.webp",
  "/banners/332_banner638735697242221175.webp",
  "/banners/336_banner638743652053281779.webp",
  "/banners/340_banner638793754465123340.webp",
];

const BannerSlider = () => {
  return (
    <div className="w-full aspect-[2.2] relative mb-12 group">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        loop
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        className="w-full h-full"
      >
        {images.map((src, index) => (
          <SwiperSlide key={index}>
            <div className="w-full h-full relative">
              <Image
                src={src}
                alt={`Banner ${index + 1}`}
                fill={true}
                className="object-cover"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .swiper-button-next,
        .swiper-button-prev {
          @apply opacity-0 transition-opacity duration-300;
        }
        .group:hover .swiper-button-next,
        .group:hover .swiper-button-prev {
          @apply opacity-100;
        }
        .swiper-button-next,
        .swiper-button-prev {
          @apply w-12 h-12 rounded-full bg-white text-black flex items-center justify-center border border-gray-300;
        }
        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          @apply bg-[#FF6700] text-white border-[#FF6700];
        }
        .swiper-button-next::after,
        .swiper-button-prev::after {
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
};

export default BannerSlider;