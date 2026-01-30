import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import LocationSelect from "./LocationSelect";
import { ChevronDown } from "lucide-react";

// --- Passenger Dropdown Component ---
const PassengerDropdown = ({ adults, setAdults, children, setChildren, infants, setInfants, errors }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tooltip, setTooltip] = useState(null);
    const dropdownRef = useRef(null);
    const totalPassengers = adults + children;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getSummary = () => {
        const adultText = `${adults} Adult${adults !== 1 ? 's' : ''}`;
        const childText = children > 0 ? `, ${children} Child${children !== 1 ? 'ren' : ''}` : '';
        const infantText = infants > 0 ? `, ${infants} Infant${infants !== 1 ? 's' : ''}` : '';
        return `${adultText}${childText}${infantText}`;
    };

    const handleChange = (type, delta) => {
        const updateFunctions = { adults: setAdults, children: setChildren, infants: setInfants };
        const currentValues = { adults, children, infants };
        let newValue = currentValues[type] + delta;

        if (newValue < 0) newValue = 0;
        if (type === 'adults' && infants > 0 && newValue < infants) return;
        if ((type === 'adults' || type === 'children') && totalPassengers + delta > 9) return;
        if (type === 'infants' && newValue > adults) return;

        updateFunctions[type](newValue);
    };

    return (
        <DropdownContainer ref={dropdownRef}>
            <label>Passengers</label>
            <DropdownButton type="button" onClick={() => setIsOpen(!isOpen)} active={isOpen}>
                <span>{getSummary()}</span>
                <ChevronDown
                    size={18}
                    className="arrow"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                    }}
                />
            </DropdownButton>
            {isOpen && (
                <Panel>
                    <PassengerRow>
                        <Label>
                            Adults <AgeInfo>12+ years</AgeInfo>
                        </Label>
                        <Counter>
                            <button type="button" onClick={() => handleChange('adults', -1)} disabled={adults === 0}>-</button>
                            <span>{adults}</span>
                            <button type="button" onClick={() => handleChange('adults', 1)} disabled={totalPassengers >= 9}>+</button>
                        </Counter>
                    </PassengerRow>
                    <PassengerRow>
                        <Label>
                            Child <AgeInfo>2-11 years</AgeInfo>
                        </Label>
                        <InfoIcon onMouseEnter={() => setTooltip('child')} onMouseLeave={() => setTooltip(null)}>
                            i
                            {tooltip === 'child' && <Tooltip>Children between 2-5 years should be accompanied by an adult over 16 years of age when travelling.</Tooltip>}
                        </InfoIcon>
                        <Counter>
                            <button type="button" onClick={() => handleChange('children', -1)} disabled={children === 0}>-</button>
                            <span>{children}</span>
                            <button type="button" onClick={() => handleChange('children', 1)} disabled={totalPassengers >= 9}>+</button>
                        </Counter>
                    </PassengerRow>
                    <PassengerRow>
                        <Label>
                            Infant <AgeInfo>Under 2 years</AgeInfo>
                        </Label>
                        <InfoIcon onMouseEnter={() => setTooltip('infant')} onMouseLeave={() => setTooltip(null)}>
                            i
                            {tooltip === 'infant' && <Tooltip>Each infant should be accompanied by one adult. When an infant fare is booked, the infant will be seated on the parent's lap.</Tooltip>}
                        </InfoIcon>
                        <Counter>
                            <button type="button" onClick={() => handleChange('infants', -1)} disabled={infants === 0}>-</button>
                            <span>{infants}</span>
                            <button type="button" onClick={() => handleChange('infants', 1)} disabled={infants >= adults}>+</button>
                        </Counter>
                    </PassengerRow>
                    {totalPassengers >= 9 && <Notice>You can book for a maximum of nine passengers.</Notice>}
                </Panel>
            )}
            {errors.passengers && <Error>{errors.passengers}</Error>}
        </DropdownContainer>
    );
};

