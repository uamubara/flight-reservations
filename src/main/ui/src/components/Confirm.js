import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useHistory } from "react-router-dom";

export default function Confirm() {
    const [offer, setOffer] = useState(null);
    const history = useHistory();

    useEffect(() => {
        // retrieve selection saved by Flight card
        const raw = localStorage.getItem("selectedOffer");
        if (raw) setOffer(JSON.parse(raw));
    }, []);

    const goOrder = () => history.push("/booking/order");

    if (!offer) {
        return (
            <>
                <Navbar bookingNav />
                <Wrap><p>No selection. Go back to <a href="/booking">search</a>.</p></Wrap>
                <Footer />
            </>
        );
    }

    const it = offer?.itineraries?.[0];
    const dep = it?.segments?.[0]?.departure;
    const arr = it?.segments?.slice(-1)[0]?.arrival;

    return (
        <>
            <Navbar bookingNav />
            <Wrap>
                <Card>
                    <h2>Confirm Flight</h2>
                    <div className="row">
                        <strong>{dep?.iataCode}</strong> ➜ <strong>{arr?.iataCode}</strong>
                    </div>
                    <div className="row small">
                        Depart: {new Date(dep?.at).toLocaleString()} &middot; Arrive: {new Date(arr?.at).toLocaleString()}
                    </div>
                    <div className="row total">Total: ${offer?.price?.total}</div>
                    <Actions>
                        <button className="secondary" onClick={() => history.push("/booking")}>Back</button>
                        <button onClick={goOrder}>Continue</button>
                    </Actions>
                </Card>
            </Wrap>
            <Footer />
        </>
    );
}

const Wrap = styled.main`
  max-width: 900px; margin: 2rem auto; padding: 0 1rem;
`;
const Card = styled.section`
  background:#fff;border-radius:1rem;border:1px solid #e7eef6;box-shadow:0 12px 28px rgba(2,62,138,.08);padding:1.2rem;
  h2{margin-top:0}
  .row{margin:.5rem 0;font-size:1.05rem}
  .row.small{opacity:.8}
  .row.total{font-weight:900;color:#0b7285}
`;
const Actions = styled.div`
  display:flex; gap:.5rem; margin-top:1rem;
  button{background:#0b7285;color:#fff;border:none;border-radius:999px;padding:.6rem 1rem;font-weight:700;cursor:pointer}
  .secondary{background:#e7eef6;color:#0b7285}
`;
