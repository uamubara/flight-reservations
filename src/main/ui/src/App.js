import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Scrollreveal from "scrollreveal";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Recommended from "./components/Recommended";
import Reviews from "./components/Reviews";
import Booking from "./components/Booking";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

// Landing page content
function Landing() {
    useEffect(() => {
        const sr = Scrollreveal({
            origin: "top",
            distance: "80px",
            duration: 2000,
            reset: true,
        });
        sr.reveal(
            `
      nav,
      #hero,
      #services,
      #recommended,
      #reviews,
      footer
    `,
            { opacity: 0, interval: 300 }
        );
    }, []);

    return (
        <>
            <ScrollToTop />
            <Navbar />
            <Hero />
            <Services />
            <Recommended />
            <Reviews />
            <Footer />
        </>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/booking" element={<Booking />} />
            {/* 404: */}
            {/* <Route path="*" element={<Landing />} /> */}
        </Routes>
    );
}
