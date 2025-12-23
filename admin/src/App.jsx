import React from 'react'
import Navbar from './components/Navbar/Navbar'
import { Route, Routes } from 'react-router-dom'
import AddCarPage from './components/AddCarPage/AddCarPage'
import ManageCarPage from './components/ManageCarPage/ManageCarPage'
import BookingPage from './components/BookingPage/BookingPage'

const App = () => {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path='/' element={<AddCarPage />} />
        <Route path='/manage-cars' element={<ManageCarPage />} />
        <Route path='/bookings' element={<BookingPage />} />
      </Routes>
    </>
  )
}

export default App