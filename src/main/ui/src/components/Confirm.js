import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";

// BASE pattern
const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

// tiny helpers kept local
const fmtHM = (iso) => {
    if (!iso) return "â€”";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "â€”" : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};
const fmtDur = (iso) => {
    if (!iso) return "â€”";
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!m) return "â€”";
    const h = m[1] ? `${parseInt(m[1], 10)}h` : "";
    const min = m[2] ? ` ${parseInt(m[2], 10)}m` : "";
    return `${h}${min}`.trim() || "â€”";
};
const money = (v, cur = "USD") => {
    const n = Number(v || 0);
    try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(n);
    } catch {
        return `$${n.toFixed(2)}`;
    }
};

// extract the details either from priced payload (preferred) or from the raw offer
function extractDetails({ offer, priced }) {
    const src = priced?.data?.flightOffers?.[0] || offer || {};
    const iti = src?.itineraries?.[0];
    const segs = iti?.segments || [];

    // times
    const first = segs[0] || {};
    const last  = segs[segs.length - 1] || {};
    const departTime = fmtHM(first?.departure?.at);
    const arriveTime = fmtHM(last?.arrival?.at);

    // codes
    const originCode = first?.departure?.iataCode || first?.departure?.code || "â€”";
    const destCode   = last?.arrival?.iataCode || last?.arrival?.code || "â€”";

    // price / currency always show USD
    const total  = src?.price?.total;
    const cur    = src?.price?.currency || "USD";

    // cabin + baggage from travelerPricings -> fareDetailsBySegment
    const t0 = (src?.travelerPricings || [])[0] || {};
    const fd = (t0?.fareDetailsBySegment || [])[0] || {};
    const cabin = fd?.cabin || "ECONOMY";
    // included bags may be {quantity} OR {weight,weightUnit}
    let bags = "â€”";
    if (fd?.includedBags?.quantity != null) {
        bags = `${fd.includedBags.quantity} piece(s)`;
    } else if (fd?.includedBags?.weight != null) {
        bags = `${fd.includedBags.weight}${fd.includedBags.weightUnit || ""}`;
    }

    // aircraft (per segment). If priced has dictionaries.aircraft, use that for names.
    const dictAircraft = priced?.dictionaries?.aircraft || {};
    const aircraft = segs.map(s => {
        const code = s?.aircraft?.code || "";
        const name = dictAircraft[code] || "";
        return { code, name };
    });

    // stops (direct stops array if present)
    const stops = segs.flatMap(s =>
        (s?.stops || []).map(st => ({
            iata: st?.iataCode || "â€”",
            duration: st?.duration ? fmtDur(st.duration) : "â€”",
            arrivalAt: st?.arrivalAt ? fmtHM(st.arrivalAt) : "â€”",
            departureAt: st?.departureAt ? fmtHM(st.departureAt) : "â€”",
        }))
    );

    return {
        originCode,
        destCode,
        departTime,
        arriveTime,
        duration: fmtDur(iti?.duration),
        priceLabel: money(total, cur),
        cabin,
        bags,
        aircraft,
        stops,
    };
}

