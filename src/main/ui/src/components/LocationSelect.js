import React, { useEffect, useState } from "react";
import styled from "styled-components";

export default function LocationSelect({ placeholder = "City or airport", onPick }) {
    const [query, setQuery] = useState("");
    const [opts, setOpts] = useState([]);
    const [open, setOpen] = useState(false);

    const base =
        (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

    useEffect(() => {
        const id = setTimeout(async () => {
            if (!query || query.length < 2) { setOpts([]); return; }
            try {
                const r = await fetch(`${base}/api/locations?keyword=${encodeURIComponent(query)}`);
                const json = await r.json();
                setOpts(extractLocations(json).slice(0, 8));
                setOpen(true);
            } catch {
                setOpts([]); setOpen(false);
            }
        }, 250);
        return () => clearTimeout(id);
    }, [query, base]);

    const choose = (o) => {
        setQuery(`${o.city} (${o.iata})`);
        setOpen(false);
        onPick && onPick(o.iata);
    };

    return (
        <Wrap>
            <input
                value={query}
                placeholder={placeholder}
                onChange={(e) => { setQuery(e.target.value); setOpen(false); }}
                onFocus={() => opts.length && setOpen(true)}
            />
            {open && opts.length > 0 && (
                <Auto>
                    {opts.map((o, i) => (
                        <div key={i} className="opt" onMouseDown={() => choose(o)}>
                            <strong>{o.city}</strong> &middot; {o.name} <span className="iata">{o.iata}</span>
                        </div>
                    ))}
                </Auto>
            )}
        </Wrap>
    );
}

/* Support both raw Amadeus wrapper and simplified arrays */
function extractLocations(json) {
    if (Array.isArray(json)) {
        const holder = json.find((x) => x?.response?.result?.data);
        if (holder) return holder.response.result.data.map(toLoc);
    }
    const data = json?.data || json;
    if (Array.isArray(data)) return data.map(toLoc);
    return [];
}
function toLoc(d) {
    return {
        iata: d.iataCode,
        name: d.name || d.detailedName || "",
        city: d.address?.cityName || d.address?.cityCode || "",
        country: d.address?.countryName || d.address?.countryCode || "",
    };
}

/* styles */
const Wrap = styled.div`
  position:relative;
  input{width:100%;border:1px solid #e7eef6;border-radius:.8rem;padding:.85rem 1rem;font-size:1rem;background:#fbfdff;outline:none;transition:.2s;}
  input:focus{border-color:#48cae4;box-shadow:0 0 0 3px rgba(72,202,228,.2);}
`;
const Auto = styled.div`
  position:absolute; top:3.1rem; left:0; right:0; background:#fff; border:1px solid #e7eef6;
  border-radius:.8rem; box-shadow:0 14px 28px rgba(2,62,138,.08); z-index:5; max-height:240px; overflow:auto;
  .opt{padding:.65rem .8rem; cursor:pointer; display:flex; gap:.4rem; align-items:center;}
  .opt:hover{background:#f7fbff;}
  .iata{margin-left:auto; font-weight:800; color:#0b7285;}
`;
