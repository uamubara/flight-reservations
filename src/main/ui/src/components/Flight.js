import React from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";

export default function Flight() {
    const navigate = useNavigate();
    const location = useLocation();

    // Expect the selected flight to be passed from FlightSelect:
    // navigate("/flight", { state: { flight: selectedFlight } })
    const { flight } = location.state || {};

    if (!flight) {
        return (
            <Empty>
                <h3>No flight selected</h3>
                <p>Please choose a flight from the search results.</p>
                <button onClick={() => navigate("/booking")}>Back to Booking</button>
            </Empty>
        );
    }

    const onConfirm = () => {
        // Pass the chosen flight onward to the Confirm page
        navigate("/confirm", { state: { flight } });
    };

    // Basic (safe) rendering of a few common fields from Amadeus response
    const firstSeg = flight?.itineraries?.[0]?.segments?.[0];
    const lastSeg =
        flight?.itineraries?.[0]?.segments?.[flight?.itineraries?.[0]?.segments?.length - 1];
    const price = flight?.price?.grandTotal;

    return (
        <Wrap>
            <Header>
                <Back onClick={() => navigate(-1)}>← Back</Back>
                <h2>Flight Details</h2>
            </Header>

            <Card>
                <Row>
                    <Label>From</Label>
                    <Value>{firstSeg?.departure?.iataCode} • {firstSeg?.departure?.at}</Value>
                </Row>
                <Row>
                    <Label>To</Label>
                    <Value>{lastSeg?.arrival?.iataCode} • {lastSeg?.arrival?.at}</Value>
                </Row>
                <Row>
                    <Label>Carrier</Label>
                    <Value>
                        {firstSeg?.carrierCode}
                        {firstSeg?.number ? ` ${firstSeg.number}` : ""}
                    </Value>
                </Row>
                <Row>
                    <Label>Price</Label>
                    <Value>${price}</Value>
                </Row>
            </Card>

            <CTA>
                <button onClick={onConfirm}>Continue to Traveler & Payment</button>
            </CTA>
        </Wrap>
    );
}

/* ——— styles ——— */
const Wrap = styled.div`
  max-width: 900px;
  margin: 1.5rem auto;
  padding: 0 1rem;
`;
const Header = styled.div`
  display: flex; align-items: center; gap: .75rem; margin-bottom: 1rem;
  h2 { margin: 0; }
`;
const Back = styled.button`
  border: 1px solid #e6edf5; background: #fff; border-radius: .6rem;
  padding: .4rem .7rem; cursor: pointer;
`;
const Card = styled.div`
  background: #fff; border: 1px solid #e6edf5; border-radius: 1rem;
  box-shadow: 0 8px 18px rgba(2,62,138,.06);
  padding: 1rem;
`;
const Row = styled.div`
  display: grid; grid-template-columns: 140px 1fr; gap: .75rem;
  padding: .55rem 0; border-bottom: 1px dashed #eef3fa;
  &:last-child { border-bottom: 0; }
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;
const Label = styled.div` color:#0b7285; font-weight: 600; `;
const Value = styled.div``;
const CTA = styled.div`
  margin-top: 1rem; display: flex; justify-content: flex-end;
  button {
    background:#0ea5e9; color:#fff; border:0; border-radius:.7rem;
    padding:.7rem 1rem; cursor:pointer; font-weight:700;
  }
`;
const Empty = styled.div`
    max-width: 720px; margin: 2rem auto; padding: 1rem; text-align:center;
    button {
        margin-top: .75rem; background:#0ea5e9; color:#fff; border:0;
        border-radius:.7rem; padding:.6rem .9rem; cursor:pointer; font-weight:700;
    }
`;
