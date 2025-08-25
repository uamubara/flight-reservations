import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Badge } from "./FlightSelect";

const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

/* ---------------- helpers ---------------- */

// --- CORRECTED: This function now formats the duration string as requested ---
function formatDuration(iso) {
    if (!iso) return "—";
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return iso; // Return original if format is unexpected

    const hours = match[1] ? `${match[1]}h` : "";
    const minutes = match[2] ? `${match[2]}m` : "";

    return `${hours} ${minutes}`.trim();
}

function timeHHMM(isoMaybe) {
    if (!isoMaybe) return "—";
    const d = new Date(isoMaybe);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function money(total, currency = "USD") {
    const v = Number(total || 0);
    try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(v);
    } catch {
        return `$${v.toFixed(2)}`;
    }
}
const humanizeClass = (v) => {
    switch ((v || "").toUpperCase()) {
        case "ECONOMY": return "Economy";
        case "PREMIUM_ECONOMY": return "Premium Economy";
        case "BUSINESS": return "Business";
        case "FIRST": return "First";
        default: return "cabin n/a";
    }
};

// This function already handles 2, 3, or more stops correctly.
const stopsBadge = (n) => (n === 0 ? { text: "Non-stop", tone: "green" } : n === 1 ? { text: "1 stop", tone: "amber" } : { text: `${n} stops`, tone: "amber" });

/* ---------------- card ---------------- */
function OfferCard({ offer, onSelect, airportsMap }) {
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
        <Card onClick={() => onSelect?.(offer.rawOffer)} role="button">
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
                <button className="cta" onClick={(e) => { e.stopPropagation(); onSelect?.(offer.rawOffer); }}>
                    View details
                </button>
            </div>
        </Card>
    );
}

/* ---------------- main list ---------------- */
export default function Flight({ offers = [], showOnlyNonStop = false, onSelectOffer }) {
    const codes = useMemo(() => {
        const set = new Set();
        for (const o of offers) {
            if (o?.originCode) set.add(o.originCode);
            if (o?.destinationCode) set.add(o.destinationCode);
        }
        return Array.from(set).filter(Boolean);
    }, [offers]);

    const [airportsMap, setAirportsMap] = useState({});
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

    const filtered = showOnlyNonStop
        ? offers.filter((o) => (o?.numberOfStops ?? 1) === 0)
        : offers;

    return (
        <List>
            {filtered.map((offer) => (
                <OfferCard key={offer.id} offer={offer} airportsMap={airportsMap} onSelect={onSelectOffer} />
            ))}
            {filtered.length === 0 && <Empty>No flights to show.</Empty>}
        </List>
    );
}

/* ---------------- styles ---------------- */
const List = styled.div`display:grid; gap:.75rem;`;
const Empty = styled.div`
    padding:1rem; border-radius:.75rem; background:#f8fafc;
    border:1px solid #e2e8f0; color:#475569; font-weight:600;
`;
const Card = styled.div`
    display:grid; grid-template-columns:1fr 1.2fr auto; gap:1rem; align-items:center;
    padding:1rem; border-radius:.9rem; background:#fff; border:1px solid #e6edf5;
    box-shadow:0 6px 16px rgba(2,62,138,.06); cursor:pointer;

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