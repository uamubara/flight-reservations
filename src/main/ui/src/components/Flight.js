import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { Badge } from "./FlightSelect";

const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

// --- Helper functions for formatting and display ---
const formatDuration = (iso) => {
    if (!iso) return "—";
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return iso;

    const hours = match[1] ? `${match[1]}h` : "";
    const minutes = match[2] ? `${match[2]}m` : "";

    return `${hours} ${minutes}`.trim();
};
const timeHHMM = (isoMaybe) => {
    if (!isoMaybe) return "—";
    const d = new Date(isoMaybe);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};
const money = (total, currency = "USD") => {
    const v = Number(total || 0);
    try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(v);
    } catch {
        return `$${v.toFixed(2)}`;
    }
};
const humanizeClass = (v) => {
    switch ((v || "").toUpperCase()) {
        case "ECONOMY": return "Economy";
        case "PREMIUM_ECONOMY": return "Premium Economy";
        case "BUSINESS": return "Business";
        case "FIRST": return "First";
        default: return "cabin n/a";
    }
};
const stopsBadge = (n) => (n === 0 ? { text: "Non-stop", tone: "green" } : n === 1 ? { text: "1 stop", tone: "amber" } : { text: `${n} stops`, tone: "amber" });

// --- Amenity Dictionary for displaying icons and names ---
const AMENITY_MAP = {
    BAGGAGE: { icon: "🧳", name: "Checked bag" },
    CABIN_BAGGAGE: { icon: "🎒", name: "Carry-on bag" },
    SEAT_SELECTION: { icon: "💺", name: "Seat selection" },
    WI_FI: { icon: "📶", name: "Wi-Fi" },
    MEAL: { icon: "🍽️", name: "Meal" },
};

// --- Component to render the expanded flight details ---
const FlightDetails = ({ details, isLoading }) => {
    if (isLoading) {
        return <DetailsWrapper><Spinner /></DetailsWrapper>;
    }
    if (!details) {
        return <DetailsWrapper><p>Could not load flight details.</p></DetailsWrapper>;
    }

    const brandedFare = details.flightOffers?.[0]?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.brandedFare;

    return (
        <DetailsWrapper>
            <h4>Fare Details ({brandedFare?.name || 'Standard'})</h4>
            <AmenityList>
                {brandedFare?.included?.map((amenity, index) => (
                    <AmenityItem key={index} available={amenity.isIncluded}>
                        <span className="icon">{AMENITY_MAP[amenity.amenityType]?.icon || '✅'}</span>
                        <span className="name">{AMENITY_MAP[amenity.amenityType]?.name || amenity.amenityType}</span>
                        <span className="description">{amenity.description}</span>
                    </AmenityItem>
                ))}
                {(!brandedFare?.included || brandedFare.included.length === 0) && <p>Standard amenities included.</p>}
            </AmenityList>
        </DetailsWrapper>
    );
};

// --- OfferCard Component (updated to be expandable) ---
function OfferCard({ offer, onSelect, airportsMap, isExpanded, onToggleDetails, details, isLoadingDetails }) {
    const oCode = offer?.originCode || "—";
    const dCode = offer?.destinationCode || "—";
    const departTime = timeHHMM(offer?.departureTime);
    const arriveTime = timeHHMM(offer?.arrivalTime);
    const oCity = airportsMap[oCode]?.cityName || oCode;
    const dCity = airportsMap[dCode]?.cityName || dCode;
    const airline = offer?.airlineName || offer?.carrierCode || "—";
    const flightId = [offer?.carrierCode, offer?.flightNumber].filter(Boolean).join(" ");
    const duration = formatDuration(offer?.duration);
    const cabin = humanizeClass(offer?.cabin);
    const priceStr = money(offer?.price?.total, offer?.price?.currency);
    const { text: stopsTxt, tone } = stopsBadge(offer?.numberOfStops ?? 0);

    return (
        <CardWrapper>
            <Card onClick={() => onToggleDetails(offer)} role="button" isExpanded={isExpanded}>
                <div className="route">
                    <div className="codes">
                        <span className="code">{oCode}</span>
                        <span className="arrow">→</span>
                        <span className="code">{dCode}</span>
                    </div>
                    <div className="names">
                        <span className="name">{oCity}</span>
                        <span className="sep">—</span>
                        <span className="name">{dCity}</span>
                    </div>
                    <div className="times">
                        <span>{departTime}</span>
                        <span className="sep">—</span>
                        <span>{arriveTime}</span>
                    </div>
                </div>
                <div className="middle">
                    <div className="airline">
                        <strong>{airline}</strong>
                        {flightId && <span className="muted"> • {flightId}</span>}
                    </div>
                    <div className="meta">
                        <span>{duration}</span>
                        <span className="dot">•</span>
                        <span>{cabin}</span>
                    </div>
                </div>
                <div className="right">
                    <div className="price">{priceStr}</div>
                    <div className="stops"><Badge tone={tone}>{stopsTxt}</Badge></div>
                    <button className="cta" onClick={(e) => { e.stopPropagation(); onToggleDetails(offer); }}>
                        {isExpanded ? "Hide details" : "View details"}
                    </button>
                </div>
            </Card>
            {isExpanded && <FlightDetails details={details} isLoading={isLoadingDetails} />}
        </CardWrapper>
    );
}

