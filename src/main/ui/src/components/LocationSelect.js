import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

// read backend base URL from .env (REACT_APP_API_BASE)
const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

/**
 *   use this controlled component anywhere I need an airport picker.
 * - When user begins to type, fetch /api/locations?keyword=...
 * - render "City, ST – Airport (IATA)" in the dropdown
 * - When the user picks an option,  pass { code, display } back up via onChange
 */
export default function LocationSelect({ label, placeholder, value, onChange }) {
    // value is the current IATA code. I'll keep a pretty string separately for the input.
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const boxRef = useRef(null);

    // sync initial value into the visible input (basic behavior)
    useEffect(() => {
        if (value && !query) setQuery(value);
    }, [value]); // I keep this simple on purpose

    // close the dropdown if the user clicks outside
    useEffect(() => {
        const onDoc = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    // Debounce the search calls by 250ms when the query changes
    useEffect(() => {
        const t = setTimeout(async () => {
            if (!query || query.length < 2) { setItems([]); return; }
            try {
                setLoading(true);
                const r = await fetch(`${BASE}/api/locations?keyword=${encodeURIComponent(query)}`);
                const data = (await r.json()) || [];
                // normalize Amadeus' response into a friendly { code, display } format
                const list = Array.isArray(data) ? data.map((loc) => {
                    const iata = loc?.iataCode;
                    const city = loc?.address?.cityName || loc?.name || iata;
                    const state = loc?.address?.stateCode ? `, ${loc.address.stateCode}` : "";
                    const country = loc?.address?.countryCode || "";
                    const airportName = loc?.name || "";
                    const display = `${city}${state}${!state && country ? ", " + country : ""} – ${airportName} (${iata})`;
                    return iata ? { code: iata, display } : null;
                }).filter(Boolean) : [];
                setItems(list);
            } catch (e) {
                console.error(e);
                setItems([]);
            } finally {
                setLoading(false);
            }
        }, 250);
        return () => clearTimeout(t);
    }, [query]);

    // Handle a user picking an item
    const pick = (it) => {
        onChange?.(it);           // send { code, display } upward
        setQuery(it.display);     // show the friendly label in the input
        setOpen(false);
    };

    return (
        <Box ref={boxRef}>
            <label>{label}</label>
            <input
                placeholder={placeholder}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                autoComplete="off"
            />
            {open && (items.length > 0 || loading) && (
                <List role="listbox">
                    {loading && <li className="hint">Searching…</li>}
                    {!loading && items.map((it) => (
                        <li key={it.code} onClick={() => pick(it)}>
                            <span className="name">{it.display}</span>
                        </li>
                    ))}
                    {!loading && items.length === 0 && query && <li className="hint">No matches</li>}
                </List>
            )}
        </Box>
    );
}

/* styles */
const Box = styled.div`
    position: relative; display: grid; gap: .35rem;
    label { font-weight: 700; color: #0b7285; }
    input {
        border: 1px solid #e6edf5; border-radius: .65rem; padding: .6rem .75rem; font-size: 1rem;
    }
`;
const List = styled.ul`
    position: absolute; z-index: 20; left: 0; right: 0; top: calc(100% + 6px);
    background: #fff; border: 1px solid #e6edf5; border-radius: .65rem;
    max-height: 260px; overflow: auto; box-shadow: 0 12px 28px rgba(2,62,138,.08);
    margin: 0; padding: .3rem; list-style: none;
    li { padding: .55rem .6rem; border-radius: .5rem; cursor: pointer; }
    li:hover { background: #f6fbff; }
    .hint { color: #6b7280; cursor: default; }
    .name { font-weight: 600; color: #0b7285; }
`;
