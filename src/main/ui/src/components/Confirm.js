import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Plane,
    Luggage,
    Utensils,
    Armchair,
    Clock,
    Calendar,
    AlertCircle,
    CheckCircle,
    Info,
    ChevronRight,
    MapPin,
    Wifi,
    Monitor,
    RefreshCw
} from "lucide-react";

const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

// Enhanced formatting utilities
const formatTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatDuration = (iso) => {
    if (!iso) return "—";
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return iso;
    const hours = match[1] ? `${parseInt(match[1], 10)}h` : "";
    const minutes = match[2] ? `${parseInt(match[2], 10)}m` : "";
    return `${hours} ${minutes}`.trim() || "—";
};

const formatMoney = (value, currency = "USD") => {
    const num = Number(value || 0);
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    } catch {
        return `$${num.toFixed(2)}`;
    }
};

const formatCabin = (cabin) => {
    const cabinMap = {
        'ECONOMY': 'Economy',
        'PREMIUM_ECONOMY': 'Premium Economy',
        'BUSINESS': 'Business Class',
        'FIRST': 'First Class'
    };
    return cabinMap[cabin?.toUpperCase()] || cabin || 'Economy';
};

// Helper function to get tax descriptions
const getTaxDescription = (code) => {
    const taxDescriptions = {
        'US': 'US Transportation Tax',
        'XF': 'Passenger Facility Charge',
        'AY': 'September 11th Security Fee',
        'XY': 'US Customs Fee',
        'YC': 'Customs Fee',
        'XA': 'Airport Security Fee',
        'YQ': 'Carrier Surcharge',
        'YR': 'Fuel Surcharge',
        'GB': 'UK Air Passenger Duty',
        'UB': 'International Departure Tax'
    };
    return taxDescriptions[code] || `Tax (${code})`;
};

// Helper function to get fee descriptions
const getFeeDescription = (type) => {
    const feeDescriptions = {
        'SUPPLIER': 'Airline Service Fee',
        'TICKETING': 'Ticketing Fee',
        'FORM_OF_PAYMENT': 'Payment Processing Fee',
        'BOOKING': 'Booking Fee'
    };
    return feeDescriptions[type] || 'Service Fee';
};

// Calculate approximate distance between segments
const calculateDistance = (segments) => {
    // Approximate coordinates for major airports (in a real app, fetch from API)
    // rough estimate based on flight duration
    if (!segments || segments.length === 0) return 0;

    let totalDistance = 0;
    segments.forEach(seg => {
        if (seg.duration) {
            // Rough estimate: average speed 800 km/h
            const durationMatch = seg.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
            if (durationMatch) {
                const hours = parseInt(durationMatch[1] || 0, 10);
                const minutes = parseInt(durationMatch[2] || 0, 10);
                const totalHours = hours + (minutes / 60);
                totalDistance += totalHours * 800; // km
            }
        }
    });

    return Math.round(totalDistance);
};

