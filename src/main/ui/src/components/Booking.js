import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import Locate from "./Locate";
import { Badge } from "./FlightSelect";
import Flight from "./Flight";

const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

export default function Booking() {
    const location = useLocation();
    const navigate = useNavigate();

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [filterNonStopOnly, setFilterNonStopOnly] = useState(false);
    const [lastQuery, setLastQuery] = useState(null);

    // Restore search results when coming back from Confirm page
    useEffect(() => {
        if (location.state?.preserveResults && location.state?.searchResults) {
            setResults(location.state.searchResults);
            setLastQuery(location.state.lastQuery);
            // Clear the state so it doesn't re-apply on other navigations
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Navigate to confirm page with all necessary data
    const handleSelectOffer = (rawOffer) => {
        navigate("/confirm", {
            state: {
                offer: rawOffer,
                searchResults: results,
                lastQuery: lastQuery  // Contains passenger counts
            }
        });
    };

    const onSearch = async (payload) => {
        try {
            setError("");
            setLoading(true);
            setResults([]);

            // Store the complete search query including passenger counts
            setLastQuery(payload);

            const qs = new URLSearchParams({
                origin: payload.origin,
                destination: payload.destination,
                departDate: payload.departDate,
                adults: String(payload.adults || 1),
                ...(payload.children > 0 && { children: String(payload.children) }),
                ...(payload.infants > 0 && { infants: String(payload.infants) }),
                ...(payload.returnDate ? { returnDate: payload.returnDate } : {}),
                ...(payload.travelClass ? { travelClass: payload.travelClass } : {}),
                maxResults: "10",
                currencyCode: "USD"
            });

            const r = await fetch(`${BASE}/api/flights?${qs.toString()}`);

            if (!r.ok) {
                if (r.status === 400) {
                    throw new Error("No available flights were found for this route. Please try a different search.");
                }
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
    const connecting = results.filter((f) => f.numberOfStops > 0);
    const visibleConnecting = filterNonStopOnly ? [] : connecting;
    const hasNonStop = nonStop.length > 0;
    const hasConnecting = connecting.length > 0;
    const hasBothTypes = hasNonStop && hasConnecting;

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

                {loading && (
                    <SkeletonSection>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </SkeletonSection>
                )}

                {error && !loading && <StateBox error>{error}</StateBox>}

                {!loading && !error && results.length === 0 && (
                    <StateBox>Try a search to see flights.</StateBox>
                )}

                {!loading && !error && hasNonStop && (
                    <Featured>
                        <div className="title">
                            <h2>Non-stop</h2>
                            <Badge tone="green">Non-stop</Badge>
                        </div>
                        <Flight
                            offers={nonStop}
                            onSelectOffer={handleSelectOffer}
                        />
                    </Featured>
                )}

                {!loading && !error && visibleConnecting.length > 0 && (
                    <Section>
                        <h2>{hasBothTypes ? "More options" : "Available Flights"}</h2>
                        <Flight
                            offers={visibleConnecting}
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

/* ============================================
   STYLED COMPONENTS
   ============================================ */

const Page = styled.div`
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Header = styled.header`
    padding: 3rem 1rem;
    color: white;
    text-align: center;
    
    .wrap {
        max-width: 800px;
        margin: 0 auto;
    }
    
    h1 {
        margin: 0 0 0.5rem;
        font-size: 2.5rem;
    }
    
    p {
        margin: 0;
        opacity: 0.9;
        font-size: 1.1rem;
    }
`;

const Main = styled.main`
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem 3rem;
`;

const Panel = styled.div`
    background: white;
    border-radius: 1rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    margin-bottom: 2rem;
    padding: 2rem;
`;

const Tools = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    color: white;

    .left {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        strong {
            font-size: 1.1rem;
        }

        .muted {
            opacity: 0.7;
        }
    }

    .right {
        label.switch {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;

            input[type="checkbox"] {
                cursor: pointer;
            }
        }
    }
`;

const SkeletonSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const SkeletonCard = styled.div`
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    height: 150px;
    animation: pulse 1.5s ease-in-out infinite;

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`;

const StateBox = styled.div`
    background: ${p => p.error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
    border: 1px solid ${p => p.error ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.2)'};
    color: white;
    padding: 2rem;
    border-radius: 0.75rem;
    text-align: center;
    font-size: 1.1rem;
`;

const Featured = styled.section`
    margin-bottom: 2rem;

    .title {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;

        h2 {
            margin: 0;
            color: white;
            font-size: 1.5rem;
        }
    }
`;

const Section = styled.section`
    h2 {
        margin: 0 0 1rem;
        color: white;
        font-size: 1.5rem;
    }
`;

const Partners = styled.section`
    background: rgba(0, 0, 0, 0.2);
    padding: 2rem 1rem;
    color: white;

    .wrap {
        max-width: 1200px;
        margin: 0 auto;
        text-align: center;
    }

    h3 {
        margin: 0 0 1.5rem;
        font-size: 1.25rem;
    }

    .logos {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 2rem;

        span {
            opacity: 0.7;
            font-weight: 600;
            font-size: 1.1rem;
        }
    }
`;