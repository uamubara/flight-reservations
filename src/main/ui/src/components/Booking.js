import React, { useState } from "react";
import styled from "styled-components";
import Locate from "./Locate";
import { Badge } from "./FlightSelect";
import Flight from "./Flight";
import { useNavigate } from "react-router-dom";

// Spring backend
const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

export default function Booking() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [filterNonStopOnly, setFilterNonStopOnly] = useState(false);
    const [lastQuery, setLastQuery] = useState(null);

    const navigate = useNavigate();

    // This function will be used to navigate to the confirmation page
    const handleSelectOffer = (rawOffer) => {
        navigate("/confirm", { state: { offer: rawOffer } });
    };

    const onSearch = async (payload) => {
        try {
            setError("");
            setLoading(true);
            setResults([]);
            setLastQuery(payload);

            const qs = new URLSearchParams({
                origin: payload.origin,
                destination: payload.destination,
                departDate: payload.departDate,
                adults: String(payload.adults || 0),
                ...(payload.children > 0 && { children: String(payload.children) }),
                ...(payload.infants > 0 && { infants: String(payload.infants) }),
                ...(payload.returnDate ? { returnDate: payload.returnDate } : {}),
                ...(payload.travelClass ? { travelClass: payload.travelClass } : {}),
                maxResults: "10",
                currencyCode: "USD"
            });

            const r = await fetch(`${BASE}/api/flights?${qs.toString()}`);
            if (!r.ok) {
                const errText = await r.text();
                try {
                    const errJson = JSON.parse(errText);
                    throw new Error(errJson.details || errJson.error || "Search failed");
                } catch {
                    throw new Error(errText || "Search failed");
                }
            }
            const json = await r.json();
            setResults(Array.isArray(json) ? json : []);
        } catch (e) {
            console.error(e);
            setError(e.message || "Search failed");
        } finally {
            setLoading(false);
        }
    };

    const nonStop = results.filter((f) => f.numberOfStops === 0);
    const others = results.filter((f) => f.numberOfStops > 0);
    const visibleOthers = filterNonStopOnly ? [] : others;

    return (
        <Page>
            <Header>
                <div className="wrap">
                    <h1>Book your next flight</h1>
                    <p>Fast, simple, and secure — find the best airfare deals.</p>
                </div>
            </Header>

            <Main>
                <Panel>
                    <Locate onSearch={onSearch} />
                </Panel>

                <Tools>
                    <div className="left">
                        <strong>Results</strong>
                        {!!results.length && <span className="muted">({results.length})</span>}
                    </div>
                    <div className="right">
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={filterNonStopOnly}
                                onChange={(e) => setFilterNonStopOnly(e.target.checked)}
                            />
                            <span>Show only non-stop</span>
                        </label>
                    </div>
                </Tools>

                {loading && <StateBox>Searching…</StateBox>}
                {error && !loading && <StateBox error>{error}</StateBox>}
                {!loading && !error && results.length === 0 && (
                    <StateBox>Try a search to see flights.</StateBox>
                )}

                {!loading && !error && nonStop.length > 0 && (
                    <Featured>
                        <div className="title">
                            <h2>Non-stop options</h2>
                            <Badge tone="green">Non-stop</Badge>
                        </div>
                        <Flight
                            offers={nonStop}
                            onSelectOffer={handleSelectOffer}
                        />
                    </Featured>
                )}

                {!loading && !error && visibleOthers.length > 0 && (
                    <Section>
                        <h2>More options</h2>
                        <Flight
                            offers={visibleOthers}
                            onSelectOffer={handleSelectOffer}
                        />
                    </Section>
                )}
            </Main>

            <Partners aria-label="Partner airlines">
                <div className="wrap">
                    <h3>Our Airline Partners</h3>
                    <div className="logos">
                        <span>Delta</span>
                        <span>United</span>
                        <span>American</span>
                        <span>Southwest</span>
                        <span>JetBlue</span>
                    </div>
                </div>
            </Partners>
        </Page>
    );
}

/* ---------- styles ---------- */

const Page = styled.div`
    display: grid;
    gap: 1.2rem;
`;

const Header = styled.header`
    background: linear-gradient(135deg, #e0f2fe 0%, #e6fffa 100%);
    .wrap {
        max-width: 1100px;
        margin: 0 auto;
        padding: 2.2rem 1rem;
    }
    h1 {
        margin: 0;
        color: #023e8a;
    }
    p {
        color: #0b7285;
        font-weight: 600;
        margin: 0.3rem 0 0;
    }
`;

const Main = styled.main`
    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
    padding: 0 1rem 2rem;
    display: grid;
    gap: 1rem;
`;

const Panel = styled.section`
    background: #fff;
    border: 1px solid #e6edf5;
    border-radius: 1rem;
    padding: 1rem;
    box-shadow: 0 8px 20px rgba(2, 62, 138, 0.05);
`;

const Tools = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    .muted {
        color: #64748b;
        margin-left: 0.3rem;
    }
    strong {
        color: #0b7285;
    }
    .switch {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 700;
        color: #0b7285;
    }
    input[type="checkbox"] {
        width: 18px;
        height: 18px;
    }
`;

const StateBox = styled.div`
    background: ${(p) => (p.error ? "#fef2f2" : "#f8fafc")};
    border: 1px solid ${(p) => (p.error ? "#fecaca" : "#e2e8f0")};
    color: ${(p) => (p.error ? "#b91c1c" : "#334155")};
    border-radius: 0.8rem;
    padding: 0.9rem;
    font-weight: 700;
    white-space: pre-wrap;
`;

const Featured = styled.section`
    display: grid;
    gap: 0.6rem;
    .title {
        display: flex;
        align-items: center;
        gap: 0.6rem;
    }
    h2 {
        color: #0b7285;
    }
`;

const Section = styled.section`
    display: grid;
    gap: 0.6rem;
    h2 {
        color: #0b7285;
    }
`;

const Partners = styled.section`
    background: #ffffff;
    border-top: 1px solid #e6edf5;
    .wrap {
        max-width: 1100px;
        margin: 0 auto;
        padding: 1.4rem 1rem;
    }
    h3 {
        color: #0b7285;
        margin: 0 0 0.7rem;
    }
    .logos {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 0.8rem;
        @media (max-width: 900px) {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        @media (max-width: 520px) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        span {
            display: grid;
            place-items: center;
            height: 56px;
            border: 1px dashed #d1e9ff;
            border-radius: 0.75rem;
            color: #0b7285;
            font-weight: 800;
            background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
        }
    }
`;