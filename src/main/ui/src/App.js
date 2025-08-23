import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom"; // v6 API
import Scrollreveal from "scrollreveal";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Recommended from "./components/Recommended";
import Reviews from "./components/Reviews";
import Booking from "./components/Booking";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

// landing page content
function Landing() {
    useEffect(() => {
        // Basic scroll reveal for the landing sections
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
            {/* ScrollToTop uses useLocation internally. */}
            <ScrollToTop />

            {/* Your existing landing layout */}
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
        // Routes for the app.
        <Routes>
            {/* Landing page */}
            <Route path="/" element={<Landing />} />

            {/* Booking page */}
            <Route path="/booking" element={<Booking />} />

            {/* Optional: fallback to home for any unknown route */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