// Extract comprehensive flight details
function extractFlightDetails({ offer, priced, airportDetails = {} }) {
    const source = priced?.data?.flightOffers?.[0] || offer || {};
    const itinerary = source?.itineraries?.[0];
    const segments = itinerary?.segments || [];
    const firstSegment = segments[0] || {};
    const lastSegment = segments[segments.length - 1] || {};

    // Basic route info
    const originCode = firstSegment?.departure?.iataCode || "—";
    const destCode = lastSegment?.arrival?.iataCode || "—";

    // Get airport details for origin and destination
    const originAirport = airportDetails[originCode] || {};
    const destAirport = airportDetails[destCode] || {};

    const originCity = originAirport.cityName || originCode;
    const originCountry = originAirport.countryCode || "";
    const originAirportName = originAirport.airportName || "";

    const destCity = destAirport.cityName || destCode;
    const destCountry = destAirport.countryCode || "";
    const destAirportName = destAirport.airportName || "";

    const departureTime = formatTime(firstSegment?.departure?.at);
    const arrivalTime = formatTime(lastSegment?.arrival?.at);
    const departureDate = formatDate(firstSegment?.departure?.at);
    const arrivalDate = formatDate(lastSegment?.arrival?.at);

    // Price breakdown
    const priceData = source?.price || {};
    const totalPrice = priceData?.total;
    const currency = priceData?.currency || "USD";
    const basePrice = priceData?.base;
    const fees = priceData?.fees || [];
    const taxes = priceData?.taxes || [];

    // Traveler pricing details
    const travelerPricings = source?.travelerPricings || [];
    const fareDetails = travelerPricings[0]?.fareDetailsBySegment?.[0] || {};
    const cabin = fareDetails?.cabin || "ECONOMY";

    // Baggage allowance
    let checkedBags = "Not included";
    const baggageAllowance = fareDetails?.includedCheckedBags;
    if (baggageAllowance?.quantity != null) {
        const qty = baggageAllowance.quantity;
        checkedBags = qty === 0 ? "Not included" : `${qty} checked bag${qty !== 1 ? 's' : ''}`;
    } else if (baggageAllowance?.weight != null) {
        checkedBags = `${baggageAllowance.weight}${baggageAllowance.weightUnit || 'kg'}`;
    }

    // Carry-on baggage
    let carryOn = "1 personal item";
    const carryOnBags = fareDetails?.includedCarryOnBags;
    if (carryOnBags?.quantity != null) {
        carryOn = `${carryOnBags.quantity} carry-on bag${carryOnBags.quantity !== 1 ? 's' : ''}`;
    }

    // Aircraft information
    const dictionaries = priced?.dictionaries || {};
    const aircraftDict = dictionaries?.aircraft || {};
    const aircraft = segments.map(seg => {
        const code = seg?.aircraft?.code || "";
        const name = aircraftDict[code] || "";
        return { code, name: name || `Aircraft ${code}` };
    });

    // Airline information
    const carrierCode = firstSegment?.carrierCode;
    const flightNumber = firstSegment?.number;
    const airlinesDict = dictionaries?.carriers || {};
    const airlineName = airlinesDict[carrierCode] || carrierCode;

    // Layover/stop information with detailed info
    const layovers = [];
    for (let i = 0; i < segments.length - 1; i++) {
        const current = segments[i];
        const next = segments[i + 1];
        const layoverAirport = current.arrival?.iataCode;
        const arrivalTime = new Date(current.arrival?.at);
        const departureTime = new Date(next.departure?.at);
        const durationMs = departureTime - arrivalTime;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

        // Determine if it's a short, comfortable, or long layover
        const totalMinutes = Math.floor(durationMs / (1000 * 60));
        let layoverStatus = 'comfortable';
        let statusColor = 'green';
        if (totalMinutes < 90) {
            layoverStatus = 'tight';
            statusColor = 'red';
        } else if (totalMinutes > 240) {
            layoverStatus = 'long';
            statusColor = 'amber';
        }

        // Check for terminal change (if available in data)
        const arrivalTerminal = current.arrival?.terminal;
        const departureTerminal = next.departure?.terminal;
        const terminalChange = arrivalTerminal && departureTerminal && arrivalTerminal !== departureTerminal;

        // Get full airline names for each segment
        const arrivalCarrier = airlinesDict[current.carrierCode] || current.carrierCode;
        const departureCarrier = airlinesDict[next.carrierCode] || next.carrierCode;

        layovers.push({
            airport: layoverAirport,
            arrivalTime: formatTime(current.arrival?.at),
            departureTime: formatTime(next.departure?.at),
            arrivalDate: formatDate(current.arrival?.at),
            departureDate: formatDate(next.departure?.at),
            duration: `${hours}h ${minutes}m`,
            totalMinutes,
            layoverStatus,
            statusColor,
            arrivalTerminal,
            departureTerminal,
            terminalChange,
            arrivalFlight: `${current.carrierCode} ${current.number}`,
            departureFlight: `${next.carrierCode} ${next.number}`,
            arrivalCarrier,
            departureCarrier
        });
    }

    // Fare conditions
    const fareConditions = {
        refundable: travelerPricings[0]?.fareOption === "REFUNDABLE",
        changeable: fareDetails?.isChangeable || false,
        bookingClass: fareDetails?.class || "—",
        fareBasis: fareDetails?.fareBasis || "—"
    };

    // Amenities - extract and categorize
    const rawAmenities = fareDetails?.amenities || [];
    const amenities = {
        wifi: rawAmenities.find(a => a.amenityType === 'WIFI' || a.description?.toLowerCase().includes('wifi')),
        entertainment: rawAmenities.find(a => a.amenityType === 'ENTERTAINMENT' || a.description?.toLowerCase().includes('entertainment')),
        power: rawAmenities.find(a => a.amenityType === 'POWER' || a.description?.toLowerCase().includes('power') || a.description?.toLowerCase().includes('usb')),
        meal: rawAmenities.find(a => a.amenityType === 'MEAL' || a.description?.toLowerCase().includes('meal')),
        all: rawAmenities
    };

    // CO2 Emissions calculation (estimate based on distance and cabin)
    // Formula: distance (km) * cabin multiplier * emission factor
    const estimatedDistance = calculateDistance(segments);
    const cabinMultiplier = cabin === 'BUSINESS' || cabin === 'FIRST' ? 2.0 : cabin === 'PREMIUM_ECONOMY' ? 1.5 : 1.0;
    const co2Emissions = Math.round((estimatedDistance * 0.115 * cabinMultiplier)); // kg CO2
    const carbonOffsetCost = (co2Emissions * 0.04).toFixed(2); // $0.04 per kg estimate

    // Detailed segment information
    const detailedSegments = segments.map((seg, idx) => {
        const segCarrierCode = seg.carrierCode;
        const segOperatingCarrier = seg.operating?.carrierCode || segCarrierCode;
        const isCodeshare = segCarrierCode !== segOperatingCarrier;

        const segDepCode = seg.departure?.iataCode;
        const segArrCode = seg.arrival?.iataCode;
        const segDepAirport = airportDetails[segDepCode] || {};
        const segArrAirport = airportDetails[segArrCode] || {};

        return {
            index: idx + 1,
            departureCode: segDepCode,
            arrivalCode: segArrCode,
            departureCity: segDepAirport.cityName || segDepCode,
            departureCountry: segDepAirport.countryCode || "",
            departureAirportName: segDepAirport.airportName || "",
            arrivalCity: segArrAirport.cityName || segArrCode,
            arrivalCountry: segArrAirport.countryCode || "",
            arrivalAirportName: segArrAirport.airportName || "",
            departureTime: formatTime(seg.departure?.at),
            arrivalTime: formatTime(seg.arrival?.at),
            departureDate: formatDate(seg.departure?.at),
            arrivalDate: formatDate(seg.arrival?.at),
            departureTerminal: seg.departure?.terminal,
            arrivalTerminal: seg.arrival?.terminal,
            duration: formatDuration(seg.duration),
            carrierCode: segCarrierCode,
            carrierName: airlinesDict[segCarrierCode] || segCarrierCode,
            operatingCarrier: segOperatingCarrier,
            operatingCarrierName: airlinesDict[segOperatingCarrier] || segOperatingCarrier,
            isCodeshare,
            flightNumber: `${segCarrierCode} ${seg.number}`,
            aircraftCode: seg.aircraft?.code,
            aircraftName: aircraftDict[seg.aircraft?.code] || seg.aircraft?.code,
            numberOfStops: seg.numberOfStops || 0,
            blacklistedInEU: seg.blacklistedInEU || false
        };
    });

    // Tax breakdown with descriptions
    const taxBreakdown = taxes.map(tax => ({
        code: tax.code,
        amount: formatMoney(tax.amount, currency),
        description: getTaxDescription(tax.code)
    }));

    // Fee breakdown with descriptions
    const feeBreakdown = fees.map(fee => ({
        type: fee.type,
        amount: formatMoney(fee.amount, currency),
        description: getFeeDescription(fee.type)
    }));

    return {
        // Route with location details
        originCode,
        destCode,
        originCity,
        originCountry,
        originAirportName,
        destCity,
        destCountry,
        destAirportName,
        departureTime,
        arrivalTime,
        departureDate,
        arrivalDate,
        duration: formatDuration(itinerary?.duration),
        numberOfStops: segments.length - 1,

        // Price
        totalPrice: formatMoney(totalPrice, currency),
        basePrice: formatMoney(basePrice, currency),
        currency,
        fees,
        taxes,
        taxBreakdown,
        feeBreakdown,

        // Flight details
        cabin: formatCabin(cabin),
        checkedBags,
        carryOn,
        aircraft,
        airlineName,
        carrierCode,
        flightNumber,
        layovers,
        fareConditions,
        amenities,

        // Environmental
        co2Emissions,
        carbonOffsetCost,
        estimatedDistance,

        // Detailed segments
        detailedSegments,

        // Segments for detailed view
        segments
    };
}

