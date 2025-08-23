import React, { useState } from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";

// keep using backend base URL from .env
const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

/**
 * re-price the selected flight with Amadeus via /api/flights/confirm.
 * - If the price comes back, let the user continue to /order
 */
export default function Confirm() {
    const nav = useNavigate();
    const { state } = useLocation();
    const flight = state?.flight;
    const [priced, setPriced] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    if (!flight) return <Box error>I need a flight to confirm.</Box>;

    // POST the whole flight object back to the backend for pricing
    const confirm = async () => {
        try {
            setErr(""); setLoading(true);
            const r = await fetch(`${BASE}/api/flights/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(flight),
            });
            if (!r.ok) throw new Error(await r.text());
            const json = await r.json();
            setPriced(json);
        } catch (e) {
            console.error(e);
            setErr(e.message || "Confirm failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Wrap>
            <h2>Confirm price</h2>
            <Box>
                <div>Selected total: <strong>${flight?.price?.total ?? "—"}</strong></div>
                <button disabled={loading} onClick={confirm}>{loading ? "Confirming…" : "Confirm with provider"}</button>
            </Box>

            {err && <Box error>{err}</Box>}

            {priced && (
                <Box>
                    <div>Provider total: <strong>${priced?.data?.flightOffers?.[0]?.price?.total ?? priced?.data?.price?.total ?? "—"}</strong></div>
                    <Actions>
                        <button onClick={() => nav("/order", { state: { flight: priced }})}>Continue to travelers</button>
                    </Actions>
                </Box>
            )}
        </Wrap>
    );
}

/* styles */
const Wrap = styled.div`max-width:900px; margin:0 auto; padding:1rem;`;
const Box = styled.div`
    margin-top: .9rem; background:${p=>p.error ? "#fef2f2" : "#fff"};
    border:1px solid ${p=>p.error ? "#fecaca" : "#e6edf5"}; border-radius:.9rem; padding:.9rem;
    color:${p=>p.error ? "#b91c1c" : "inherit"};
    display:grid; gap:.6rem;
    button{ background:#0ea5e9; color:#fff; border:0; border-radius:.7rem; padding:.6rem .9rem; cursor:pointer; font-weight:700; }
`;
const Actions = styled.div`display:flex; justify-content:flex-end;`;

