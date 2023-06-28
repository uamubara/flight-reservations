import React, { useEffect } from "react";
import Scrollreveal from "scrollreveal";
import Booking from "./components/Booking";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import Recommended from "./components/Recommended";
import Reviews from "./components/Reviews";
import ScrollToTop from "./components/ScrollToTop";
import Services from "./components/Services";

export default function App() {
    useEffect(() => {
        const sr = Scrollreveal({
            origin: "top",
            distance: "80px",
            duration: 2000,
            reset: true,
        });
        sr.reveal(`
      nav,
      #hero,
      #services,
      #recommended,
      #reviews,
      #Booking
      footer
    `, {
            opacity: 0,
            interval: 300,
        });
    }, []);

    return (
        <div>
            <ScrollToTop />
            <Navbar />
            <Hero />
            <Services />
            <Recommended />
            <Reviews />
            <Booking />
            <Footer />
        </div>
    );
}