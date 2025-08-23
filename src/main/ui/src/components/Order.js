import React, { useState } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";

// keep reusing my env base URL
const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

/**
 * Collect minimal traveler info and try to place an order.
 * - POST traveler to /api/traveler (matches your backend DTO)
 * - Then POST the order payload to /api/bookings/order
 */
export default function Order() {
    const { state } = useLocation();
    const priced = state?.flight;

    const [form, setForm] = useState({
        fname: "", lname: "", dob: "", phoneNumber: "",
        nationality: "", passportNumber: "", expiryDate: ""
    });
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    // keep a tiny field updater around to avoid repetition
    const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    // create a traveler via the backend. so it returns a Traveler object compatible with Amadeus
    const saveTraveler = async () => {
        const r = await fetch(`${BASE}/api/traveler`, {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify({
                fname: form.fname, lname: form.lname, dob: form.dob,
                phoneNumber: form.phoneNumber, nationality: form.nationality,
                passportNumber: form.passportNumber, expiryDate: form.expiryDate
            })
        });
        return r.ok ? r.json() : Promise.reject(await r.text());
    };

    // stitch the final order payload and POST it to /api/bookings/order
    const placeOrder = async () => {
        try {
            setLoading(true);
            const traveler = await saveTraveler();
            const orderPayload = {
                data: {
                    type: "flight-order",
                    flightOffers: priced?.data?.flightOffers || [priced?.data || priced],
                    travelers: [traveler]
                }
            };
            const r = await fetch(`${BASE}/api/bookings/order`, {
                method: "POST", headers: {"Content-Type":"application/json"},
                body: JSON.stringify(orderPayload)
            });
            setResult(r.ok ? "Order placed!" : `Order failed: ${await r.text()}`);
        } catch (e) {
            setResult(e?.message || "Order failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Wrap>
            <h2>Traveler details</h2>
            <Grid as="form" onSubmit={(e)=>{e.preventDefault(); placeOrder();}}>
                <Field><label>First name</label><input value={form.fname} onChange={update("fname")} required /></Field>
                <Field><label>Last name</label><input value={form.lname} onChange={update("lname")} required /></Field>
                <Field><label>Date of birth</label><input type="date" value={form.dob} onChange={update("dob")} required /></Field>
                <Field><label>Phone</label><input value={form.phoneNumber} onChange={update("phoneNumber")} /></Field>
                <Field><label>Nationality</label><input value={form.nationality} onChange={update("nationality")} /></Field>
                <Field><label>Passport #</label><input value={form.passportNumber} onChange={update("passportNumber")} /></Field>
                <Field><label>Expiry date</label><input type="date" value={form.expiryDate} onChange={update("expiryDate")} /></Field>
                <Actions><button type="submit" disabled={loading}>{loading ? "Placing order…" : "Place order"}</button></Actions>
            </Grid>
            {result && <Note>{result}</Note>}
        </Wrap>
    );
}

/* styles */
const Wrap = styled.div`max-width:900px; margin:0 auto; padding:1rem;`;
const Grid = styled.div`
  display:grid; gap:.8rem; grid-template-columns: 1fr 1fr;
  @media (max-width: 720px){ grid-template-columns: 1fr; }
`;
const Field = styled.div`
  display:grid; gap:.35rem;
  label { font-weight:700; color:#0b7285; }
  input { border:1px solid #e6edf5; border-radius:.65rem; padding:.6rem .75rem; font-size:1rem; }
`;
const Actions = styled.div`
  grid-column: 1 / -1; display:flex; justify-content:flex-end;
  button{ background:#0ea5e9; color:#fff; border:0; border-radius:.7rem; padding:.7rem 1rem; cursor:pointer; font-weight:700; }
`;
const Note = styled.div`margin-top: .8rem; font-weight:700; color:#0b7285;`;

