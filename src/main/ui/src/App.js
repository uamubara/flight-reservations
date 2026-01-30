import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Scrollreveal from "scrollreveal";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Recommended from "./components/Recommended";
import Reviews from "./components/Reviews";
import Booking from "./components/Booking";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Confirm from "./components/Confirm";
import Order from "./components/Order";
import SeatSelection from "./components/SeatSelection";
import Addons from "./components/Addons";
import Payment from "./components/Payment";
import Confirmation from "./components/Confirmation";

function Landing() {
    useEffect(() => {
        const sr = Scrollreveal({
            origin: "top", distance: "80px", duration: 2000, reset: true,
        });
        sr.reveal(`nav, #hero, #services, #recommended, #reviews, footer`, { opacity: 0, interval: 300 });
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

function PageWrapper({ children }) {
    return (
        <>
            <ScrollToTop />
            <Navbar />
            <main style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>{children}</main>
            <Footer />
        </>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/confirm" element={<PageWrapper><Confirm /></PageWrapper>} />
            <Route path="/order" element={<PageWrapper><Order /></PageWrapper>} />
            <Route path="/seats" element={<SeatSelection />} />
            <Route path="/addons" element={<Addons />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}