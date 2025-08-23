import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Order() {
    const [offer, setOffer] = useState(null);
    const [placing, setPlacing] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem("selectedOffer");
        if (raw) setOffer(JSON.parse(raw));
    }, []);

    const placeOrder = async () => {
        if (!offer) return;
        setPlacing(true);
        try {
            // Example next steps:
            // 1) POST /api/flights/confirm with the selected offer
            // 2) POST /api/bookings/order with traveler + confirmed offer
            alert("Order placed (wire to API next).");
        } finally {
            setPlacing(false);
        }
    };

    return (
        <>
            <Navbar bookingNav />
            <Wrap>
                <h2>Passenger & Payment</h2>
                <p>Wire this form to your `/api/traveler`, `/api/flights/confirm`, and `/api/bookings/order`.</p>
                <div className="box">
                    <button disabled={!offer || placing} onClick={placeOrder}>
                        {placing ? "Placing…" : "Place Order"}
                    </button>
                </div>
            </Wrap>
            <Footer />
        </>
    );
}

const Wrap = styled.main`
  max-width: 900px; margin: 2rem auto; padding: 0 1rem;
  .box{background:#fff;border:1px solid #e7eef6;border-radius:1rem;padding:1rem;box-shadow:0 12px 28px rgba(2,62,138,.08)}
  button{background:#0b7285;color:#fff;border:none;border-radius:999px;padding:.7rem 1.2rem;font-weight:800;cursor:pointer}
`;