// --- Main Flight Component ---
export default function Flight({ offers = [], onSelectOffer }) {
    const [expandedId, setExpandedId] = useState(null);
    const [detailsCache, setDetailsCache] = useState({});
    const [airportsMap, setAirportsMap] = useState({});

    const codes = useMemo(() => {
        const set = new Set();
        for (const o of offers) {
            if (o?.originCode) set.add(o.originCode);
            if (o?.destinationCode) set.add(o.destinationCode);
        }
        return Array.from(set).filter(Boolean);
    }, [offers]);

    useEffect(() => {
        let abort = false;
        async function go() {
            if (!codes.length) { setAirportsMap({}); return; }
            try {
                const r = await fetch(`${BASE}/api/airports?codes=${encodeURIComponent(codes.join(","))}`);
                if (!r.ok) throw new Error(await r.text());
                const json = await r.json();
                if (!abort) setAirportsMap(json || {});
            } catch (e) {
                if (!abort) setAirportsMap({});
                console.error(e);
            }
        }
        go();
        return () => { abort = true; };
    }, [codes]);

    const handleToggleDetails = async (offer) => {
        const offerId = offer.id;
        if (expandedId === offerId) {
            setExpandedId(null);
            return;
        }

        setExpandedId(offerId);

        if (detailsCache[offerId]) return;

        try {
            setDetailsCache(prev => ({ ...prev, [offerId]: { loading: true, data: null } }));

            const response = await fetch(`${BASE}/api/flights/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(offer.rawOffer),
            });
            if (!response.ok) throw new Error('Failed to fetch details');

            const data = await response.json();

            setDetailsCache(prev => ({ ...prev, [offerId]: { loading: false, data: data } }));
        } catch (error) {
            console.error("Error fetching flight details:", error);
            setDetailsCache(prev => ({ ...prev, [offerId]: { loading: false, data: null } }));
        }
    };

    return (
        <List>
            {offers.map((offer) => (
                <OfferCard
                    key={offer.id}
                    offer={offer}
                    airportsMap={airportsMap}
                    onSelect={onSelectOffer}
                    isExpanded={expandedId === offer.id}
                    onToggleDetails={handleToggleDetails}
                    details={detailsCache[offer.id]?.data}
                    isLoadingDetails={detailsCache[offer.id]?.loading}
                />
            ))}
            {offers.length === 0 && <Empty>No flights to show.</Empty>}
        </List>
    );
}

/* --- Styles --- */
const slideDown = keyframes`
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;
const List = styled.div`display:grid; gap:.75rem;`;
const Empty = styled.div`
    padding:1rem; border-radius:.75rem; background:#f8fafc;
    border:1px solid #e2e8f0; color:#475569; font-weight:600;
`;

const CardWrapper = styled.div`
    background:#fff;
    border:1px solid #e6edf5;
    border-radius:.9rem;
    box-shadow:0 6px 16px rgba(2,62,138,.06);
    transition: all 0.2s ease-in-out;
    &:hover {
        box-shadow: 0 8px 24px rgba(2, 62, 138, 0.1);
    }
`;
const Card = styled.div`
    display:grid; grid-template-columns:1fr 1.2fr auto; gap:1rem; align-items:center;
    padding:1rem;
    cursor:pointer;

    .route .codes{ font-weight:900; letter-spacing:.6px; font-size:1.05rem; }
    .route .arrow{ margin:0 6px; color:#64748b; }
    .route .names,.route .times{
        color:#64748b; margin-top:4px; font-weight:600; display:flex; gap:6px; flex-wrap:wrap;
    }
    .route .sep{ color:#94a3b8; }
    .middle .airline{ font-size:1.05rem; }
    .middle .muted{ color:#475569; font-weight:500; }
    .middle .meta{ margin-top:4px; color:#64748b; display: flex; align-items: center; flex-wrap: wrap; }
    .middle .dot{ margin:0 6px; color:#cbd5e1; }
    .right{ display:grid; justify-items:end; gap:.4rem; }
    .right .price{ font-weight:900; font-size:1.05rem; }
    .right .stops{ margin-top:2px; }
    .cta{ margin-top:6px; border:none; background:#1d4ed8; color:#fff; padding:.4rem .8rem; border-radius:.5rem; font-weight:700; }
    @media (max-width:720px){ grid-template-columns:1fr; justify-items:start; .right{ justify-items:start; } }
`;

const DetailsWrapper = styled.div`
    padding: 1rem;
    padding-top: 0;
    animation: ${slideDown} 0.3s ease-out;
    h4 {
        margin: 0 0 1rem;
        color: #0b7285;
        padding-top: 1rem;
        border-top: 1px solid #f1f5f9;
    }
`;
const AmenityList = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: .8rem;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
`;
const AmenityItem = styled.li`
    display: flex;
    align-items: center;
    gap: .5rem;
    opacity: ${p => p.available ? '1' : '0.5'};
    .icon { font-size: 1.2rem; }
    .name { font-weight: 600; }
    .description { color: #64748b; font-size: 0.9rem; }
`;
const Spinner = styled.div`
    border: 4px solid #f3f3f3;
    border-top: 4px solid #0ea5e9;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
    margin: 1rem auto;
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;