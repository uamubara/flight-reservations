import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

/**
 * render a grid of selectable flight cards.
 * - Each card shows carrier, route, price, and a stop badge
 * - When User click a card,  navigate to /flight with that flight in state
 */
export default function FlightSelect({ title, flights }) {
    const nav = useNavigate();
    const onPick = (flight) => nav("/flight", { state: { flight } });

    if (!flights || flights.length === 0) return null;

    return (
        <Block>
            <h3>{title}</h3>
            <Grid>
                {flights.map((f, idx) => (
                    <Card key={idx} onClick={() => onPick(f)}>
                        <div className="row">
                            <div className="left">
                                <Airline>{(f.validatingAirlineCodes || [])[0] || "—"}</Airline>
                                <Route>{firstLeg(f)}</Route>
                            </div>
                            <div className="right">
                                <Price>${safe(f?.price?.total)}</Price>
                                {/* I show a badge indicating stops */}
                                <Badge tone={badge(f).tone}>{badge(f).text}</Badge>
                            </div>
                        </div>
                        <Meta>{durationText(f)} • {cabinText(f)}</Meta>
                    </Card>
                ))}
            </Grid>
        </Block>
    );
}

/* helpers I keep local for clarity */
const safe = (x) => (x ?? "—");
const countStops = (f) =>
    (f?.itineraries || []).reduce((sum, it) => sum + Math.max(0, (it?.segments?.length || 0) - 1), 0);
const badge = (f) => {
    const s = countStops(f);
    if (s === 0) return { text: "Non-stop", tone: "green" };
    if (s === 1) return { text: "1 stop", tone: "amber" };
    return { text: `${s} stops`, tone: "red" };
};
const firstLeg = (f) => {
    const seg = f?.itineraries?.[0]?.segments?.[0];
    const lastSeg = f?.itineraries?.[0]?.segments?.slice(-1)?.[0];
    if (!seg || !lastSeg) return "—";
    const d = (seg?.departure?.iataCode || "—");
    const a = (lastSeg?.arrival?.iataCode || "—");
    return `${d} → ${a}`;
};
const durationText = (f) => {
    const dur = f?.itineraries?.[0]?.duration || "";
    return dur ? dur.replace("PT", "").toLowerCase() : "duration n/a";
};
const cabinText = (f) => {
    const c = f?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin;
    return c ? c.toLowerCase() : "cabin n/a";
};

/* styles */
const Block = styled.section`
  display: grid; gap: .8rem;
  h3 { margin: .2rem 0 .4rem; color:#0b7285; }
`;
const Grid = styled.div`
  display: grid; gap: .8rem;
  grid-template-columns: repeat(2, minmax(0,1fr));
  @media (max-width: 900px){ grid-template-columns: 1fr; }
`;
const Card = styled.button`
  text-align: left; background:#fff; border:1px solid #e6edf5; border-radius:1rem; padding: .9rem;
  cursor:pointer; box-shadow: 0 8px 20px rgba(2,62,138,.05);
  .row{ display:flex; justify-content:space-between; align-items:center; gap:1rem; }
  .left{ min-width:0; }
`;
const Airline = styled.div`font-weight:800; letter-spacing:.2px; color:#023e8a;`;
const Route = styled.div`font-weight:700; color:#0b7285;`;
const Price = styled.div`font-weight:900; font-size:1.1rem;`;
export const Badge = styled.span`
  display:inline-block; font-weight:700; font-size:.85rem;
  padding:.25rem .5rem; border-radius:.5rem; margin-left:.5rem;
  ${({ tone }) => {
    if (tone === "green") return `background:#ecfdf5; color:#047857; border:1px solid #a7f3d0;`;
    if (tone === "amber") return `background:#fffbeb; color:#92400e; border:1px solid #fde68a;`;
    return `background:#fef2f2; color:#b91c1c; border:1px solid #fecaca;`;
}}
`;
const Meta = styled.div`color:#64748b; font-weight:600; margin-top:.3rem;`;

