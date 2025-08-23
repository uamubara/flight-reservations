// src/components/Flight.js
// render a list of offers from Amadeus. show all key fields,
// and call onSelectOffer(offer) when the button or the card is clicked.

import React from "react";
import styled from "styled-components";
import { Badge } from "./FlightSelect";

const AIRLINE_NAMES = {
    AA: "American Airlines",
    UA: "United Airlines",
    DL: "Delta Air Lines",
    WN: "Southwest",
    B6: "JetBlue",
    AS: "Alaska Airlines",
    NK: "Spirit Airlines",
    F9: "Frontier",
    BA: "British Airways",
    AF: "Air France",
    KL: "KLM",
    LH: "Lufthansa",
    EK: "Emirates",
    QR: "Qatar Airways",
    TK: "Turkish Airlines",
    AC: "Air Canada",
    AM: "Aeromexico"
    // add more as needed
};

// turn "PT9H20M" into "9h 20m"
function formatDuration(iso) {
    if (!iso) return "—";
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!m) return "—";
    const h = m[1] ? `${parseInt(m[1], 10)}h` : "";
    const min = m[2] ? ` ${parseInt(m[2], 10)}m` : "";
    return `${h}${min}`.trim() || "—";
}

// "2025-09-01T08:30:00" → "8:30 AM"
function timeHHMM(localIso) {
    if (!localIso) return "—";
    const d = new Date(localIso);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// USD currency formatter (uses offer.currency if provided)
function money(total, currency = "USD") {
    const value = Number(total || 0);
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `$${value.toFixed(2)}`;
    }
}

// compute stops
function stopsLabel(segments) {
    const count = Math.max(0, (segments?.length || 0) - 1);
    if (count === 0) return { text: "Non-stop", tone: "green" };
    if (count === 1) return { text: "1 stop", tone: "amber" };
    return { text: `${count} stops`, tone: "amber" };
}

// main card component
function OfferCard({ offer, onSelect }) {
    const itinerary = offer?.itineraries?.[0]; // outbound only for the card
    const segs = itinerary?.segments || [];

    const first = segs[0] || {};
    const last = segs[segs.length - 1] || {};

    const origin = first?.departure?.iataCode || "—";
    const destination = last?.arrival?.iataCode || "—";

    const departTime = timeHHMM(first?.departure?.at);
    const arriveTime = timeHHMM(last?.arrival?.at);

    const duration = formatDuration(itinerary?.duration);
    const { text: stopsTxt, tone } = stopsLabel(segs);

    // airline + flight
    const marketing = first?.carrierCode || first?.operating?.carrierCode || "";
    const airline = AIRLINE_NAMES[marketing] || marketing || "—";
    const flightNumber = `${marketing}${first?.number || ""}`.trim() || "—";

    // price
    const total = offer?.price?.total;
    const currency = offer?.price?.currency || "USD";
    const priceStr = money(total, currency);

    // cabin (best-effort)
    const cabin =
        offer?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ??
        offer?.itineraries?.[0]?.segments?.[0]?.cabin ??
        "n/a";

    return (
        <Card onClick={() => onSelect?.(offer)} role="button">
            <div className="route">
                <div className="line">
                    <span className="code">{origin}</span>
                    <span className="arrow">→</span>
                    <span className="code">{destination}</span>
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
                    {flightNumber && <span className="muted"> • {flightNumber}</span>}
                </div>
                <div className="meta">
                    <span>{duration}</span>
                    <span className="dot">•</span>
                    <span>cabin {String(cabin).toLowerCase()}</span>
                </div>
            </div>

            <div className="right">
                <div className="price">{priceStr}</div>
                <div className="stops">
                    <Badge tone={tone}>{stopsTxt}</Badge>
                </div>
                <button
                    className="cta"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect?.(offer);
                    }}
                >
                    View details
                </button>
            </div>
        </Card>
    );
}

export default function Flight({ offers = [], showOnlyNonStop = false, onSelectOffer }) {
    const list = showOnlyNonStop
        ? offers.filter((o) => ((o?.itineraries?.[0]?.segments?.length || 1) - 1) === 0)
        : offers;

    return (
        <List>
            {list.map((offer, idx) => (
                <OfferCard key={idx} offer={offer} onSelect={onSelectOffer} />
            ))}
            {list.length === 0 && <Empty>Sorry, No flights to show for this route.</Empty>}
        </List>
    );
}

/* ---------- styles ---------- */

const List = styled.div`
    display: grid;
    gap: 0.75rem;
`;

const Empty = styled.div`
    padding: 1rem;
    border-radius: 0.75rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #475569;
    font-weight: 600;
`;

const Card = styled.div`
    display: grid;
    grid-template-columns: 1fr 1.2fr auto;
    gap: 1rem;
    align-items: center;
    padding: 1rem;
    border-radius: 0.9rem;
    background: #fff;
    border: 1px solid #e6edf5;
    box-shadow: 0 6px 16px rgba(2, 62, 138, 0.06);
    cursor: pointer;

    .route .line {
        font-weight: 800;
        letter-spacing: 0.5px;
    }
    .route .code {
        font-size: 1.05rem;
    }
    .route .arrow {
        margin: 0 6px;
        color: #64748b;
    }
    .route .times {
        color: #475569;
        margin-top: 4px;
    }
    .route .sep {
        margin: 0 6px;
        color: #94a3b8;
    }

    .middle .airline {
        font-size: 1.05rem;
    }
    .middle .muted {
        color: #475569;
        font-weight: 500;
    }
    .middle .meta {
        margin-top: 4px;
        color: #64748b;
    }
    .middle .dot {
        margin: 0 6px;
        color: #cbd5e1;
    }

    .right {
        display: grid;
        justify-items: end;
        gap: 0.4rem;
    }
    .right .price {
        font-weight: 900;
        font-size: 1.05rem;
    }
    .right .stops {
        margin-top: 2px;
    }
    .cta {
        margin-top: 6px;
        border: none;
        background: #1d4ed8;
        color: #fff;
        padding: 0.4rem 0.8rem;
        border-radius: 0.5rem;
        font-weight: 700;
    }

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
        justify-items: start;
        .right { justify-items: start; }
    }
`;

