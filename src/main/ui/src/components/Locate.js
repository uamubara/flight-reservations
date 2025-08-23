import React, { useState } from "react";
import styled from "styled-components";
import LocationSelect from "./LocationSelect";

/**
 * render the entire search form:
 * - One-way / Round trip toggle
 * - Origin / Destination with autocomplete
 * - Dates + Adults
 * - validate and submit an object to onSearch(...)
 */
export default function Locate({ onSearch }) {
    // keep minimal UI state
    const [tripType, setTripType] = useState("oneway");
    const [origin, setOrigin] = useState({ code: "", display: "" });
    const [destination, setDestination] = useState({ code: "", display: "" });
    const [departDate, setDepartDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [adults, setAdults] = useState(1);
    const [errors, setErrors] = useState({});

    // verify inputs before calling onSearch
    const validate = () => {
        const e = {};
        if (!/^[A-Za-z]{3}$/.test(origin.code)) e.origin = "Please choose an origin airport from suggestions";
        if (!/^[A-Za-z]{3}$/.test(destination.code)) e.destination = "Please choose a destination airport from suggestions";
        if (!departDate) e.departDate = "Choose a departure date";
        if (tripType === "roundtrip" && !returnDate) e.returnDate = "Choose a return date";
        if (adults < 1) e.adults = "At least 1 adult";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        onSearch?.({
            origin: origin.code.toUpperCase(),
            destination: destination.code.toUpperCase(),
            departDate,
            returnDate: tripType === "roundtrip" ? returnDate || undefined : undefined,
            adults: Number(adults),
        });
    };

    return (
        <Form onSubmit={handleSubmit} noValidate>
            {/* use a simple 2-button toggle for trip type */}
            <Toggle role="tablist" aria-label="Trip type">
                <button
                    type="button"
                    className={tripType === "oneway" ? "active" : ""}
                    onClick={() => setTripType("oneway")}
                >
                    One-way
                </button>
                <button
                    type="button"
                    className={tripType === "roundtrip" ? "active" : ""}
                    onClick={() => setTripType("roundtrip")}
                >
                    Round trip
                </button>
            </Toggle>

            {/* lay out the pickers in two rows for desktop; stack on mobile */}
            <Row>
                <Field>
                    <LocationSelect
                        label="Origin"
                        placeholder="Try 'Houston' or 'HOU'"
                        value={origin.code}
                        onChange={setOrigin}
                    />
                    {errors.origin && <Error>{errors.origin}</Error>}
                </Field>
                <Field>
                    <LocationSelect
                        label="Destination"
                        placeholder="Try 'New York' or 'JFK'"
                        value={destination.code}
                        onChange={setDestination}
                    />
                    {errors.destination && <Error>{errors.destination}</Error>}
                </Field>
            </Row>

            <Row>
                <Field>
                    <label htmlFor="departDate">Depart</label>
                    <input id="departDate" type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} />
                    {errors.departDate && <Error>{errors.departDate}</Error>}
                </Field>

                {/* hide the return date when "oneway" is selected */}
                <Field hidden={tripType === "oneway"}>
                    <label htmlFor="returnDate">Return</label>
                    <input id="returnDate" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                    {errors.returnDate && <Error>{errors.returnDate}</Error>}
                </Field>

                <Field small>
                    <label htmlFor="adults">Adults</label>
                    <input id="adults" type="number" min="1" value={adults} onChange={(e) => setAdults(e.target.value)} />
                    {errors.adults && <Error>{errors.adults}</Error>}
                </Field>
            </Row>

            <Actions><button type="submit">Search Flights</button></Actions>
        </Form>
    );
}

/* styles */
const Form = styled.form`display:grid; gap:.9rem;`;
const Toggle = styled.div`
    display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;
    button{
        background:#eef7ff; border:1px solid #dbeafe; color:#0b7285;
        padding:.45rem .85rem; border-radius:.6rem; font-weight:700; cursor:pointer;
    }
    button.active{ background:#0ea5e9; color:#fff; border-color:#0ea5e9; }
`;
const Row = styled.div`
    display:grid; grid-template-columns: 1fr 1fr; gap:.9rem;
    @media (max-width: 720px){ grid-template-columns: 1fr; }
`;
const Field = styled.div`
    display:grid; gap:.35rem;
    ${({ small }) => small && `max-width:160px;`}
    ${({ hidden }) => hidden && `display:none;`}
    label { font-weight:700; color:#0b7285; }
    input { border:1px solid #e6edf5; border-radius:.65rem; padding:.6rem .75rem; font-size:1rem; }
`;
const Actions = styled.div`
    display:flex; justify-content:flex-end;
    button{ background:#0ea5e9; color:#fff; border:0; border-radius:.7rem; padding:.7rem 1rem; cursor:pointer; font-weight:700; }
`;
const Error = styled.div`color:#c92a2a; font-size:.9rem;`;
