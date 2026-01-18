import React, { useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import "swiper/css"
import { Autoplay, Pagination } from 'swiper/modules'
import about1 from '../../assets/about1.jpg';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import HeroSleek from './HomeBanner';





function Hero() {
    const [pickUpDate, setPickUpDate] = useState(null);
    const datePickerRef = useRef(null);

    const openCalendar = () => {
        if (datePickerRef.current) {
            datePickerRef.current.setFocus();
        }
    }

    const [returnDate, setReturnDate] = useState(null);
    const returnPickerRef = useRef(null);

    const openreturnCalendar = () => {
        if (returnPickerRef.current) {
            returnPickerRef.current.setFocus();
        }
    }
    return (
        <>
            {/* Hero */}
            <div className="hero w-100% h-screen overflow-hidden">
                <Swiper
                    modules={[Autoplay]}
                    slidesPerView={1}
                    spaceBetween={0}
                    loop={true}
                    autoplay={{
                        delay: 2000,
                    }}
                    speed={1500}
                    className="hero-swiper w-full h-full"
                >
                    <SwiperSlide>
                        <div className="hero-slide hero-slide1 w-full h-full flex
                          items-center px-[12%] mt-3">
                            <div className="hero-content text-white lg:w-[60%]">
                                <span className="font-bricolage text-xs sm:text-sm lg:text-md uppercase
                                 tracking-widest bg-yellow-700 px-2 py-1 rounded-sm">- Simply the Best</span>
                                <h1 className="font-bricolage text-3xl sm:text-5xl md:text-6xl
                                xl:text-7xl xxl:text-8xl font-medium hero-title my-3">
                                    Feel the Speed, Live the Moment
                                </h1>
                                <p className="my-2 text-lg lg:text-2xl font-bricolage hero-subtitle text-gray-300">
                                    You can rent any of our luxurious cars.
                                </p>
                                <p className="my-5 xl:my-7 lg:w-[60%] hero-pere text-gray-300">
                                    AURUMDRIVE makes car rental simple, fast, and affordable. Choose from a wide range
                                    of vehicles to suit your journey.
                                </p>
                                <div className="hero-btns flex flex-wrap gap-4 mt-5 lg:mt-8">
                                    <HeroSleek />
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>

                    <SwiperSlide>
                        <div className="hero-slide hero-slide2 w-full h-full flex
                          items-center px-[12%] mt-3">
                            <div className="hero-content text-white lg:w-[60%]">
                                <span className="font-bricolage text-xs sm:text-sm lg:text-md uppercase
                                 tracking-widest bg-yellow-700 px-2 py-1 rounded-sm">- Simply the Best</span>
                                <h1 className="font-bricolage text-3xl sm:text-5xl md:text-6xl
                                xl:text-7xl xxl:text-8xl font-medium hero-title my-3">
                                    Drive Your Way, Anywhere Anytime.
                                </h1>
                                <p className="my-2 text-lg lg:text-2xl font-bricolage hero-subtitle text-gray-300">
                                    You can rent any of our luxurious cars.
                                </p>
                                <p className="my-5 xl:my-7 lg:w-[60%] hero-pere text-gray-300">
                                    Experience premium car rentals with comfort, style, and affordability.
                                    Perfect for road trips, business travel, or luxury weekend get-aways.
                                </p>
                                <div className="hero-btns flex flex-wrap gap-4 mt-5 lg:mt-8">
                                    <HeroSleek />
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>

                     <SwiperSlide>
                        <div className="hero-slide hero-slide3 w-full h-full flex
                          items-center px-[12%] mt-3">
                            <div className="hero-content text-white lg:w-[60%]">
                                <span className="font-bricolage text-xs sm:text-sm lg:text-md uppercase
                                 tracking-widest bg-yellow-700 px-2 py-1 rounded-sm">- Simply the Best</span>
                                <h1 className="font-bricolage text-3xl sm:text-5xl md:text-6xl
                                xl:text-7xl xxl:text-8xl font-medium hero-title my-3">
                                    Elegance on Wheels, Wherever You Go.
                                </h1>
                                <p className="my-2 text-lg lg:text-2xl font-bricolage hero-subtitle text-gray-300">
                                    You can rent any of our luxurious cars.
                                </p>
                                <p className="my-5 xl:my-7 lg:w-[60%] hero-pere text-gray-300">
                                    Experience premium car rentals with comfort, style, and affordability.
                                    Perfect for road trips, business travel, or luxury weekend get-aways.
                                </p>
                                <div className="hero-btns flex flex-wrap gap-4 mt-5 lg:mt-8">
                                    <HeroSleek />
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                </Swiper>
            </div>

            {/* About */}
            <div className="about text-white lg:px-[10%] px-[8%] py-12.5 lg:py-22.5
            items-center">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <div className="relative w-auto sm:h-112.5 lg:h-150">
                    <img src={about1} alt="" className='rounded-3xl w-full h-full
                    object-contain md:object-cover'/>
                    
                </div>

                <div>
                    <p className="uppercase text-xs md:text-sm tracking-widest
                    text-yellow-700 mb-2">-AURUMDRIVE</p>
                    <h2 className="text-3xl md:text-5xl font-bold mb-3 font-bricolage">
                        We Are More Than <br /><span className="text-yellow-700 font-bricolage">
                            A Car Market Place
                        </span>
                    </h2>
                    <p className="text-gray-400 leading-relaxed my-6 text-sm lg:text-base">
                        Main Car Rentals offers reliable, comfortable, and affordable vehicles tailored for every journey. 
                        Whether you're traveling for business, exploring the city, or heading out on an adventure, 
                        we provide a seamless rental experience with well-maintained cars and exceptional customer service. 
                        Drive with confidence, convenience, and peace of mind — Main Car Rentals has you covered every mile of the way.
                    </p>

                    <div className="space-y-4 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#222] flex
                            items-center justify-center text-yellow-700">
                                <i className="ri-check-double-line"></i>
                            </div>
                            <span className="text-white">Sports and Luxury Cars</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#222] flex
                            items-center justify-center text-yellow-700">
                                <i className="ri-check-double-line"></i>
                            </div>
                            <span className="text-white">Economy Cars</span>
                        </div>
                    </div>

                    <button className="bg-yellow-700 text-white px-8 py-4 rounded-full
                    font-medium flex items-center gap-2 hover:bg-black transition-colors
                    duration-300">
                        Explore More <i className="ri-arrow-right-line"></i>
                    </button>
                </div>
                </div>
            </div>

            {/* Banner */}
            <div className="banner lg:px-[12%] px-[8%] py-12.5 lg:py-22.5">
                <div className="banner-content text-center">
                    <p className="uppercase text-sm tracking-[5px] text-white mb-2">
                        - Rent Now
                    </p>
                    <h2 className="text-4xl md:text-5xl font-bold mb-3 text-white font-bricolage">
                        Book Auto Rental
                    </h2>
                    <div className="bg-[#1f1f1f] text-white w-[90%] max-w-300 mx-auto mt-17.5
                    rounded-3xl px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 shadow-lg z-50">
                        {/* Cars Type */}
                        <div className="relative w-full lg:w-auto px-4 py-3 group border-r border-gray-400">
                            <button className="flex items-center gap-2 w-full justify-between text-gray-400">
                                Choose Car Type <i className="ri-arrow-down-s-line text-yellow-700"></i>
                            </button>
                            <div className="absolute top-[110%] left-0 w-48 bg-[#1f1f1f] border border-orange-600
                            rounded-sm shadow-md opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100
                            group-hover:visible transition-all duration-300 ease-out z-50">
                                <ul className="divide-y divide-gray-700">
                                    <li className="px-4 py-2 hover:bg-yellow-700 transition cursor-pointer">
                                        Choose Car Type
                                    </li>
                                    <li className="px-4 py-2 hover:bg-yellow-700 transition cursor-pointer">
                                        SUVs
                                    </li>
                                    <li className="px-4 py-2 hover:bg-yellow-700 transition cursor-pointer">
                                        Off Road
                                    </li>
                                    <li className="px-4 py-2 hover:bg-yellow-700 transition cursor-pointer">
                                        Family Car
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Pick Location */}
                        <div className="relative w-full lg:w-auto px-4 py-3 group border-r border-gray-400">
                            <button className="flex items-center gap-2 w-full justify-between text-gray-400">
                                Pick Up Location <i className="ri-arrow-down-s-line text-yellow-700"></i>
                            </button>
                            <div className="absolute top-[110%] left-0 w-48 bg-[#1f1f1f] border border-orange-600
                            rounded-sm shadow-md opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100
                            group-hover:visible transition-all duration-300 ease-out z-50">
                                <ul className="divide-y divide-gray-700">
                                    <li className="px-4 py-2 hover:bg-yellow-700 transition cursor-pointer">
                                        Pick Up Location
                                    </li>
                                    <li className="px-4 py-2 hover:bg-yellow-700 transition cursor-pointer">
                                        Westlands
                                    </li>
                                    <li className="px-4 py-2 hover:bg-yellow-700 transition cursor-pointer">
                                        Juja
                                    </li>
                                    <li className="px-4 py-2 hover:bg-yellow-700 transition cursor-pointer">
                                        Karen
                                    </li>
                                    <li className="px-4 py-2 hover:bg-yellow-700 transition cursor-pointer">
                                        Runda
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Pick Date */}
                        <div className="relative w-full lg:w-auto px-4 py-3 flex items-center
                        border-r border-gray-600 cursor-pointer" onClick={openCalendar}>
                            <DatePicker 
                              selected={pickUpDate}
                              onChange={(date) => setPickUpDate(date)}
                              dateFormat="dd MMM yyyy"
                              placeholderText='Pick Up Date'
                              ref={datePickerRef}
                              className={`bg-[#1f1f1f] text-white outline-none cursor-pointer
                                w-full ${!pickUpDate ? 'text-gray-400' : ''}`}
                              calendarClassName='dark-datepicker'
                              popperPlacement='bottom-start'
                            />

                            <i className="ri-calendar-line text-yellow-700 pointer-events-none"></i>
                        </div>

                        {/* Drop Location */}
                        <div className="relative w-full lg:w-auto px-4 py-3 group border-r border-gray-400">
                            <button className="flex items-center gap-2 w-full justify-between text-gray-400">
                                Drop Off Location <i className="ri-arrow-down-s-line text-yellow-700"></i>
                            </button>
                            <div className="absolute top-[110%] left-0 w-48 bg-[#1f1f1f] border border-orange-600
                            rounded-sm shadow-md opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100
                            group-hover:visible transition-all duration-300 ease-out z-50">
                                <ul className="divide-y divide-gray-700">
                                    <li className="px-4 py-2 hover:bg-yellow-700 transition cursor-pointer">
                                        Drop Off Location
                                    </li>
                                    <li className="px-4 py-2 hover:bg-yellow-700 transition cursor-pointer">
                                        Westlands
                                    </li>
                                    <li className="px-4 py-2 hover:bg-yellow-700 transition cursor-pointer">
                                        Juja
                                    </li>
                                    <li className="px-4 py-2 hover:bg-yellow-700 transition cursor-pointer">
                                        Karen
                                    </li>
                                    <li className="px-4 py-2 hover:bg-yellow-700 transition cursor-pointer">
                                        Runda
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Return Date */}
                        <div className="relative w-full lg:w-auto px-4 py-3 flex items-center lg:border-0
                        border-r border-gray-600" onClick={openreturnCalendar}>
                            <DatePicker 
                              selected={returnDate}
                              onChange={(date) => setReturnDate(date)}
                              dateFormat="dd MMM yyyy"
                              placeholderText='Return Date'
                              ref={returnPickerRef}
                              className={`bg-[#1f1f1f] text-white outline-none cursor-pointer
                                w-full ${!returnDate ? 'text-gray-400' : ''}`}
                              calendarClassName='dark-datepicker'
                              popperPlacement='bottom-start'
                            />

                            <i className="ri-calendar-line text-yellow-700 pointer-events-none"></i>
                        </div>
                        
                    </div>
                </div>
            </div>

        </>
    )
}

export default Hero