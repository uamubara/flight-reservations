import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

export default function LocationSelect({ label, placeholder, value, onChange, suggestCurrentLocation }) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState(null);
    const boxRef = useRef(null);
    const cache = useRef({});
    const locationSuggested = useRef(false);

    const query = value?.display || "";

    useEffect(() => {
        const onDoc = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const handleSuggestLocation = () => {
        if (!suggestCurrentLocation || locationSuggested.current || query) return;
        locationSuggested.current = true;
        setLoading(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const r = await fetch(`${BASE}/api/nearest-airport?latitude=${latitude}&longitude=${longitude}`);
                const data = (await r.json()) || [];
                if (data.length > 0) {
                    const nearest = data[0];
                    setSuggestion({
                        code: nearest.iataCode,
                        city: nearest.city,
                        country: nearest.countryCode,
                        name: nearest.name,
                    });
                }
            } catch (e) {
                console.error("Failed to fetch nearest airport:", e);
            } finally {
                setLoading(false);
            }
        }, (error) => {
            console.warn("Could not get location:", error.message);
            setLoading(false);
        });
    };

    useEffect(() => {
        setItems([]);
        if (!query || query.length < 2) {
            return;
        }

        const debounceTimer = setTimeout(() => {
            async function fetchData() {
                if (cache.current[query]) {
                    setItems(cache.current[query]);
                    return;
                }
                try {
                    setLoading(true);
                    const r = await fetch(`${BASE}/api/locations?keyword=${encodeURIComponent(query)}`);
                    const data = (await r.json()) || [];
                    const list = Array.isArray(data) ? data.map((loc) => ({
                        code: loc.iataCode,
                        city: loc.city,
                        country: loc.countryCode,
                        name: loc.name,
                    })).filter(Boolean) : [];

                    cache.current[query] = list;
                    setItems(list);
                } catch (e) {
                    console.error(e);
                    setItems([]);
                } finally {
                    setLoading(false);
                }
            }
            fetchData();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [query]);

    const pick = (it) => {
        onChange?.({
            code: it.code,
            display: `${it.city} (${it.code})`
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
                onFocus={() => {
                    setOpen(true);
                    handleSuggestLocation();
                }}
                autoComplete="off"
            />
            {open && (
                <List role="listbox">
                    {loading && <li className="hint">Searchingâ€¦</li>}

                    {suggestion && !query && (
                        <>
                            <Header><span className="icon">ðŸ“</span> Current location</Header>
                            <ListItem onClick={() => pick(suggestion)}>
                                <LocationInfo>
                                    <MainText>{suggestion.name}</MainText>
                                    <SubText>{suggestion.city}, {suggestion.country}</SubText>
                                </LocationInfo>
                                <IataCode>{suggestion.code}</IataCode>
                            </ListItem>
                        </>
                    )}

                    <Header><span className="icon">*</span> All locations</Header>
                    {!loading && items.map((it, index) => (
                        <ListItem key={`${it.code}-${index}`} onClick={() => pick(it)}>
                            <LocationInfo>
                                <MainText>{it.name}</MainText>
                                <SubText>{it.city}, {it.country}</SubText>
                            </LocationInfo>
                            <IataCode>{it.code}</IataCode>
                        </ListItem>
                    ))}
                    {!loading && items.length === 0 && query && <li className="hint">No matches found</li>}
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
    max-height: 320px; overflow: auto; box-shadow: 0 12px 28px rgba(2,62,138,.08);
    margin: 0; padding: .3rem; list-style: none;
    .hint { padding: .8rem; color: #6b7280; cursor: default; }
`;

const Header = styled.li`
    padding: .8rem .8rem .4rem;
    color: #64748b;
    font-weight: 600;
    font-size: .9rem;
    display: flex;
    align-items: center;
    gap: .5rem;
    cursor: default;
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