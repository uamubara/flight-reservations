import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

// Note: Your IDE may show warnings like "Unresolved variable" for properties like 'cityName' or 'iataCode'.
// This is expected because the shape of the API data is dynamic. The code is written safely
// with optional chaining (the '?' symbols) and fallbacks to prevent any runtime errors.

const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

export default function LocationSelect({ label, placeholder, value, onChange }) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const boxRef = useRef(null);
    const cache = useRef({});

    const query = value?.display || "";

    useEffect(() => {
        const onDoc = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    useEffect(() => {
        const t = setTimeout(async () => {
            if (!query || query.length < 2) {
                setItems([]);
                return;
            }

            if (cache.current[query]) {
                setItems(cache.current[query]);
                return;
            }

            try {
                setLoading(true);
                const r = await fetch(`${BASE}/api/locations?keyword=${encodeURIComponent(query)}`);
                const data = (await r.json()) || [];

                const list = Array.isArray(data) ? data.map((loc) => {
                    const code = loc?.iataCode;
                    if (!code) return null;

                    const city = loc?.address?.cityName;
                    const country = loc?.address?.countryName;
                    const airportName = loc.name;

                    if (city && country) {
                        return {
                            code,
                            mainText: `${city}, ${country}`,
                            subText: airportName,
                        };
                    }

                    return {
                        code,
                        mainText: airportName,
                        subText: `${code} Airport`,
                    };
                }).filter(Boolean) : [];

                cache.current[query] = list;
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

    const pick = (it) => {
        onChange?.({
            code: it.code,
            display: `${it.mainText} (${it.code})`
        });
        setOpen(false);
    };

    return (
        <Box ref={boxRef}>
            <label>{label}</label>
            <input
                placeholder={placeholder}
                value={query}
                onChange={(e) => {
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
                        <ListItem key={it.code} onClick={() => pick(it)}>
                            <LocationInfo>
                                <MainText>{it.mainText}</MainText>
                                <SubText>{it.subText}</SubText>
                            </LocationInfo>
                            <IataCode>{it.code}</IataCode>
                        </ListItem>
                    ))}
                    {!loading && items.length === 0 && query && <li className="hint">No matches</li>}
                </List>
            )}
        </Box>
    );
}

/* --- Styles --- */

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
    max-height: 280px; overflow: auto; box-shadow: 0 12px 28px rgba(2,62,138,.08);
    margin: 0; padding: .3rem; list-style: none;
    .hint { padding: .8rem; color: #6b7280; cursor: default; }
`;

const ListItem = styled.li`
    padding: .6rem .8rem;
    border-radius: .5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .8rem;

    &:hover {
        background: #f6fbff;
    }
`;

const LocationInfo = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-width: 0;
`;

const MainText = styled.span`
    font-weight: 600;
    color: #334155;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const SubText = styled.span`
    color: #64748b;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const IataCode = styled.span`
    font-weight: 700;
    color: #0b7285;
    background-color: #f0f9ff;
    padding: .25rem .5rem;
    border-radius: .4rem;
    font-size: 0.9rem;
`;