import React from 'react'
import Navbar from '../components/Navbar/Navbar'
import HomeCars from '../components/HomeCars/HomeCars'
import HeroSleek from '../components/HomeBanner/HomeBanner'
import Hero from '../components/HomeBanner/HeroBanner'
import Navigation from '../components/Navbar/Navigation'
import Testimonial from '../components/Testimonial/Testimonial'
import Footer from '../components/Footer/Footer'

const Home = () => {
  return (
    <div>
        <Navbar />
        <Hero />
        <HomeCars />
        <Testimonial />
        <Footer />
    </div>
  )
}

export default Home