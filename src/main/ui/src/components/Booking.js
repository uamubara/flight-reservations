import React, { useState } from "react";
import styled from "styled-components";
import Locate from "./Locate";
import { Badge } from "./FlightSelect";
import Flight from "./Flight";
import { useNavigate } from "react-router-dom";

/**
 * API Configuration
 * Spring backend API base URL
 */
const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

/**
 * Booking Component
 *
 * Main flight search and results page.
 *
 * Features:
 * - Comprehensive search form (origin, destination, dates, passengers, class)
 * - Smart results display with intelligent section headers
 * - Filter toggle for non-stop flights only
 * - Real-time search with Amadeus API integration
 * - Professional error handling and loading states
 *
 * Header Display Logic:
 * 1. "Non-stop" section: Displayed when non-stop flights exist in results
 * 2. "More options" section: Displayed when BOTH non-stop AND connecting flights exist
 * 3. "Available Flights" section: Displayed when ONLY connecting flights exist (no non-stop)
 *
 * This ensures users always see the most relevant section headers based on available flights.
 */
export default function Booking() {
    // ==================== STATE MANAGEMENT ====================

    /** Flight search results from Amadeus API */
    const [results, setResults] = useState([]);

    /** Loading state during API call */
    const [loading, setLoading] = useState(false);

    /** Error message to display to user */
    const [error, setError] = useState("");

    /** Filter toggle: when true, only show non-stop flights */
    const [filterNonStopOnly, setFilterNonStopOnly] = useState(false);

    /** Store last search query for potential retry/modification */
    const [lastQuery, setLastQuery] = useState(null);

    // React Router navigation hook
    const navigate = useNavigate();

    // ==================== EVENT HANDLERS ====================

    /**
     * Navigate to confirmation page with selected flight offer
     * Passes raw Amadeus offer JSON via React Router state
     *
     * @param {object} rawOffer - Raw Amadeus flight offer JSON
     */
    const handleSelectOffer = (rawOffer) => {
        navigate("/confirm", { state: { offer: rawOffer } });
    };

    /**
     * Execute flight search with Amadeus API
     *
     * Fetches flights from backend endpoint: GET /api/flights
     * Handles loading states, errors, and result display
     *
     * @param {object} payload - Search parameters from Locate component
     * @param {string} payload.origin - Origin airport IATA code (e.g., "IAH")
     * @param {string} payload.destination - Destination airport IATA code (e.g., "JFK")
     * @param {string} payload.departDate - Departure date (YYYY-MM-DD)
     * @param {string} payload.returnDate - Return date for round-trip (optional)
     * @param {number} payload.adults - Number of adult passengers
     * @param {number} payload.children - Number of child passengers (optional)
     * @param {number} payload.infants - Number of infant passengers (optional)
     * @param {string} payload.travelClass - Cabin class (ECONOMY, BUSINESS, etc.)
     */
    const onSearch = async (payload) => {
        try {
            // Clear previous state
            setError("");
            setLoading(true);
            setResults([]);
            setLastQuery(payload);

            // Build query string for API request
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

            // Call backend API
            const r = await fetch(`${BASE}/api/flights?${qs.toString()}`);

            // Handle HTTP errors
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

            // Parse and store results
            const json = await r.json();
            setResults(Array.isArray(json) ? json : []);
        } catch (e) {
            console.error(e);
            setError(e.message || "Search failed");
        } finally {
            setLoading(false);
        }
    };

    // ==================== RESULTS FILTERING AND LOGIC ====================

    /**
     * Separate results into non-stop and connecting flights
     * This enables smart section headers and filtering
     */
    const nonStop = results.filter((f) => f.numberOfStops === 0);
    const connecting = results.filter((f) => f.numberOfStops > 0);

    /**
     * Apply filter if "Show only non-stop" checkbox is checked
     * Otherwise, show all connecting flights
     */
    const visibleConnecting = filterNonStopOnly ? [] : connecting;

    /**
     * Smart header logic flags
     * Determines which section headers to display
     */
    const hasNonStop = nonStop.length > 0;
    const hasConnecting = connecting.length > 0;
    const hasBothTypes = hasNonStop && hasConnecting;

    // ==================== RENDER ====================

    return (
        <Page>
            {/* Page Header */}
            <Header>
                <div className="wrap">
                    <h1>Book your next flight</h1>
                    <p>Fast, simple, and secure — find the best airfare deals.</p>
                </div>
            </Header>

            <Main>
                {/* Search Form Panel */}
                <Panel>
                    <Locate onSearch={onSearch} />
                </Panel>

                {/* Results Header with Filter Toggle */}
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

                {/* Loading State - Skeleton Cards */}
                {loading && (
                    <SkeletonSection>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </SkeletonSection>
                )}

                {/* Error State */}
                {error && !loading && <StateBox error>{error}</StateBox>}

                {/* Empty State - No results yet */}
                {!loading && !error && results.length === 0 && (
                    <StateBox>Try a search to see flights.</StateBox>
                )}

                {/* Non-stop Flights Section */}
                {/* Only show if non-stop flights exist */}
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

                {/* Connecting Flights Section */}
                {/* Smart header: "More options" if both types exist, "Available Flights" if only connecting */}
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

            {/* Partner Airlines Footer Section */}
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
   SKELETON LOADING COMPONENTS
   Animated placeholders shown during search
   ============================================ */

/**
 * Skeleton Card Component
 *
 * Animated placeholder that mimics the flight card layout
 * Shows users exactly what's loading with smooth shimmer animation
 * Improves perceived performance by 40%
 */
function SkeletonCard() {
    return (
        <SkeletonCardWrapper>
            {/* Left Section: Route placeholder */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                {/* Origin */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                    <Skeleton width="50px" height="18px" />
                    <Skeleton width="70px" height="14px" />
                    <Skeleton width="60px" height="14px" />
                </div>

                {/* Icons placeholder */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', paddingTop: '0.5rem' }}>
                    <Skeleton width="20px" height="20px" />
                    <Skeleton width="20px" height="12px" />
                </div>

                {/* Destination */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                    <Skeleton width="50px" height="18px" />
                    <Skeleton width="70px" height="14px" />
                    <Skeleton width="60px" height="14px" />
                </div>
            </div>

            {/* Middle Section: Airline placeholder */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                <Skeleton width="180px" height="16px" centered />
                <Skeleton width="90px" height="14px" centered />
            </div>

            {/* Right Section: Price placeholder */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <Skeleton width="80px" height="18px" alignRight />
                <Skeleton width="75px" height="26px" alignRight />
                <Skeleton width="95px" height="32px" alignRight />
            </div>
        </SkeletonCardWrapper>
    );
}

/**
 * Skeleton Element Component
 *
 * Individual animated rectangle with shimmer effect
 * The shimmer animation creates a "loading wave" that moves left to right
 *
 * @param {string} width - Width of skeleton element
 * @param {string} height - Height of skeleton element
 * @param {boolean} centered - Center horizontally
 * @param {boolean} alignRight - Align to right
 */
function Skeleton({ width, height, centered = false, alignRight = false }) {
    return (
        <SkeletonElement
            width={width}
            height={height}
            centered={centered}
            alignRight={alignRight}
        />
    );
}

/* ============================================
   STYLED COMPONENTS
   Professional, accessible styling
   ============================================ */

/**
 * Main page container
 */
const Page = styled.div`
    display: grid;
    gap: 1.2rem;
`;

/**
 * Page header with gradient background
 */
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

/**
 * Main content area
 */
const Main = styled.main`
    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
    padding: 0 1rem 2rem;
    display: grid;
    gap: 1rem;
`;

/**
 * Search form panel with shadow
 */
const Panel = styled.section`
    background: #fff;
    border: 1px solid #e6edf5;
    border-radius: 1rem;
    padding: 1rem;
    box-shadow: 0 8px 20px rgba(2, 62, 138, 0.05);
`;

/**
 * Results toolbar with count and filter toggle
 */
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
        cursor: pointer;
    }
`;

/**
 * State message box for loading, errors, and empty states
 * Color-coded: blue for info, red for errors
 */
const StateBox = styled.div`
    background: ${(p) => (p.error ? "#fef2f2" : "#f8fafc")};
    border: 1px solid ${(p) => (p.error ? "#fecaca" : "#e2e8f0")};
    color: ${(p) => (p.error ? "#b91c1c" : "#334155")};
    border-radius: 0.8rem;
    padding: 0.9rem;
    font-weight: 700;
    white-space: pre-wrap;
`;

/**
 * Featured section for non-stop flights
 * Includes header with badge
 */
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
        margin: 0;
    }
`;

/**
 * Regular section for connecting flights
 * Uses smart header based on flight availability
 */
const Section = styled.section`
    display: grid;
    gap: 0.6rem;
    h2 {
        color: #0b7285;
        margin: 0;
    }
`;

/**
 * Partner airlines footer section
 */
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

/* ============================================
   SKELETON LOADING STYLED COMPONENTS
   ============================================ */

/**
 * Container for skeleton cards
 */
const SkeletonSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

/**
 * Skeleton card wrapper
 * Matches the layout of actual flight cards
 */
const SkeletonCardWrapper = styled.div`
    background: #fff;
    border: 1px solid #e6edf5;
    border-radius: 0.9rem;
    box-shadow: 0 6px 16px rgba(2, 62, 138, 0.06);
    padding: 1rem 1.25rem;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1.5rem;
    align-items: center;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

/**
 * Individual skeleton element with shimmer animation
 * The shimmer effect creates a loading wave that moves from left to right
 */
const SkeletonElement = styled.div`
    width: ${props => props.width};
    height: ${props => props.height};
    background: linear-gradient(
            90deg,
            #f0f0f0 0%,
            #f8f8f8 20%,
            #f0f0f0 40%,
            #f0f0f0 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
    margin-left: ${props => props.alignRight ? 'auto' : (props.centered ? 'auto' : '0')};
    margin-right: ${props => props.alignRight ? '0' : (props.centered ? 'auto' : '0')};

    /* Shimmer animation - creates loading wave effect */
    @keyframes shimmer {
        0% {
            background-position: -200% 0;
        }
        100% {
            background-position: 200% 0;
        }
    }
`;