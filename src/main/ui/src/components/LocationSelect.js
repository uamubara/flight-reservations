import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

// read backend base URL from .env (REACT_APP_API_BASE)
const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

/**
 * A controlled autocomplete component for airport selection.
 * - It receives a `value` object { code, display } and an `onChange` function from its parent.
 * - The input field's text is always sourced from `value.display`.
 * - When the user types, it calls `onChange` to update the parent, clearing the airport `code`.
 * - When the user picks an item, it calls `onChange` with the complete { code, display } object.
 */
export default function LocationSelect({ label, placeholder, value, onChange }) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const boxRef = useRef(null);

    // The text to search for is derived directly from the parent's state
    const query = value?.display || "";

    // close the dropdown if the user clicks outside
    useEffect(() => {
        const onDoc = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    // Debounce the search calls by 250ms when the query text changes
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
        onChange?.(it);           // send the complete { code, display } object upward
        setOpen(false);
    };

    return (
        <Box ref={boxRef}>
            <label>{label}</label>
            <input
                placeholder={placeholder}
                value={value?.display || ""} // Input is now fully controlled by the parent's `display` property
                onChange={(e) => {
                    // When user types, immediately update the parent state.
                    // This clears the airport `code`, ensuring validation works correctly.
                    onChange?.({ code: "", display: e.target.value });
                    setOpen(true);
                }}
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