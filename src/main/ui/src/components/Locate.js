import React, { useMemo, useState } from "react";
import styled from "styled-components";
import LocationSelect from "./LocationSelect";

const TABS = ["Round Trip", "One Way"];

export default function Locate({ onSearch }) {
    const [tab, setTab] = useState(TABS[0]);
    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [departDate, setDepartDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [adults, setAdults] = useState(1);
    const [nonstop, setNonstop] = useState(false);

    const canSearch = useMemo(() => {
        if (!origin || !destination || !departDate) return false;
        if (tab === "Round Trip" && !returnDate) return false;
        return true;
    }, [origin, destination, departDate, returnDate, tab]);

    const submit = (e) => {
        e.preventDefault();
        if (!canSearch) return;
        onSearch({
            origin,
            destination,
            departDate,
            returnDate: tab === "One Way" ? "" : returnDate,
            adults,
            nonstop,
        });
    };

    return (
        <Form onSubmit={submit}>
            <Tabs>
                {TABS.map((t) => (
                    <button
                        type="button"
                        key={t}
                        className={t === tab ? "active" : ""}
                        onClick={() => setTab(t)}
                    >
                        {t}
                    </button>
                ))}
            </Tabs>

            <Row className="grid2">
                <div className="field">
                    <label>From</label>
                    <LocationSelect placeholder="City or airport" onPick={(v) => setOrigin(v)} />
                </div>
                <div className="field">
                    <label>To</label>
                    <LocationSelect placeholder="City or airport" onPick={(v) => setDestination(v)} />
                </div>
            </Row>

            <Row className="grid2">
                <div className="field">
                    <label>Depart</label>
                    <input type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} />
                </div>
                <div className="field">
                    <label>Return {tab === "One Way" && "(disabled)"}</label>
                    <input
                        type="date"
                        value={returnDate}
                        disabled={tab === "One Way"}
                        onChange={(e) => setReturnDate(e.target.value)}
                    />
                </div>
            </Row>

            <Row className="grid3">
                <div className="field">
                    <label>Adults</label>
                    <input
                        type="number"
                        min={1}
                        value={adults}
                        onChange={(e) => setAdults(Number(e.target.value || 1))}
                    />
                </div>
                <div className="field">
                    <label>Class</label>
                    <select defaultValue="ECONOMY">
                        <option>ECONOMY</option>
                        <option>BUSINESS</option>
                        <option>FIRST</option>
                    </select>
                </div>
                <div className="field toggle">
                    <label>Nonstop only</label>
                    <input type="checkbox" checked={nonstop} onChange={(e) => setNonstop(e.target.checked)} />
                </div>
            </Row>

            <Submit disabled={!canSearch}>Search Flights</Submit>
        </Form>
    );
}

/* styles */
const Form = styled.form`display:flex;flex-direction:column;gap:1rem;`;
const Tabs = styled.div`
  background:#f4fbff;border:1px solid #dff2ff;border-radius:999px;padding:.25rem;width:fit-content;
  button{border:none;background:transparent;padding:.5rem .9rem;border-radius:999px;cursor:pointer;font-weight:700;color:#0b7285}
  .active{background:#0b7285;color:#fff}
`;
const Row = styled.div`
  display:flex; gap:1rem;
  .field{position:relative; flex:1;}
  .field label{display:block;font-size:.9rem;font-weight:600;color:#0b7285;margin-bottom:.35rem;}
  .field input,.field select{width:100%;border:1px solid #e7eef6;border-radius:.8rem;padding:.85rem 1rem;font-size:1rem;background:#fbfdff;outline:none;transition:.2s;}
  .field input:focus,.field select:focus{border-color:#48cae4; box-shadow:0 0 0 3px rgba(72,202,228,.2);}
  &.grid2{display:grid;grid-template-columns:1fr 1fr;}
  &.grid3{display:grid;grid-template-columns:repeat(3,1fr);}
  @media (max-width:700px){&.grid2,&.grid3{grid-template-columns:1fr;}}
`;
const Submit = styled.button`
  align-self:start;background:#48cae4;color:#fff;border:none;border-radius:1rem;padding:.9rem 1.4rem;font-weight:800;cursor:pointer;transition:.25s;
  opacity:${({disabled})=>disabled?0.6:1}; pointer-events:${({disabled})=>disabled?"none":"auto"};
  &:hover{background:#023e8a;}
`;