export default function Locate({ onSearch }) {
    const [tripType, setTripType] = useState("oneway");
    const [origin, setOrigin] = useState({ code: "", display: "" });
    const [destination, setDestination] = useState({ code: "", display: "" });
    const [departDate, setDepartDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [infants, setInfants] = useState(0);
    const [travelClass, setTravelClass] = useState("ECONOMY");
    const [errors, setErrors] = useState({});
    const [isClassOpen, setIsClassOpen] = useState(false);
    const classDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (classDropdownRef.current && !classDropdownRef.current.contains(event.target)) {
                setIsClassOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const classOptions = {
        'ECONOMY': 'Economy Class',
        'PREMIUM_ECONOMY': 'Premium Economy',
        'BUSINESS': 'Business Class',
        'FIRST': 'First Class',
    };

    const validate = () => {
        const e = {};
        if (!origin.code || !/^[A-Za-z]{3}$/.test(origin.code)) e.origin = "Please choose an origin airport from the list";
        if (!destination.code || !/^[A-Za-z]{3}$/.test(destination.code)) e.destination = "Please choose a destination airport from the list";

        if (origin.code && destination.code && origin.code === destination.code) {
            e.destination = "Origin and destination cannot be the same.";
        }

        if (!departDate) e.departDate = "Choose a departure date";
        if (tripType === "roundtrip" && !returnDate) e.returnDate = "Choose a return date";
        if (adults + children === 0) e.passengers = "At least 1 adult or child is required.";
        if (infants > 0 && adults < infants) e.passengers = "Each infant must be accompanied by an adult.";

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSelectClass = (value) => {
        setTravelClass(value);
        setIsClassOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        // Helper function to format dates correctly to YYYY-MM-DD
        const formatDate = (dateString) => {
            if (!dateString) return undefined;
            const date = new Date(dateString);
            const year = date.getUTCFullYear(); // Use UTC to avoid timezone issues
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        onSearch?.({
            origin: origin.code.toUpperCase(),
            destination: destination.code.toUpperCase(),
            departDate: formatDate(departDate),
            returnDate: tripType === "roundtrip" ? formatDate(returnDate) : undefined,
            adults: Number(adults),
            children: Number(children),
            infants: Number(infants),
            travelClass: travelClass,
        });
    };

    return (
        <Form onSubmit={handleSubmit} noValidate>
            <Toggle role="tablist" aria-label="Trip type">
                <button type="button" className={tripType === "oneway" ? "active" : ""} onClick={() => setTripType("oneway")}>
                    One-way
                </button>
                <button type="button" className={tripType === "roundtrip" ? "active" : ""} onClick={() => setTripType("roundtrip")}>
                    Round trip
                </button>
            </Toggle>

            <FormGrid>
                <Field>
                    <LocationSelect
                        label="Origin"
                        placeholder="Try 'Houston' or 'HOU'"
                        value={origin}
                        onChange={setOrigin}
                        suggestCurrentLocation={true}
                    />
                    {errors.origin && <Error>{errors.origin}</Error>}
                </Field>
                <Field>
                    <LocationSelect
                        label="Destination"
                        placeholder="Try 'New York' or 'JFK'"
                        value={destination}
                        onChange={setDestination}
                    />
                    {errors.destination && <Error>{errors.destination}</Error>}
                </Field>
                <Field>
                    <label htmlFor="departDate">Depart</label>
                    <input id="departDate" type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} />
                    {errors.departDate && <Error>{errors.departDate}</Error>}
                </Field>
                <Field hidden={tripType === "oneway"}>
                    <label htmlFor="returnDate">Return</label>
                    <input id="returnDate" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                    {errors.returnDate && <Error>{errors.returnDate}</Error>}
                </Field>
                <Field>
                    <CustomSelectWrapper ref={classDropdownRef}>
                        <label>Class</label>
                        <div className="custom-select-header" onClick={() => setIsClassOpen(!isClassOpen)}>
                            {classOptions[travelClass]}
                            <span className={`arrow ${isClassOpen ? 'up' : 'down'}`}></span>
                        </div>
                        {isClassOpen && (
                            <div className="custom-select-options">
                                <div className="custom-select-title">Select class</div>
                                {Object.entries(classOptions).map(([value, label]) => (
                                    <div
                                        key={value}
                                        className={`custom-select-option ${travelClass === value ? 'selected' : ''}`}
                                        onClick={() => handleSelectClass(value)}
                                    >
                                        {label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CustomSelectWrapper>
                </Field>
                <Field>
                    <PassengerDropdown
                        adults={adults} setAdults={setAdults}
                        children={children} setChildren={setChildren}
                        infants={infants} setInfants={setInfants}
                        errors={errors}
                    />
                </Field>

                <Actions>
                    <button type="submit">Search Flights</button>
                </Actions>
            </FormGrid>
        </Form>
    );
}

/* --- Styles --- */
const DropdownContainer = styled.div`
    position: relative;
    display: grid;
    gap: .35rem;
    label { font-weight:700; color:#0b7285; }
`;
const DropdownButton = styled.button`
    border: 1px solid #e6edf5;
    border-radius: .65rem;
    padding: .6rem .75rem;
    font-size: 1rem;
    background: #fff;
    text-align: left;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    color: ${p => p.active ? '#0ea5e9' : '#333'};
    &:hover { border-color: #0ea5e9; }
    .arrow { font-size: 0.7rem; }
`;
const Panel = styled.div`
    position: absolute;
    top: 100%;
    right: 0;
    background: #fff;
    border: 1px solid #e6edf5;
    border-radius: .65rem;
    padding: 1rem;
    z-index: 50;
    box-shadow: 0 8px 20px rgba(2, 62, 138, 0.08);
    display: grid;
    gap: 1rem;
    min-width: 300px;
`;
const PassengerRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;
const Label = styled.div`
    display: flex;
    flex-direction: column;
    font-weight: 600;
`;
const AgeInfo = styled.span`
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 500;
`;
const Counter = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    span { font-size: 1.1rem; font-weight: 700; min-width: 20px; text-align: center; }
    button {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1px solid #cbd5e1;
        background: #fff;
        font-size: 1.2rem;
        cursor: pointer;
        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }
`;
const InfoIcon = styled.div`
    position: relative;
    color: #64748b;
    background-color: #f1f5f9;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    font-style: italic;
    cursor: pointer;
    margin-right: auto;
    margin-left: 0.5rem;
`;
const Tooltip = styled.div`
    position: absolute;
    top: 120%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #334155;
    color: #fff;
    padding: 0.5rem 0.8rem;
    border-radius: .5rem;
    font-size: 0.85rem;
    width: 250px;
    text-align: left;
    z-index: 60;
    font-style: normal;
`;
const Notice = styled.p`
    font-size: 0.85rem;
    color: #0b7285;
    text-align: center;
    margin: 0.5rem 0 0;
    padding-top: 0.5rem;
    border-top: 1px solid #e6edf5;
`;
const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: .9rem;
`;
const Toggle = styled.div`
    display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;
    button{
        background:#eef7ff; border:1px solid #dbeafe; color:#0b7285;
        padding:.45rem .85rem; border-radius:.6rem; font-weight:700; cursor:pointer;
    }
    button.active{ background:#0ea5e9; color:#fff; border-color:#0ea5e9; }
`;
const FormGrid = styled.div`
    display: grid;
    gap: 1.5rem .9rem;
    align-items: end;
    grid-template-columns: 1fr;
    @media (min-width: 768px) {
        grid-template-columns: 1fr 1fr;
    }
    @media (min-width: 1024px) {
        grid-template-columns: 1fr 1fr 1fr;
    }
`;
const CustomSelectWrapper = styled.div`
    position: relative;
    display: grid;
    gap: .35rem;
    .custom-select-header {
        border: 1px solid #e6edf5;
        border-radius: .65rem;
        padding: .6rem .75rem;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #fff;
    }
    .arrow {
        border: solid #333;
        border-width: 0 2px 2px 0;
        display: inline-block;
        padding: 3px;
        transform: rotate(45deg);
        -webkit-transform: rotate(45deg);
        transition: transform 0.2s ease;
    }
    .arrow.up {
        transform: rotate(-135deg);
        -webkit-transform: rotate(-135deg);
    }
    .custom-select-options {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        right: 0;
        background: #fff;
        border: 1px solid #e6edf5;
        border-radius: .65rem;
        z-index: 10;
        padding: 0.5rem;
        box-shadow: 0 8px 20px rgba(2, 62, 138, 0.08);
    }
    .custom-select-title {
        padding: 0.5rem 0.5rem 0.8rem;
        color: #64748b;
        font-weight: 500;
        border-bottom: 1px solid #f1f5f9;
        margin-bottom: 0.3rem;
        font-size: 0.9rem;
    }
    .custom-select-option {
        padding: 0.7rem 0.5rem;
        cursor: pointer;
        border-radius: .4rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 500;
        &:hover {
            background-color: #f6fbff;
        }
        &.selected {
            font-weight: 600;
            color: #0ea5e9;
            &::after {
                content: '✓';
                font-size: 1.2rem;
                color: #0ea5e9;
            }
        }
    }
`;
const Field = styled.div`
    display:grid; gap:.35rem;
    min-width: 160px;
    ${({ hidden }) => hidden && `display:none;`}
    label { font-weight:700; color:#0b7285; }
    input, select { border:1px solid #e6edf5; border-radius:.65rem; padding:.6rem .75rem; font-size:1rem; width: 100%; box-sizing: border-box; }
`;
const Actions = styled.div`
    display:flex;
    justify-content: flex-end;
    @media (min-width: 1024px) {
        grid-column: 3 / 4;
    }
    @media (min-width: 768px) and (max-width: 1023px) {
        grid-column: 2 / 3;
    }
    button {
        background:#0ea5e9;
        color:#fff;
        border:0;
        border-radius:.7rem;
        padding:.7rem 1.5rem;
        cursor:pointer;
        font-weight:700;
        font-size: 1rem;
        width: 100%;
        @media (min-width: 768px) {
            width: auto;
        }
    }
`;
const Error = styled.div`color:#c92a2a; font-size:.9rem; margin-top: .2rem;`;