export default function Confirm() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const offer = state?.offer;

    const [loading, setLoading] = useState(true);
    const [priced, setPriced]   = useState(null);
    const [error, setError]     = useState("");

    // POST the raw offer to /api/flights/confirm
    useEffect(() => {
        let abort = false;

        async function go() {
            if (!offer) { setError("No flight selected."); setLoading(false); return; }
            try {
                setError(""); setLoading(true);
                const r = await fetch(`${BASE}/api/flights/confirm`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(offer),
                });
                if (!r.ok) throw new Error(await r.text());
                const json = await r.json();
                if (!abort) setPriced(json);
            } catch (e) {
                // Donâ€™t hard fail the page â€” still show details from the original offer
                console.warn("Pricing failed, falling back to offer-only details:", e);
                if (!abort) { setPriced(null); }
            } finally {
                if (!abort) setLoading(false);
            }
        }

        go();
        return () => { abort = true; };
    }, [offer]);

    // derive a single detail model used by the UI
    const details = useMemo(() => extractDetails({ offer, priced }), [offer, priced]);

    if (!offer) {
        return (
            <Shell>
                <Panel>
                    <h2>Flight details</h2>
                    <Msg error>No flight selected.</Msg>
                    <Actions><button onClick={() => navigate("/booking")}>Back to search</button></Actions>
                </Panel>
            </Shell>
        );
    }

    return (
        <Shell>
            <Panel>
                <h2>Flight details</h2>

                {loading && <Msg>Loading live price & inclusionsâ€¦</Msg>}
                {!loading && error && <Msg error>{error}</Msg>}

                {/* Top summary (keeps layout clean) */}
                <Row>
                    <Block>
                        <Title>{details.originCode} â†’ {details.destCode}</Title>
                        <Sub>{details.departTime} â€” {details.arriveTime} â€¢ {details.duration}</Sub>
                    </Block>
                    <Block align="right">
                        <Price>{details.priceLabel}</Price>
                    </Block>
                </Row>

                {/* Inclusions / icons (no external CSS changes) */}
                <Divider />

                <Grid>
                    <Mini>
                        <Icon role="img" aria-label="luggage">ðŸ§³</Icon>
                        <div>
                            <strong>Baggage:</strong>
                            <div className="muted">{details.bags}</div>
                        </div>
                    </Mini>

                    <Mini>
                        <Icon role="img" aria-label="meal">ðŸ½ï¸</Icon>
                        <div>
                            <strong>Meal:</strong>
                            <div className="muted">May vary by carrier / route</div>
                        </div>
                    </Mini>

                    <Mini>
                        <Icon role="img" aria-label="cabin">ðŸ›«</Icon>
                        <div>
                            <strong>Cabin:</strong>
                            <div className="muted">{details.cabin}</div>
                        </div>
                    </Mini>
                </Grid>

                {/* Aircraft & stops */}
                <Section>
                    <h3>Aircraft</h3>
                    {details.aircraft.length === 0 ? (
                        <Empty>Not provided</Empty>
                    ) : (
                        <ul>
                            {details.aircraft.map((a, i) => (
                                <li key={i}>
                                    âœˆï¸ {a.code}{a.name ? ` â€” ${a.name}` : ""}
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                <Section>
                    <h3>Stops</h3>
                    {details.stops.length === 0 ? (
                        <Empty>Non-stop</Empty>
                    ) : (
                        <ul>
                            {details.stops.map((s, i) => (
                                <li key={i}>
                                    ðŸ§­ {s.iata} â€¢ {s.duration} {s.departureAt !== "â€”" || s.arrivalAt !== "â€”" ? `â€¢ ${s.departureAt} â†’ ${s.arrivalAt}` : ""}
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                <Actions>
                    <button onClick={() => navigate("/booking")}>Back</button>
                    <button className="primary">Continue</button>
                </Actions>
            </Panel>
        </Shell>
    );
}

/* ------------     minimal, neutral styles        ------------ */
const Shell = styled.div`
  max-width: 900px; margin: 2rem auto; padding: 0 1rem;
`;
const Panel = styled.div`
  background:#fff; border:1px solid #e6edf5; border-radius:1rem; padding:1rem; 
  box-shadow:0 8px 20px rgba(2,62,138,.05);
  h2 { margin:0 0 .5rem; color:#023e8a; }
`;
const Row = styled.div`
  display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap;
`;
const Block = styled.div`
  text-align:${p=>p.align || "left"};
`;
const Title = styled.div`font-weight:900; font-size:1.1rem;`;
const Sub = styled.div`color:#64748b; font-weight:600; margin-top:2px;`;
const Price = styled.div`font-weight:900; font-size:1.2rem;`;
const Divider = styled.hr`border:none; border-top:1px solid #e6edf5; margin:1rem 0;`;
const Grid = styled.div`display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:1rem;
  @media (max-width:720px){ grid-template-columns:1fr; }
`;
const Mini = styled.div`display:flex; gap:.6rem; align-items:center;
  .muted{ color:#64748b; }
`;
const Icon = styled.span`font-size:1.4rem;`;
const Section = styled.section`
  margin-top:1rem;
  h3{ margin:0 0 .4rem; color:#0b7285; }
  ul{ margin:.25rem 0 0 1rem; }
`;
const Empty = styled.div`color:#64748b; font-weight:600; background:#f8fafc; border:1px solid #e2e8f0; border-radius:.6rem; padding:.6rem;`;
const Msg = styled.div`
  background:${p=>p.error?"#fef2f2":"#f8fafc"}; border:1px solid ${p=>p.error?"#fecaca":"#e2e8f0"};
  color:${p=>p.error?"#b91c1c":"#334155"}; border-radius:.6rem; padding:.7rem; font-weight:700; margin:.5rem 0;
`;
const Actions = styled.div`
  display:flex; gap:.6rem; justify-content:flex-end; margin-top:1rem;
  button{ background:#e2e8f0; color:#111827; border:0; border-radius:.6rem; padding:.55rem .9rem; font-weight:700; cursor:pointer; }
  .primary{ background:#1d4ed8; color:#fff; }
`;