export default function Confirm() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const offer = state?.offer;
    const searchResults = state?.searchResults || [];
    const lastQuery = state?.lastQuery;

    const [loading, setLoading] = useState(true);
    const [priced, setPriced] = useState(null);
    const [error, setError] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
    const [showSegmentDetails, setShowSegmentDetails] = useState(false);
    const [airportDetails, setAirportDetails] = useState({});

    // Fetch airport details for city and country names
    useEffect(() => {
        async function fetchAirportDetails() {
            if (!offer) return;

            try {
                // Extract all airport codes from the offer
                const segments = offer?.itineraries?.[0]?.segments || [];
                const codes = new Set();

                segments.forEach(seg => {
                    if (seg?.departure?.iataCode) codes.add(seg.departure.iataCode);
                    if (seg?.arrival?.iataCode) codes.add(seg.arrival.iataCode);
                });

                if (codes.size === 0) return;

                // Fetch airport details from backend
                const response = await fetch(`${BASE}/api/airports?codes=${Array.from(codes).join(',')}`);
                if (!response.ok) throw new Error('Failed to fetch airport details');

                const data = await response.json();
                setAirportDetails(data);
            } catch (err) {
                console.warn('Failed to fetch airport details:', err);
                setAirportDetails({});
            }
        }

        fetchAirportDetails();
    }, [offer]);

    // Fetch live pricing with retry logic
    useEffect(() => {
        let abort = false;

        async function fetchPricing() {
            if (!offer) {
                setError("No flight selected.");
                setLoading(false);
                return;
            }

            try {
                setError("");
                setLoading(true);

                const response = await fetch(`${BASE}/api/flights/confirm`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(offer),
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch pricing: ${response.statusText}`);
                }

                const data = await response.json();

                if (!abort) {
                    setPriced(data);
                    setError("");
                }
            } catch (err) {
                console.warn("Pricing request failed:", err);
                if (!abort) {
                    // Still allow continuation with original offer data
                    setPriced(null);
                    setError("Unable to fetch live pricing. Showing estimated price from search.");
                }
            } finally {
                if (!abort) {
                    setLoading(false);
                }
            }
        }

        fetchPricing();
        return () => { abort = true; };
    }, [offer, retryCount]);

    const details = useMemo(() =>
            extractFlightDetails({ offer, priced, airportDetails }),
        [offer, priced, airportDetails]
    );

    const handleBackToSearch = () => {
        // Navigate back to booking with search results preserved
        navigate("/booking", {
            state: {
                searchResults: searchResults,
                lastQuery: lastQuery,
                preserveResults: true
            }
        });
    };

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
    };

    const handleContinue = () => {
        navigate("/order", {
            state: {
                flight: priced || offer,
                flightDetails: details,
                passengerCounts: {
                    adults: lastQuery?.adults || 1,
                    children: lastQuery?.children || 0,
                    infants: lastQuery?.infants || 0
                }
            }
        });
    };

    // Empty state
    if (!offer) {
        return (
            <Shell>
                <Panel>
                    <ErrorState>
                        <AlertCircle size={48} />
                        <h2>No Flight Selected</h2>
                        <p>Please select a flight from the search results to continue.</p>
                        <button onClick={handleBackToSearch}>
                            Back to Search
                        </button>
                    </ErrorState>
                </Panel>
            </Shell>
        );
    }

    return (
        <Shell>
            <Panel>
                {/* Header */}
                <Header>
                    <div>
                        <h1>Review Your Flight</h1>
                        <Breadcrumb>
                            <span>Search</span>
                            <ChevronRight size={16} />
                            <span className="active">Review</span>
                            <ChevronRight size={16} />
                            <span>Traveler Info</span>
                            <ChevronRight size={16} />
                            <span>Payment</span>
                        </Breadcrumb>
                    </div>
                </Header>

                {/* Loading State */}
                {loading && (
                    <StatusBanner>
                        <RefreshCw size={20} className="spinning" />
                        <span>Fetching live price and availability...</span>
                    </StatusBanner>
                )}

                {/* Error State with Retry */}
                {!loading && error && (
                    <StatusBanner warning>
                        <Info size={20} />
                        <span>{error}</span>
                        <RetryButton onClick={handleRetry}>
                            <RefreshCw size={16} />
                            Retry
                        </RetryButton>
                    </StatusBanner>
                )}

                {/* Success State */}
                {!loading && !error && priced && (
                    <StatusBanner success>
                        <CheckCircle size={20} />
                        <span>Price confirmed and seats available!</span>
                    </StatusBanner>
                )}

                {/* Main Flight Summary */}
                <FlightSummary>
                    <RouteInfo>
                        <RouteHeader>
                            <div>
                                <RouteTitle>
                                    <h2>{details.originCity}, {details.originCountry} → {details.destCity}, {details.destCountry}</h2>
                                    <AirportCodes>{details.originCode} → {details.destCode}</AirportCodes>
                                </RouteTitle>
                                <FlightMeta>
                                    <AirlineDisplay>
                                        <Plane size={16} />
                                        <strong>{details.airlineName}</strong>
                                    </AirlineDisplay>
                                    <span className="separator">•</span>
                                    <span>Flight {details.carrierCode} {details.flightNumber}</span>
                                </FlightMeta>
                            </div>
                            <PriceDisplay>
                                <PriceLabel>Total Price</PriceLabel>
                                <Price>{details.totalPrice}</Price>
                                <PriceAction onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}>
                                    {showPriceBreakdown ? 'Hide' : 'Show'} breakdown
                                </PriceAction>
                            </PriceDisplay>
                        </RouteHeader>

                        {/* Price Breakdown */}
                        {showPriceBreakdown && (
                            <PriceBreakdown>
                                <BreakdownRow>
                                    <span>Base fare</span>
                                    <span>{details.basePrice}</span>
                                </BreakdownRow>

                                {/* Taxes with descriptions */}
                                {details.taxBreakdown && details.taxBreakdown.length > 0 && (
                                    <>
                                        <BreakdownDivider>Taxes & Fees</BreakdownDivider>
                                        {details.taxBreakdown.map((tax, idx) => (
                                            <BreakdownRow key={`tax-${idx}`} className="sub">
                                                <span>
                                                    {tax.description}
                                                    <code className="tax-code">{tax.code}</code>
                                                </span>
                                                <span>{tax.amount}</span>
                                            </BreakdownRow>
                                        ))}
                                    </>
                                )}

                                {/* Fees with descriptions */}
                                {details.feeBreakdown && details.feeBreakdown.length > 0 && (
                                    <>
                                        {details.taxBreakdown?.length === 0 && (
                                            <BreakdownDivider>Fees</BreakdownDivider>
                                        )}
                                        {details.feeBreakdown.map((fee, idx) => (
                                            <BreakdownRow key={`fee-${idx}`} className="sub">
                                                <span>{fee.description}</span>
                                                <span>{fee.amount}</span>
                                            </BreakdownRow>
                                        ))}
                                    </>
                                )}

                                <BreakdownRow className="total">
                                    <strong>Total</strong>
                                    <strong>{details.totalPrice}</strong>
                                </BreakdownRow>
                            </PriceBreakdown>
                        )}

                        {/* Journey Timeline */}
                        <Timeline>
                            <TimelineItem>
                                <TimelineDot departure />
                                <TimelineContent>
                                    <TimelineTime>{details.departureTime}</TimelineTime>
                                    <TimelineDate>{details.departureDate}</TimelineDate>
                                    <TimelineLocation>
                                        <MapPin size={14} />
                                        <div>
                                            <strong>{details.originCode}</strong>
                                            <span className="airport-name">{details.originAirportName}</span>
                                            <span className="city-country">{details.originCity}, {details.originCountry}</span>
                                        </div>
                                    </TimelineLocation>
                                </TimelineContent>
                            </TimelineItem>

                            <TimelineDuration>
                                <Clock size={14} />
                                {details.duration}
                                {details.numberOfStops > 0 && (
                                    <span className="stops">
                                        • {details.numberOfStops} stop{details.numberOfStops > 1 ? 's' : ''}
                                    </span>
                                )}
                            </TimelineDuration>

                            <TimelineItem>
                                <TimelineDot arrival />
                                <TimelineContent>
                                    <TimelineTime>{details.arrivalTime}</TimelineTime>
                                    <TimelineDate>{details.arrivalDate}</TimelineDate>
                                    <TimelineLocation>
                                        <MapPin size={14} />
                                        <div>
                                            <strong>{details.destCode}</strong>
                                            <span className="airport-name">{details.destAirportName}</span>
                                            <span className="city-country">{details.destCity}, {details.destCountry}</span>
                                        </div>
                                    </TimelineLocation>
                                </TimelineContent>
                            </TimelineItem>
                        </Timeline>
                    </RouteInfo>
                </FlightSummary>

                {/* Layover Information */}
                {details.layovers.length > 0 && (
                    <Section>
                        <SectionHeader>
                            <AlertCircle size={20} />
                            <h3>Layover Information</h3>
                        </SectionHeader>
                        <LayoverGrid>
                            {details.layovers.map((layover, idx) => (
                                <LayoverCard key={idx} status={layover.statusColor}>
                                    <LayoverHeader>
                                        <LayoverAirport>{layover.airport}</LayoverAirport>
                                        <LayoverBadge status={layover.statusColor}>
                                            {layover.layoverStatus === 'tight' && '⚠️ Tight Connection'}
                                            {layover.layoverStatus === 'comfortable' && '✓ Comfortable'}
                                            {layover.layoverStatus === 'long' && '⏰ Extended Layover'}
                                        </LayoverBadge>
                                    </LayoverHeader>

                                    <LayoverDuration status={layover.statusColor}>
                                        <Clock size={18} />
                                        <strong>{layover.duration}</strong>
                                        <span>({layover.totalMinutes} minutes)</span>
                                    </LayoverDuration>

                                    <LayoverTimeline>
                                        <LayoverTimelineItem>
                                            <LayoverFlightBadge>
                                                <Plane size={14} />
                                                {layover.arrivalFlight}
                                            </LayoverFlightBadge>
                                            <div>
                                                <LayoverLabel>Arrival</LayoverLabel>
                                                <LayoverTime>{layover.arrivalTime}</LayoverTime>
                                                <LayoverDate>{layover.arrivalDate}</LayoverDate>
                                                {layover.arrivalTerminal && (
                                                    <LayoverTerminal>Terminal {layover.arrivalTerminal}</LayoverTerminal>
                                                )}
                                                <LayoverAirline>{layover.arrivalCarrier}</LayoverAirline>
                                            </div>
                                        </LayoverTimelineItem>

                                        {layover.terminalChange && (
                                            <TerminalChangeNotice>
                                                <AlertCircle size={16} />
                                                <strong>Terminal Change Required</strong>
                                                <span>Allow extra time for transfer</span>
                                            </TerminalChangeNotice>
                                        )}

                                        <LayoverTimelineItem>
                                            <LayoverFlightBadge>
                                                <Plane size={14} />
                                                {layover.departureFlight}
                                            </LayoverFlightBadge>
                                            <div>
                                                <LayoverLabel>Departure</LayoverLabel>
                                                <LayoverTime>{layover.departureTime}</LayoverTime>
                                                <LayoverDate>{layover.departureDate}</LayoverDate>
                                                {layover.departureTerminal && (
                                                    <LayoverTerminal>Terminal {layover.departureTerminal}</LayoverTerminal>
                                                )}
                                                <LayoverAirline>{layover.departureCarrier}</LayoverAirline>
                                            </div>
                                        </LayoverTimelineItem>
                                    </LayoverTimeline>

                                    <LayoverTips status={layover.layoverStatus}>
                                        <Info size={14} />
                                        <div>
                                            {layover.layoverStatus === 'tight' && (
                                                <>
                                                    <strong>Tips for tight connection:</strong>
                                                    <ul>
                                                        <li>Proceed directly to your next gate</li>
                                                        <li>Check gate assignments immediately upon arrival</li>
                                                        <li>Consider seat selection near the front for faster exit</li>
                                                    </ul>
                                                </>
                                            )}
                                            {layover.layoverStatus === 'comfortable' && (
                                                <>
                                                    <strong>You have time to:</strong>
                                                    <ul>
                                                        <li>Use restrooms and grab refreshments</li>
                                                        <li>Browse airport shops</li>
                                                        <li>Relax in the gate area</li>
                                                    </ul>
                                                </>
                                            )}
                                            {layover.layoverStatus === 'long' && (
                                                <>
                                                    <strong>Extended layover - Consider:</strong>
                                                    <ul>
                                                        <li>Visit airport lounges if available</li>
                                                        <li>Explore dining options</li>
                                                        <li>Find rest areas or sleep pods</li>
                                                        {layover.totalMinutes > 360 && <li>Check if you can leave the airport to explore the city</li>}
                                                    </ul>
                                                </>
                                            )}
                                        </div>
                                    </LayoverTips>
                                </LayoverCard>
                            ))}
                        </LayoverGrid>
                    </Section>
                )}

                {/* Inclusions & Amenities */}
                <Section>
                    <SectionHeader>
                        <CheckCircle size={20} />
                        <h3>What's Included</h3>
                    </SectionHeader>
                    <InclusionsGrid>
                        <InclusionCard>
                            <InclusionIcon>
                                <Luggage size={24} />
                            </InclusionIcon>
                            <InclusionContent>
                                <InclusionTitle>Checked Baggage</InclusionTitle>
                                <InclusionValue>{details.checkedBags}</InclusionValue>
                            </InclusionContent>
                        </InclusionCard>

                        <InclusionCard>
                            <InclusionIcon>
                                <Luggage size={24} />
                            </InclusionIcon>
                            <InclusionContent>
                                <InclusionTitle>Carry-on</InclusionTitle>
                                <InclusionValue>{details.carryOn}</InclusionValue>
                            </InclusionContent>
                        </InclusionCard>

                        <InclusionCard>
                            <InclusionIcon>
                                <Armchair size={24} />
                            </InclusionIcon>
                            <InclusionContent>
                                <InclusionTitle>Cabin Class</InclusionTitle>
                                <InclusionValue>{details.cabin}</InclusionValue>
                            </InclusionContent>
                        </InclusionCard>

                        <InclusionCard>
                            <InclusionIcon>
                                <Utensils size={24} />
                            </InclusionIcon>
                            <InclusionContent>
                                <InclusionTitle>Meal Service</InclusionTitle>
                                <InclusionValue>Varies by route</InclusionValue>
                            </InclusionContent>
                        </InclusionCard>
                    </InclusionsGrid>

                    {/* Amenities Icons Row */}
                    {(details.amenities?.wifi || details.amenities?.entertainment || details.amenities?.power) && (
                        <AmenitiesRow>
                            <AmenitiesLabel>In-Flight Amenities:</AmenitiesLabel>
                            {details.amenities.wifi && (
                                <AmenityBadge isChargeable={details.amenities.wifi.isChargeable}>
                                    <Wifi size={18} />
                                    <span>WiFi</span>
                                    {details.amenities.wifi.isChargeable && <span className="charge">Paid</span>}
                                </AmenityBadge>
                            )}
                            {details.amenities.entertainment && (
                                <AmenityBadge isChargeable={details.amenities.entertainment.isChargeable}>
                                    <Monitor size={18} />
                                    <span>Entertainment</span>
                                    {details.amenities.entertainment.isChargeable && <span className="charge">Paid</span>}
                                </AmenityBadge>
                            )}
                            {details.amenities.power && (
                                <AmenityBadge isChargeable={details.amenities.power.isChargeable}>
                                    <span className="power-icon">⚡</span>
                                    <span>Power Outlet</span>
                                    {details.amenities.power.isChargeable && <span className="charge">Paid</span>}
                                </AmenityBadge>
                            )}
                        </AmenitiesRow>
                    )}
                </Section>

                {/* CO2 Emissions Section */}
                <Section>
                    <SectionHeader>
                        <span style={{ fontSize: '20px' }}>🌱</span>
                        <h3>Environmental Impact</h3>
                    </SectionHeader>
                    <EmissionsCard>
                        <EmissionsMain>
                            <EmissionsIcon>
                                <span className="co2">CO₂</span>
                            </EmissionsIcon>
                            <EmissionsContent>
                                <EmissionsValue>{details.co2Emissions} kg</EmissionsValue>
                                <EmissionsLabel>CO₂ emissions per passenger</EmissionsLabel>
                                <EmissionsSubtext>
                                    Based on {details.estimatedDistance.toLocaleString()} km flight distance
                                </EmissionsSubtext>
                            </EmissionsContent>
                        </EmissionsMain>
                        <EmissionsOffset>
                            <OffsetInfo>
                                <Info size={16} />
                                <div>
                                    <strong>Offset your carbon footprint</strong>
                                    <p>Support verified carbon reduction projects for just ${details.carbonOffsetCost}</p>
                                </div>
                            </OffsetInfo>
                            <OffsetButton>
                                <CheckCircle size={16} />
                                Add Carbon Offset
                            </OffsetButton>
                        </EmissionsOffset>
                    </EmissionsCard>
                </Section>

                {/* Aircraft & Flight Details */}
                <TwoColumnSection>
                    <Section>
                        <SectionHeader>
                            <Plane size={20} />
                            <h3>Aircraft</h3>
                        </SectionHeader>
                        <DetailsList>
                            {details.aircraft.map((aircraft, idx) => (
                                <DetailsItem key={idx}>
                                    <Plane size={16} />
                                    <span>{aircraft.name}</span>
                                </DetailsItem>
                            ))}
                        </DetailsList>
                    </Section>

                    <Section>
                        <SectionHeader>
                            <Info size={20} />
                            <h3>Fare Conditions</h3>
                        </SectionHeader>
                        <DetailsList>
                            <DetailsItem>
                                <CheckCircle size={16} className={details.fareConditions.refundable ? 'green' : 'gray'} />
                                <span>{details.fareConditions.refundable ? 'Refundable' : 'Non-refundable'}</span>
                            </DetailsItem>
                            <DetailsItem>
                                <CheckCircle size={16} className={details.fareConditions.changeable ? 'green' : 'gray'} />
                                <span>{details.fareConditions.changeable ? 'Changes allowed' : 'No changes'}</span>
                            </DetailsItem>
                            <DetailsItem>
                                <span className="label">Booking Class:</span>
                                <span className="value">{details.fareConditions.bookingClass}</span>
                            </DetailsItem>
                        </DetailsList>
                    </Section>
                </TwoColumnSection>

                {/* Detailed Flight Segments */}
                {details.detailedSegments && details.detailedSegments.length > 1 && (
                    <Section>
                        <SectionHeader>
                            <Plane size={20} />
                            <h3>Flight Segments</h3>
                        </SectionHeader>
                        <SegmentsTimeline>
                            {details.detailedSegments.map((segment, idx) => (
                                <SegmentCard key={idx}>
                                    <SegmentHeader>
                                        <SegmentNumber>Segment {segment.index}</SegmentNumber>
                                        <SegmentRoute>
                                            {segment.departureCity} → {segment.arrivalCity}
                                        </SegmentRoute>
                                    </SegmentHeader>

                                    <SegmentBody>
                                        <SegmentColumn>
                                            <SegmentLabel>Departure</SegmentLabel>
                                            <SegmentTime>{segment.departureTime}</SegmentTime>
                                            <SegmentDate>{segment.departureDate}</SegmentDate>
                                            <SegmentAirportInfo>
                                                <strong>{segment.departureCode}</strong>
                                                <span className="airport-name">{segment.departureAirportName}</span>
                                                <span className="city">{segment.departureCity}, {segment.departureCountry}</span>
                                            </SegmentAirportInfo>
                                            {segment.departureTerminal && (
                                                <SegmentTerminal>Terminal {segment.departureTerminal}</SegmentTerminal>
                                            )}
                                        </SegmentColumn>

                                        <SegmentDuration>
                                            <Clock size={14} />
                                            {segment.duration}
                                        </SegmentDuration>

                                        <SegmentColumn>
                                            <SegmentLabel>Arrival</SegmentLabel>
                                            <SegmentTime>{segment.arrivalTime}</SegmentTime>
                                            <SegmentDate>{segment.arrivalDate}</SegmentDate>
                                            <SegmentAirportInfo>
                                                <strong>{segment.arrivalCode}</strong>
                                                <span className="airport-name">{segment.arrivalAirportName}</span>
                                                <span className="city">{segment.arrivalCity}, {segment.arrivalCountry}</span>
                                            </SegmentAirportInfo>
                                            {segment.arrivalTerminal && (
                                                <SegmentTerminal>Terminal {segment.arrivalTerminal}</SegmentTerminal>
                                            )}
                                        </SegmentColumn>
                                    </SegmentBody>

                                    <SegmentFooter>
                                        <SegmentInfo>
                                            <Plane size={14} />
                                            <span>
                                                {segment.flightNumber} • {segment.carrierName}
                                            </span>
                                        </SegmentInfo>
                                        {segment.isCodeshare && (
                                            <CodeshareNotice>
                                                <Info size={14} />
                                                <span>Operated by {segment.operatingCarrierName}</span>
                                            </CodeshareNotice>
                                        )}
                                        <SegmentInfo>
                                            <span className="aircraft">{segment.aircraftName}</span>
                                        </SegmentInfo>
                                    </SegmentFooter>
                                </SegmentCard>
                            ))}
                        </SegmentsTimeline>
                    </Section>
                )}

                {/* Important Information */}
                <ImportantInfo>
                    <Info size={20} />
                    <div>
                        <h4>Important Information</h4>
                        <ul>
                            <li>Price is valid for a limited time and subject to availability</li>
                            <li>Please arrive at the airport at least 2 hours before departure</li>
                            <li>Valid photo ID required for all passengers</li>
                            <li>Baggage fees may apply for additional items</li>
                        </ul>
                    </div>
                </ImportantInfo>

                {/* Action Buttons */}
                <ActionBar>
                    <button className="secondary" onClick={handleBackToSearch}>
                        Back to Search
                    </button>
                    <button className="primary" onClick={handleContinue}>
                        Continue to Traveler Info
                        <ChevronRight size={20} />
                    </button>
                </ActionBar>
            </Panel>
        </Shell>
    );
}

/* ============================================
   STYLED COMPONENTS
   ============================================ */

const Shell = styled.div`
    max-width: 1000px;
    margin: 2rem auto;
    padding: 0 1rem;
`;

const Panel = styled.div`
    background: #fff;
    border: 1px solid #e6edf5;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(2, 62, 138, .05);
`;

const Header = styled.div`
    padding: 2rem;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-bottom: 1px solid #bae6fd;

    h1 {
        margin: 0 0 0.5rem;
        color: #023e8a;
        font-size: 1.8rem;
    }
`;

const Breadcrumb = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;
    font-size: 0.9rem;

    .active {
        color: #0ea5e9;
        font-weight: 700;
    }

    svg {
        color: #cbd5e1;
    }
`;

const StatusBanner = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    background: ${p => p.success ? '#ecfdf5' : p.warning ? '#fef3c7' : '#f0f9ff'};
    border-bottom: 1px solid ${p => p.success ? '#a7f3d0' : p.warning ? '#fde68a' : '#bae6fd'};
    color: ${p => p.success ? '#047857' : p.warning ? '#92400e' : '#0369a1'};
    font-weight: 600;

    svg {
        flex-shrink: 0;

        &.spinning {
            animation: spin 1s linear infinite;
        }
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;

const RetryButton = styled.button`
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #fff;
    border: 1px solid #d97706;
    color: #92400e;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #fef3c7;
    }
`;

const FlightSummary = styled.div`
    padding: 2rem;
`;

const RouteInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
`;

const RouteHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
    flex-wrap: wrap;

    h2 {
        margin: 0;
        color: #023e8a;
        font-size: 1.8rem;
    }
`;

const RouteTitle = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    h2 {
        margin: 0;
        color: #023e8a;
        font-size: 1.5rem;
        line-height: 1.2;
    }
`;

const AirportCodes = styled.div`
    color: #64748b;
    font-weight: 700;
    font-size: 1.1rem;
    letter-spacing: 0.5px;
`;

const FlightMeta = styled.div`
    color: #64748b;
    font-weight: 600;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;

    .separator {
        color: #cbd5e1;
    }
`;

const AirlineDisplay = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;

    svg {
        color: #0ea5e9;
    }

    strong {
        color: #0b7285;
        font-weight: 700;
        font-size: 1.05rem;
    }
`;

const PriceDisplay = styled.div`
    text-align: right;
`;

const PriceLabel = styled.div`
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const Price = styled.div`
    font-size: 2rem;
    font-weight: 900;
    color: #0b7285;
    margin: 0.25rem 0;
`;

const PriceAction = styled.button`
    background: transparent;
    border: none;
    color: #0ea5e9;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.9rem;

    &:hover {
        color: #0369a1;
    }
`;

const PriceBreakdown = styled.div`
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const BreakdownRow = styled.div`
    display: flex;
    justify-content: space-between;
    color: #475569;
    font-size: 0.95rem;

    &.sub {
        padding-left: 1rem;
        font-size: 0.9rem;
        color: #64748b;
    }

    .tax-code {
        display: inline-block;
        margin-left: 0.5rem;
        padding: 0.1rem 0.4rem;
        background: #e2e8f0;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: #475569;
        font-family: monospace;
    }

    &.total {
        margin-top: 0.5rem;
        padding-top: 0.75rem;
        border-top: 2px solid #cbd5e1;
        color: #0b7285;
        font-size: 1.1rem;
    }
`;

const BreakdownDivider = styled.div`
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    padding-bottom: 0.25rem;
    border-top: 1px solid #e2e8f0;
    font-weight: 700;
    font-size: 0.85rem;
    color: #0b7285;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const Timeline = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0;
    position: relative;
    padding: 1rem 0;
`;

const TimelineItem = styled.div`
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    position: relative;
`;

const TimelineDot = styled.div`
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${p => p.departure ? '#10b981' : '#ef4444'};
    border: 3px solid #fff;
    box-shadow: 0 0 0 2px ${p => p.departure ? '#10b981' : '#ef4444'};
    flex-shrink: 0;
    margin-top: 4px;
    position: relative;
    z-index: 2;
`;

const TimelineContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
`;

const TimelineTime = styled.div`
    font-size: 1.3rem;
    font-weight: 900;
    color: #0b7285;
`;

const TimelineDate = styled.div`
    color: #64748b;
    font-weight: 600;
    font-size: 0.9rem;
`;

const TimelineLocation = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    color: #334155;
    font-weight: 700;
    margin-top: 0.5rem;

    svg {
        color: #94a3b8;
        flex-shrink: 0;
        margin-top: 2px;
    }

    > div {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    strong {
        color: #0b7285;
        font-size: 1rem;
    }

    .airport-name {
        color: #475569;
        font-weight: 600;
        font-size: 0.9rem;
    }

    .city-country {
        color: #64748b;
        font-weight: 500;
        font-size: 0.85rem;
    }
`;

const TimelineDuration = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 0 1rem 2rem;
    color: #64748b;
    font-weight: 600;
    position: relative;

    &::before {
        content: '';
        position: absolute;
        left: 7px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: linear-gradient(to bottom, #10b981, #ef4444);
        z-index: 1;
    }

    svg {
        color: #94a3b8;
    }

    .stops {
        color: #f59e0b;
        font-weight: 700;
    }
`;

const Section = styled.section`
    padding: 2rem;
    border-top: 1px solid #e6edf5;
`;

const SectionHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;

    h3 {
        margin: 0;
        color: #0b7285;
        font-size: 1.2rem;
    }

    svg {
        color: #0ea5e9;
    }
`;

const LayoverGrid = styled.div`
    display: grid;
    gap: 1.5rem;
`;

const LayoverCard = styled.div`
    background: ${p => {
        if (p.status === 'red') return '#fef2f2';
        if (p.status === 'amber') return '#fffbeb';
        return '#f0fdf4';
    }};
    border: 2px solid ${p => {
        if (p.status === 'red') return '#fecaca';
        if (p.status === 'amber') return '#fde68a';
        return '#bbf7d0';
    }};
    border-radius: 1rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const LayoverHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
`;

const LayoverAirport = styled.div`
    font-weight: 900;
    font-size: 1.4rem;
    color: #0b7285;
    display: flex;
    align-items: center;
    gap: 0.5rem;
`;

const LayoverBadge = styled.div`
    padding: 0.4rem 0.75rem;
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 0.85rem;
    background: ${p => {
        if (p.status === 'red') return '#fee2e2';
        if (p.status === 'amber') return '#fef3c7';
        return '#dcfce7';
    }};
    color: ${p => {
        if (p.status === 'red') return '#991b1b';
        if (p.status === 'amber') return '#78350f';
        return '#166534';
    }};
    border: 1px solid ${p => {
        if (p.status === 'red') return '#fca5a5';
        if (p.status === 'amber') return '#fcd34d';
        return '#86efac';
    }};
`;

const LayoverDuration = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: ${p => {
        if (p.status === 'red') return '#fee2e2';
        if (p.status === 'amber') return '#fef3c7';
        return '#dcfce7';
    }};
    border-radius: 0.75rem;
    border: 1px solid ${p => {
        if (p.status === 'red') return '#fca5a5';
        if (p.status === 'amber') return '#fcd34d';
        return '#86efac';
    }};

    svg {
        color: ${p => {
            if (p.status === 'red') return '#dc2626';
            if (p.status === 'amber') return '#d97706';
            return '#16a34a';
        }};
    }

    strong {
        font-size: 1.2rem;
        color: ${p => {
            if (p.status === 'red') return '#991b1b';
            if (p.status === 'amber') return '#78350f';
            return '#166534';
        }};
    }

    span {
        color: #64748b;
        font-weight: 600;
    }
`;

const LayoverTimeline = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 0.75rem;
`;

const LayoverTimelineItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
`;

const LayoverFlightBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    background: #0ea5e9;
    color: white;
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 0.9rem;
    width: fit-content;

    svg {
        color: white;
    }
`;

const LayoverLabel = styled.div`
    color: #64748b;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
`;

const LayoverTime = styled.div`
    font-size: 1.3rem;
    font-weight: 900;
    color: #0b7285;
`;

const LayoverDate = styled.div`
    color: #64748b;
    font-weight: 600;
    font-size: 0.9rem;
    margin-top: 0.15rem;
`;

const LayoverTerminal = styled.div`
    display: inline-block;
    margin-top: 0.5rem;
    padding: 0.25rem 0.6rem;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 0.4rem;
    color: #475569;
    font-weight: 700;
    font-size: 0.85rem;
`;

const LayoverAirline = styled.div`
    color: #475569;
    font-weight: 600;
    font-size: 0.9rem;
    margin-top: 0.25rem;
`;

const TerminalChangeNotice = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 0.5rem;
    margin: 0.5rem 0;

    svg {
        color: #d97706;
        flex-shrink: 0;
    }

    strong {
        color: #92400e;
    }

    span {
        color: #92400e;
        font-size: 0.85rem;
    }
`;

const LayoverTips = styled.div`
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0.75rem;
    border: 1px solid #e2e8f0;

    svg {
        color: #0ea5e9;
        flex-shrink: 0;
        margin-top: 0.25rem;
    }

    strong {
        color: #0b7285;
        display: block;
        margin-bottom: 0.5rem;
    }

    ul {
        margin: 0;
        padding-left: 1.25rem;
        color: #475569;

        li {
            margin-bottom: 0.35rem;
            line-height: 1.5;
        }
    }
`;

const InclusionsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
`;

const InclusionCard = styled.div`
    display: flex;
    gap: 1rem;
    padding: 1.25rem;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: 0.75rem;
`;

const InclusionIcon = styled.div`
    color: #0ea5e9;
    flex-shrink: 0;
`;

const InclusionContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
`;

const InclusionTitle = styled.div`
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 600;
`;

const InclusionValue = styled.div`
    color: #0b7285;
    font-weight: 700;
    font-size: 1rem;
`;

const AmenitiesRow = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
`;

const AmenitiesLabel = styled.div`
    font-weight: 700;
    color: #0b7285;
    font-size: 0.95rem;
`;

const AmenityBadge = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: ${p => p.isChargeable ? '#fef3c7' : '#dcfce7'};
    border: 1px solid ${p => p.isChargeable ? '#fde68a' : '#bbf7d0'};
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;
    color: ${p => p.isChargeable ? '#92400e' : '#166534'};

    svg {
        color: ${p => p.isChargeable ? '#d97706' : '#16a34a'};
    }

    .power-icon {
        font-size: 1.1rem;
    }

    .charge {
        margin-left: 0.25rem;
        padding: 0.15rem 0.4rem;
        background: #fbbf24;
        color: #78350f;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 700;
    }
`;

const EmissionsCard = styled.div`
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 2px solid #86efac;
    border-radius: 1rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
`;

const EmissionsMain = styled.div`
    display: flex;
    gap: 1rem;
    align-items: center;
`;

const EmissionsIcon = styled.div`
    width: 60px;
    height: 60px;
    background: white;
    border: 2px solid #86efac;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .co2 {
        font-weight: 900;
        font-size: 1.1rem;
        color: #16a34a;
    }
`;

const EmissionsContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
`;

const EmissionsValue = styled.div`
    font-size: 1.6rem;
    font-weight: 900;
    color: #166534;
`;

const EmissionsLabel = styled.div`
    color: #16a34a;
    font-weight: 600;
    font-size: 0.95rem;
`;

const EmissionsSubtext = styled.div`
    color: #4ade80;
    font-size: 0.85rem;
    margin-top: 0.25rem;
`;

const EmissionsOffset = styled.div`
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 1rem;
    background: white;
    border-radius: 0.75rem;
    border: 1px solid #bbf7d0;
`;

const OffsetInfo = styled.div`
    display: flex;
    gap: 0.75rem;
    flex: 1;

    svg {
        color: #16a34a;
        flex-shrink: 0;
        margin-top: 0.25rem;
    }

    strong {
        display: block;
        color: #166534;
        margin-bottom: 0.25rem;
    }

    p {
        margin: 0;
        color: #22c55e;
        font-size: 0.9rem;
    }
`;

const OffsetButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #16a34a;
    color: white;
    border: none;
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: #15803d;
    }

    svg {
        color: white;
    }
`;

const TwoColumnSection = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: 1px solid #e6edf5;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }

    > section {
        border-top: none;

        &:first-child {
            border-right: 1px solid #e6edf5;

            @media (max-width: 768px) {
                border-right: none;
                border-bottom: 1px solid #e6edf5;
            }
        }
    }
`;

const DetailsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
`;

const DetailsItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f8fafc;
    border-radius: 0.5rem;

    svg {
        color: #0ea5e9;
        flex-shrink: 0;

        &.green {
            color: #10b981;
        }

        &.gray {
            color: #cbd5e1;
        }
    }

    .label {
        color: #64748b;
        font-weight: 600;
    }

    .value {
        color: #0b7285;
        font-weight: 700;
        margin-left: auto;
    }
`;

const ImportantInfo = styled.div`
    padding: 2rem;
    background: #eff6ff;
    border-top: 1px solid #bfdbfe;
    display: flex;
    gap: 1rem;

    svg {
        color: #2563eb;
        flex-shrink: 0;
        margin-top: 0.25rem;
    }

    h4 {
        margin: 0 0 0.75rem;
        color: #1e40af;
    }

    ul {
        margin: 0;
        padding-left: 1.5rem;
        color: #1e40af;

        li {
            margin-bottom: 0.5rem;
        }
    }
`;

const ActionBar = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 2rem;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;

    button {
        padding: 0.875rem 2rem;
        border-radius: 0.75rem;
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        &.secondary {
            background: #fff;
            border: 2px solid #cbd5e1;
            color: #475569;

            &:hover {
                background: #f1f5f9;
                border-color: #94a3b8;
            }
        }

        &.primary {
            background: #1d4ed8;
            border: 2px solid #1d4ed8;
            color: #fff;

            &:hover {
                background: #1e40af;
                border-color: #1e40af;
            }
        }
    }

    @media (max-width: 640px) {
        flex-direction: column;

        button {
            width: 100%;
            justify-content: center;
        }
    }
`;

const SegmentsTimeline = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const SegmentCard = styled.div`
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const SegmentHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
`;

const SegmentNumber = styled.div`
    display: inline-block;
    padding: 0.35rem 0.75rem;
    background: #0ea5e9;
    color: white;
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 0.85rem;
`;

const SegmentRoute = styled.div`
    font-size: 1.2rem;
    font-weight: 900;
    color: #0b7285;
`;

const SegmentBody = styled.div`
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 1.5rem;
    align-items: center;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
`;

const SegmentColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
`;

const SegmentLabel = styled.div`
    color: #64748b;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const SegmentTime = styled.div`
    font-size: 1.2rem;
    font-weight: 900;
    color: #0b7285;
`;

const SegmentDate = styled.div`
    color: #64748b;
    font-weight: 600;
    font-size: 0.9rem;
`;

const SegmentTerminal = styled.div`
    display: inline-block;
    margin-top: 0.5rem;
    padding: 0.25rem 0.6rem;
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 0.4rem;
    color: #475569;
    font-weight: 700;
    font-size: 0.85rem;
    width: fit-content;
`;

const SegmentAirportInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    margin-top: 0.5rem;

    strong {
        color: #0b7285;
        font-size: 0.95rem;
    }

    .airport-name {
        color: #475569;
        font-weight: 600;
        font-size: 0.85rem;
    }

    .city {
        color: #64748b;
        font-weight: 500;
        font-size: 0.8rem;
    }
`;

const SegmentDuration = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #e0f2fe;
    border: 1px solid #bae6fd;
    border-radius: 0.5rem;
    color: #0369a1;
    font-weight: 700;

    svg {
        color: #0ea5e9;
    }

    @media (max-width: 640px) {
        flex-direction: row;
    }
`;

const SegmentFooter = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e2e8f0;
`;

const SegmentInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #475569;
    font-weight: 600;
    font-size: 0.9rem;

    svg {
        color: #0ea5e9;
    }

    .aircraft {
        color: #64748b;
    }
`;

const CodeshareNotice = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 0.5rem;
    color: #92400e;
    font-weight: 600;
    font-size: 0.85rem;

    svg {
        color: #d97706;
    }
`;

const ErrorState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem 2rem;
    text-align: center;

    svg {
        color: #f59e0b;
    }

    h2 {
        margin: 0;
        color: #0b7285;
    }

    p {
        color: #64748b;
        max-width: 400px;
    }

    button {
        background: #0ea5e9;
        color: #fff;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 700;
        cursor: pointer;

        &:hover {
            background: #0369a1;
        }
    }
`;