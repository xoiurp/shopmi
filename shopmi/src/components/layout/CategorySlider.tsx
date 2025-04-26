"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Link from "next/link";
import Image from "next/image";

interface Category {
  id: string;
  title: string;
  handle: string;
  image?: {
    originalSrc: string;
  };
}

interface Props {
  categories: Category[];
}

const CategorySlider = ({ categories }: Props) => {
  return (
    <section className="category-slider py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-center">Revolucione sua vida com tecnologia Xiaomi</h2>
        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            slidesPerView={1}
            spaceBetween={20}
            navigation={{
              nextEl: '.swiper-button-next-custom',
              prevEl: '.swiper-button-prev-custom',
            }}
            loop
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
            }}
            className="w-full"
          >
            {categories.map((category) => (
              <SwiperSlide key={category.id}>
                <Link href={`/shop/${category.handle}`} className="block">
                  <div className="relative" style={{ width: '360px' }}>
                    <div className="rounded-lg overflow-hidden">
                      {category.image ? (
                        <Image
                          src={category.image.originalSrc}
                          alt={category.title}
                          width={360}
                          height={480}
                          className="w-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-[480px] bg-gray-200 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-16 w-16 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 border border-white hover:border-transparent bg-transparent px-4 py-2 rounded-full text-center transition-colors duration-300 hover:bg-[#FF6700]">
                      <h3 className="text-white text-xl font-bold uppercase">{category.title}</h3>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="swiper-button-prev-custom absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#FF6700] text-white flex items-center justify-center cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </div>
          <div className="swiper-button-next-custom absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#FF6700] text-white flex items-center justify-center cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategorySlider;