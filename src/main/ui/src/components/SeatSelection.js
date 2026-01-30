import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Info, DollarSign, Check, X } from "lucide-react";
import ProgressIndicator from "./ProgressIndicator";

const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

export default function SeatSelection() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const travelers = state?.travelers || [];
    const formattedTravelers = state?.formattedTravelers || [];  // ← ADDED FOR AMADEUS API
    const contactDetails = state?.contactDetails || {};
    const flight = state?.flight;
    const flightDetails = state?.flightDetails || {};
    const passengerCounts = state?.passengerCounts || {};

    const [seatMap, setSeatMap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSeats, setSelectedSeats] = useState({});
    const [totalSeatPrice, setTotalSeatPrice] = useState(0);

    // Fetch seat map from Amadeus API
    useEffect(() => {
        fetchSeatMap();
    }, []);

    const fetchSeatMap = async () => {
        try {
            setLoading(true);
            setError("");

            // In production, call Amadeus Seat Map API
            // For demo, create mock seat map
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock seat map data
            const mockSeatMap = generateMockSeatMap();
            setSeatMap(mockSeatMap);

        } catch (err) {
            console.error("Failed to fetch seat map:", err);
            setError("Failed to load seat map. You can skip seat selection for now.");
            setSeatMap(generateMockSeatMap());
        } finally {
            setLoading(false);
        }
    };

    const generateMockSeatMap = () => {
        const rows = 30;
        const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
        const seats = [];

        for (let row = 1; row <= rows; row++) {
            for (let col of columns) {
                const seatNumber = `${row}${col}`;
                let type = 'STANDARD';
                let price = 0;
                let available = Math.random() > 0.3;

                if (row <= 3) {
                    type = 'PREMIUM';
                    price = 50;
                } else if (row === 12 || row === 13) {
                    type = 'EXIT_ROW';
                    price = 40;
                } else if (row >= 14 && row <= 20) {
                    type = 'PREFERRED';
                    price = 20;
                }

                const isWindow = col === 'A' || col === 'F';
                const isAisle = col === 'C' || col === 'D';

                seats.push({
                    number: seatNumber,
                    row: row,
                    column: col,
                    type: type,
                    price: price,
                    available: available,
                    isWindow: isWindow,
                    isAisle: isAisle,
                    hasRecline: row < 29,
                    hasPower: row <= 20,
                });
            }
        }

        return {
            aircraftType: "Boeing 787-9 Dreamliner",
            totalSeats: seats.length,
            seats: seats,
            layout: {
                columns: columns,
                rows: rows,
                aisles: [2, 3]
            }
        };
    };

    const handleSeatClick = (seat) => {
        if (!seat.available) return;

        const assignedTo = Object.entries(selectedSeats).find(([_, seatNum]) => seatNum === seat.number);

        if (assignedTo) {
            const newSelected = { ...selectedSeats };
            delete newSelected[assignedTo[0]];
            setSelectedSeats(newSelected);
            calculateTotalPrice(newSelected);
        } else {
            const nextPassenger = travelers.find((t, idx) => !selectedSeats[idx]);
            if (nextPassenger) {
                const passengerIndex = travelers.indexOf(nextPassenger);
                setSelectedSeats(prev => ({
                    ...prev,
                    [passengerIndex]: seat.number
                }));
                calculateTotalPrice({
                    ...selectedSeats,
                    [passengerIndex]: seat.number
                });
            }
        }
    };

    const calculateTotalPrice = (seats) => {
        let total = 0;
        Object.values(seats).forEach(seatNumber => {
            const seat = seatMap?.seats.find(s => s.number === seatNumber);
            if (seat) total += seat.price;
        });
        setTotalSeatPrice(total);
    };

    const clearSeatForPassenger = (passengerIndex) => {
        const newSelected = { ...selectedSeats };
        delete newSelected[passengerIndex];
        setSelectedSeats(newSelected);
        calculateTotalPrice(newSelected);
    };

    const handleContinue = () => {
        const seatAssignments = travelers.map((traveler, idx) => ({
            traveler: traveler,
            seat: selectedSeats[idx] || null,
            seatDetails: seatMap?.seats.find(s => s.number === selectedSeats[idx]) || null
        }));

        navigate("/addons", {
            state: {
                travelers: travelers,
                formattedTravelers: formattedTravelers,  // ← PASS FORMATTED DATA
                contactDetails: contactDetails,
                flight: flight,
                flightDetails: flightDetails,
                passengerCounts: passengerCounts,
                seatAssignments: seatAssignments,
                seatPrice: totalSeatPrice
            }
        });
    };

    const handleSkip = () => {
        const seatAssignments = travelers.map((traveler) => ({
            traveler: traveler,
            seat: null,
            seatDetails: null
        }));

        navigate("/addons", {
            state: {
                travelers: travelers,
                formattedTravelers: formattedTravelers,  // ← PASS FORMATTED DATA
                contactDetails: contactDetails,
                flight: flight,
                flightDetails: flightDetails,
                passengerCounts: passengerCounts,
                seatAssignments: seatAssignments,
                seatPrice: 0
            }
        });
    };

    const getSeatStatus = (seat) => {
        if (!seat.available) return 'occupied';
        const assignedTo = Object.entries(selectedSeats).find(([_, seatNum]) => seatNum === seat.number);
        if (assignedTo) return `selected-${assignedTo[0]}`;
        return 'available';
    };

    const getSeatColor = (passengerIndex) => {
        const colors = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
        return colors[passengerIndex % colors.length];
    };

    if (loading) {
        return (
            <PageContainer>
                <ProgressIndicator currentStep={4} totalSteps={7} />
                <LoadingContainer>
                    <Spinner />
                    <h2>Loading seat map...</h2>
                    <p>Please wait while we fetch available seats</p>
                </LoadingContainer>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <ProgressIndicator currentStep={4} totalSteps={7} />

            <ContentWrapper>
                <MainColumn>
                    <SeatMapCard>
                        <CardHeader>
                            <div>
                                <h1>💺 Select Your Seats</h1>
                                <FlightInfo>
                                    <span>{flightDetails.airlineName}</span>
                                    <span className="separator">•</span>
                                    <span>{seatMap?.aircraftType}</span>
                                </FlightInfo>
                            </div>
                        </CardHeader>

                        {error && (
                            <ErrorBanner>
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </ErrorBanner>
                        )}

                        <SeatLegend>
                            <LegendItem>
                                <LegendSeat status="available" />
                                <span>Available</span>
                            </LegendItem>
                            <LegendItem>
                                <LegendSeat status="occupied" />
                                <span>Occupied</span>
                            </LegendItem>
                            <LegendItem>
                                <LegendSeat status="selected" />
                                <span>Your Selection</span>
                            </LegendItem>
                            <LegendItem>
                                <LegendSeat status="premium" />
                                <span>Premium (+$50)</span>
                            </LegendItem>
                            <LegendItem>
                                <LegendSeat status="exit" />
                                <span>Exit Row (+$40)</span>
                            </LegendItem>
                            <LegendItem>
                                <LegendSeat status="preferred" />
                                <span>Preferred (+$20)</span>
                            </LegendItem>
                        </SeatLegend>

                        <SeatMapContainer>
                            <AircraftNose>
                                ✈️ Front of Aircraft
                            </AircraftNose>

                            <SeatsGrid>
                                <ColumnHeaders>
                                    <div></div>
                                    {seatMap?.layout.columns.map((col, idx) => (
                                        <React.Fragment key={col}>
                                            <ColumnHeader>{col}</ColumnHeader>
                                            {seatMap.layout.aisles.includes(idx) && <AisleSpace />}
                                        </React.Fragment>
                                    ))}
                                </ColumnHeaders>

                                {Array.from({ length: seatMap?.layout.rows || 0 }, (_, rowIndex) => {
                                    const rowNum = rowIndex + 1;
                                    const rowSeats = seatMap?.seats.filter(s => s.row === rowNum) || [];

                                    return (
                                        <SeatRow key={rowNum}>
                                            <RowNumber>{rowNum}</RowNumber>
                                            {seatMap?.layout.columns.map((col, colIdx) => {
                                                const seat = rowSeats.find(s => s.column === col);
                                                if (!seat) return <div key={col}></div>;

                                                const status = getSeatStatus(seat);
                                                const passengerIndex = status.startsWith('selected-')
                                                    ? parseInt(status.split('-')[1])
                                                    : null;

                                                return (
                                                    <React.Fragment key={col}>
                                                        <Seat
                                                            status={status.startsWith('selected-') ? 'selected' : status}
                                                            type={seat.type}
                                                            onClick={() => handleSeatClick(seat)}
                                                            color={passengerIndex !== null ? getSeatColor(passengerIndex) : null}
                                                            title={`${seat.number} - ${seat.type} - ${seat.available ? 'Available' : 'Occupied'} - $${seat.price}`}
                                                        >
                                                            {passengerIndex !== null ? (passengerIndex + 1) : ''}
                                                        </Seat>
                                                        {seatMap.layout.aisles.includes(colIdx) && <AisleSpace />}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </SeatRow>
                                    );
                                })}
                            </SeatsGrid>

                            <AircraftTail>
                                ← Back of Aircraft
                            </AircraftTail>
                        </SeatMapContainer>
                    </SeatMapCard>
                </MainColumn>

                <SidebarColumn>
                    <AssignmentsCard>
                        <CardHeader>
                            <h3>Seat Assignments</h3>
                        </CardHeader>

                        <AssignmentsList>
                            {travelers.map((traveler, idx) => {
                                const seatNumber = selectedSeats[idx];
                                const seatDetails = seatMap?.seats.find(s => s.number === seatNumber);

                                return (
                                    <Assignment key={idx}>
                                        <PassengerBadge color={getSeatColor(idx)}>
                                            {idx + 1}
                                        </PassengerBadge>
                                        <PassengerInfo>
                                            <strong>
                                                {traveler.firstName || `Passenger ${idx + 1}`} {traveler.lastName || ''}
                                            </strong>
                                            <span className="type">({traveler.typeLabel})</span>
                                        </PassengerInfo>
                                        {seatNumber ? (
                                            <SeatInfo>
                                                <SeatNumber>{seatNumber}</SeatNumber>
                                                <SeatFeatures>
                                                    {seatDetails?.isWindow && <Feature>Window</Feature>}
                                                    {seatDetails?.isAisle && <Feature>Aisle</Feature>}
                                                    {!seatDetails?.isWindow && !seatDetails?.isAisle && <Feature>Middle</Feature>}
                                                </SeatFeatures>
                                                {seatDetails?.price > 0 && (
                                                    <Price>+${seatDetails.price}</Price>
                                                )}
                                                <ClearButton onClick={() => clearSeatForPassenger(idx)}>
                                                    <X size={14} />
                                                </ClearButton>
                                            </SeatInfo>
                                        ) : (
                                            <NoSeat>No seat selected</NoSeat>
                                        )}
                                    </Assignment>
                                );
                            })}
                        </AssignmentsList>

                        <PriceSummary>
                            <div className="row">
                                <span>Seat upgrades:</span>
                                <strong>${totalSeatPrice.toFixed(2)}</strong>
                            </div>
                        </PriceSummary>
                    </AssignmentsCard>

                    <InfoCard>
                        <Info size={18} />
                        <div>
                            <strong>Seat Selection Tips</strong>
                            <ul>
                                <li>Window seats offer great views</li>
                                <li>Aisle seats have easier access</li>
                                <li>Exit rows have extra legroom</li>
                                <li>Front rows board/exit faster</li>
                            </ul>
                        </div>
                    </InfoCard>

                    <ActionButtons>
                        <SecondaryButton onClick={handleSkip}>
                            Skip for now
                        </SecondaryButton>
                        <PrimaryButton onClick={handleContinue}>
                            Continue to Add-ons
                        </PrimaryButton>
                    </ActionButtons>
                </SidebarColumn>
            </ContentWrapper>
        </PageContainer>
    );
}

/* Styled Components */

const PageContainer = styled.div`
    min-height: 100vh;
    background: #f8fafc;
`;

const LoadingContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 1rem;
    
    h2 {
        margin: 0;
        color: #0f172a;
    }
    
    p {
        margin: 0;
        color: #64748b;
    }
`;

const Spinner = styled.div`
    width: 50px;
    height: 50px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #7c3aed;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

const ContentWrapper = styled.div`
    max-width: 1600px;
    margin: 0 auto;
    padding: 2rem 1rem;
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 2rem;
    
    @media (max-width: 1200px) {
        grid-template-columns: 1fr;
    }
`;

const MainColumn = styled.div``;

const SidebarColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const SeatMapCard = styled.div`
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden;
`;

const CardHeader = styled.div`
    padding: 2rem;
    border-bottom: 2px solid #e2e8f0;
    
    h1 {
        margin: 0 0 0.5rem;
        color: #0f172a;
        font-size: 1.75rem;
    }
    
    h3 {
        margin: 0;
        color: #0f172a;
        font-size: 1.25rem;
    }
`;

const FlightInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #64748b;
    font-size: 0.95rem;
    
    .separator {
        color: #cbd5e1;
    }
`;

const ErrorBanner = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    background: #fef2f2;
    border-bottom: 1px solid #fecaca;
    color: #b91c1c;
    font-weight: 600;
`;

const SeatLegend = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
`;

const LegendItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #475569;
    font-weight: 500;
`;

const LegendSeat = styled.div`
    width: 24px;
    height: 24px;
    border-radius: 4px;
    
    ${p => {
    switch(p.status) {
        case 'available':
            return 'background: #e0e7ff; border: 2px solid #818cf8;';
        case 'occupied':
            return 'background: #e2e8f0; border: 2px solid #94a3b8;';
        case 'selected':
            return 'background: #7c3aed; border: 2px solid #6d28d9;';
        case 'premium':
            return 'background: #fef3c7; border: 2px solid #fbbf24;';
        case 'exit':
            return 'background: #dbeafe; border: 2px solid #3b82f6;';
        case 'preferred':
            return 'background: #dcfce7; border: 2px solid #4ade80;';
        default:
            return 'background: #e2e8f0;';
    }
}}
`;

const SeatMapContainer = styled.div`
    padding: 2rem;
    overflow-x: auto;
`;

const AircraftNose = styled.div`
    text-align: center;
    padding: 1rem;
    font-weight: 700;
    color: #64748b;
    border-bottom: 2px solid #e2e8f0;
    margin-bottom: 1rem;
`;

const AircraftTail = styled.div`
    text-align: center;
    padding: 1rem;
    font-weight: 700;
    color: #64748b;
    border-top: 2px solid #e2e8f0;
    margin-top: 1rem;
`;

const SeatsGrid = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: fit-content;
`;

const ColumnHeaders = styled.div`
    display: grid;
    grid-template-columns: 40px repeat(3, 40px) 20px repeat(3, 40px);
    gap: 4px;
    margin-bottom: 0.5rem;
`;

const ColumnHeader = styled.div`
    text-align: center;
    font-weight: 700;
    color: #64748b;
    font-size: 0.85rem;
`;

const RowNumber = styled.div`
    width: 40px;
    text-align: center;
    font-weight: 700;
    color: #64748b;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const SeatRow = styled.div`
    display: grid;
    grid-template-columns: 40px repeat(3, 40px) 20px repeat(3, 40px);
    gap: 4px;
`;

const AisleSpace = styled.div`
    width: 20px;
`;

const Seat = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: ${p => p.status === 'occupied' ? 'not-allowed' : 'pointer'};
    transition: all 0.2s;
    
    ${p => {
    if (p.status === 'selected') {
        return `
                background: ${p.color || '#7c3aed'};
                color: white;
                border: 2px solid ${p.color || '#6d28d9'};
                transform: scale(1.1);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            `;
    } else if (p.status === 'occupied') {
        return `
                background: #e2e8f0;
                border: 2px solid #94a3b8;
                color: #94a3b8;
            `;
    } else {
        if (p.type === 'PREMIUM') {
            return `
                    background: #fef3c7;
                    border: 2px solid #fbbf24;
                    color: #92400e;
                    &:hover { transform: scale(1.05); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                `;
        } else if (p.type === 'EXIT_ROW') {
            return `
                    background: #dbeafe;
                    border: 2px solid #3b82f6;
                    color: #1e40af;
                    &:hover { transform: scale(1.05); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                `;
        } else if (p.type === 'PREFERRED') {
            return `
                    background: #dcfce7;
                    border: 2px solid #4ade80;
                    color: #166534;
                    &:hover { transform: scale(1.05); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                `;
        } else {
            return `
                    background: #e0e7ff;
                    border: 2px solid #818cf8;
                    color: #3730a3;
                    &:hover { transform: scale(1.05); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                `;
        }
    }
}}
`;

const AssignmentsCard = styled.div`
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden;
`;

const AssignmentsList = styled.div`
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const Assignment = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
`;

const PassengerBadge = styled.div`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: ${p => p.color};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
`;

const PassengerInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    strong {
        color: #0f172a;
        font-size: 0.95rem;
    }
    
    .type {
        color: #64748b;
        font-size: 0.85rem;
    }
`;

const SeatInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
`;

const SeatNumber = styled.div`
    padding: 0.25rem 0.75rem;
    background: #7c3aed;
    color: white;
    border-radius: 0.375rem;
    font-weight: 700;
    font-size: 0.9rem;
`;

const SeatFeatures = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
`;

const Feature = styled.span`
    font-size: 0.75rem;
    color: #64748b;
`;

const Price = styled.span`
    color: #059669;
    font-weight: 700;
    font-size: 0.9rem;
`;

const ClearButton = styled.button`
    padding: 0.25rem;
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    
    &:hover {
        background: #f1f5f9;
        color: #ef4444;
    }
`;

const NoSeat = styled.span`
    color: #94a3b8;
    font-size: 0.9rem;
    font-style: italic;
`;

const PriceSummary = styled.div`
    padding: 1rem;
    border-top: 2px solid #e2e8f0;
    background: #f8fafc;
    
    .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        span {
            color: #64748b;
            font-weight: 500;
        }
        
        strong {
            color: #0f172a;
            font-size: 1.25rem;
        }
    }
`;

const InfoCard = styled.div`
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    gap: 0.75rem;
    
    svg {
        flex-shrink: 0;
        color: #1e40af;
        margin-top: 2px;
    }
    
    strong {
        display: block;
        color: #1e3a8a;
        margin-bottom: 0.5rem;
    }
    
    ul {
        margin: 0;
        padding-left: 1.25rem;
        color: #1e40af;
        
        li {
            margin-bottom: 0.25rem;
            font-size: 0.85rem;
        }
    }
`;

const ActionButtons = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
`;

const SecondaryButton = styled.button`
    padding: 0.875rem 2rem;
    border: 2px solid #cbd5e1;
    background: white;
    color: #475569;
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
        background: #f8fafc;
        border-color: #94a3b8;
    }
`;

const PrimaryButton = styled.button`
    padding: 0.875rem 2rem;
    border: none;
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    color: white;
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 20px rgba(124, 58, 237, 0.3);
    }
`;

