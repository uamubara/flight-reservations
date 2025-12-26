import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Plane, ArrowRight, RockingChair, Luggage, Clock, ChevronDown, ChevronUp, Star, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";

/**
 * API Configuration
 * Base URL for backend API calls, defaults to localhost:8081 if not set in environment
 */
const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

/**
 * Professional Flight Card Component
 *
 * Displays flight search results from Amadeus API in a clean, scannable card layout.
 * Features:
 * - Three-column layout: Route/Times | Airline Info | Price/Badges
 * - Expandable details with pricing, baggage, aircraft, and layover information
 * - "Best Value" badge for cheapest non-stop (or overall cheapest) flight
 * - Real-time data fetching from Amadeus API endpoints
 * - Smart dynamic information section showing amenities and fare details
 * - Caching to minimize redundant API calls
 *
 * Layout Structure:
 * Left Column:   Airport codes, city names, departure/arrival times
 * Middle Column: Airline name, flight number, cabin class (centered)
 * Right Column:  Price, stops badge, view details button
 *
 * @param {Array} offers - Flight offers from Amadeus API (FlightOfferDTO[])
 * @param {Function} onSelectOffer - Callback when user clicks "Select This Flight"
 */
export default function Flight({ offers = [], onSelectOffer }) {
    // ==================== STATE MANAGEMENT ====================

    /** Tracks which flight card is currently expanded (by offer.id) */
    const [expandedId, setExpandedId] = useState(null);

    /** Cache for flight pricing details from /api/flights/confirm endpoint */
    const [detailsCache, setDetailsCache] = useState({});

    /** Map of airport codes to city names from /api/airports endpoint */
    const [airportsMap, setAirportsMap] = useState({});

    // ==================== DATA EXTRACTION ====================

    /**
     * Extract unique airport codes from all flight offers
     * Used to fetch city names in a single batch API call
     * Memoized to prevent unnecessary recalculation on re-renders
     */
    const codes = useMemo(() => {
        const set = new Set();
        for (const o of offers) {
            if (o?.originCode) set.add(o.originCode);
            if (o?.destinationCode) set.add(o.destinationCode);
        }
        return Array.from(set).filter(Boolean);
    }, [offers]);

    // ==================== API CALLS ====================

    /**
     * Fetch airport details (city names) from backend
     * Endpoint: GET /api/airports?codes=IAH,JFK,LAX
     * Response: { "IAH": { cityName: "Houston", airportName: "...", ... }, ... }
     *
     * Called once when offers change, fetches all airport data in batch
     */
    useEffect(() => {
        let isMounted = true;

        async function fetchAirports() {
            // Skip if no airport codes to fetch
            if (!codes.length) {
                setAirportsMap({});
                return;
            }

            try {
                const r = await fetch(`${BASE}/api/airports?codes=${encodeURIComponent(codes.join(","))}`);
                if (!r.ok) throw new Error(await r.text());

                const json = await r.json();

                // Only update state if component is still mounted (prevents memory leaks)
                if (isMounted) {
                    setAirportsMap(json || {});
                }
            } catch (e) {
                // Fail gracefully - airport codes will be used as fallback
                if (isMounted) {
                    setAirportsMap({});
                }
                console.error("Airport lookup error:", e);
            }
        }

        fetchAirports();

        // Cleanup function to prevent state updates on unmounted component
        return () => { isMounted = false; };
    }, [codes]);

    // ==================== FORMATTING UTILITIES ====================

    /**
     * Format ISO 8601 timestamp to readable time
     *
     * @param {string} isoMaybe - ISO timestamp (e.g., "2025-01-15T06:30:00")
     * @returns {string} Formatted time (e.g., "6:30 AM") or "—" if invalid
     */
    const formatTime = (isoMaybe) => {
        if (!isoMaybe) return "—";
        const d = new Date(isoMaybe);
        if (isNaN(d.getTime())) return "—";
        return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    };

    /**
     * Format ISO 8601 duration to readable format
     *
     * @param {string} iso - ISO duration (e.g., "PT3H45M")
     * @returns {string} Formatted duration (e.g., "3h 45m") or "—" if invalid
     */
    const formatDuration = (iso) => {
        if (!iso) return "—";
        // Regex to extract hours and minutes from ISO 8601 duration format
        const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (!match) return iso;
        const hours = match[1] ? `${match[1]}h` : "";
        const minutes = match[2] ? `${match[2]}m` : "";
        return `${hours} ${minutes}`.trim() || "—";
    };

    /**
     * Convert cabin class codes to human-readable names
     * Amadeus returns uppercase underscore format (PREMIUM_ECONOMY)
     *
     * @param {string} v - Cabin class code from Amadeus
     * @returns {string} Human-readable cabin class name
     */
    const formatCabin = (v) => {
        switch ((v || "").toUpperCase()) {
            case "ECONOMY": return "Economy";
            case "PREMIUM_ECONOMY": return "Premium Economy";
            case "BUSINESS": return "Business";
            case "FIRST": return "First";
            default: return "Economy";
        }
    };

    /**
     * Format price with proper currency symbol and decimals
     * Uses Intl.NumberFormat for internationalization support
     *
     * @param {string|number} total - Price amount
     * @param {string} currency - ISO currency code (default: USD)
     * @returns {string} Formatted price (e.g., "$312.45")
     */
    const formatPrice = (total, currency = "USD") => {
        const v = Number(total || 0);
        try {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency,
                maximumFractionDigits: 2
            }).format(v);
        } catch {
            // Fallback if currency code is invalid
            return `$${v.toFixed(2)}`;
        }
    };

    // ==================== UI STYLING LOGIC ====================

    /**
     * Get badge color scheme based on number of stops
     * Non-stop = green (best), 1 stop = amber, 2+ stops = red
     *
     * @param {number} stops - Number of stops/connections
     * @returns {object} Style object with background, color, and border
     */
    const getStopsBadgeStyle = (stops) => {
        if (stops === 0) {
            return { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' };
        } else if (stops === 1) {
            return { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
        }
        return { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' };
    };

    /**
     * Determine which flight should get the "Best Value" badge
     * Logic:
     * 1. If non-stop flights exist, pick cheapest non-stop
     * 2. Otherwise, pick cheapest flight overall
     *
     * @returns {string|null} ID of the best value flight, or null if no offers
     */
    const getBestValueId = () => {
        if (!offers || offers.length === 0) return null;

        // Filter for non-stop flights
        const nonStopFlights = offers.filter(o => o.numberOfStops === 0);

        // Use non-stop flights if available, otherwise use all flights
        const flightsToCompare = nonStopFlights.length > 0 ? nonStopFlights : offers;

        // Find the cheapest flight using reduce
        const cheapest = flightsToCompare.reduce((min, offer) => {
            const price = Number(offer?.price?.total || Infinity);
            const minPrice = Number(min?.price?.total || Infinity);
            return price < minPrice ? offer : min;
        }, flightsToCompare[0]);

        return cheapest?.id;
    };

    // Calculate best value ID once per render
    const bestValueId = getBestValueId();

    // ==================== INTERACTION HANDLERS ====================

    /**
     * Handle expanding/collapsing flight details
     * When expanded for first time, fetches detailed pricing from Amadeus API
     * Subsequent expansions use cached data
     *
     * @param {object} offer - The flight offer being toggled
     */
    const handleToggleDetails = async (offer) => {
        const offerId = offer.id;

        // If clicking the same card, collapse it
        if (expandedId === offerId) {
            setExpandedId(null);
            return;
        }

        // Expand the card
        setExpandedId(offerId);

        // If we already have cached details (success or error), don't refetch
        if (detailsCache[offerId] && !detailsCache[offerId].loading) {
            return;
        }

        // Fetch detailed pricing information from Amadeus
        try {
            // Set loading state
            setDetailsCache(prev => ({
                ...prev,
                [offerId]: { loading: true, data: null, error: false }
            }));

            // POST to /api/flights/confirm with raw Amadeus offer JSON
            const response = await fetch(`${BASE}/api/flights/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(offer.rawOffer),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch pricing details');
            }

            const data = await response.json();

            // Cache the successful response
            setDetailsCache(prev => ({
                ...prev,
                [offerId]: { loading: false, data: data, error: false }
            }));
        } catch (error) {
            console.error("Error fetching flight details:", error);

            // Cache the error state to prevent repeated failed requests
            setDetailsCache(prev => ({
                ...prev,
                [offerId]: { loading: false, data: null, error: true }
            }));
        }
    };

    // ==================== DATA EXTRACTION FROM API RESPONSES ====================

    /**
     * Extract baggage allowance from Amadeus pricing response
     * Handles both quantity-based (e.g., 2 bags) and weight-based (e.g., 23kg) formats
     *
     * @param {object} offer - Original flight offer
     * @param {object} details - Detailed pricing response from /api/flights/confirm
     * @returns {string} Human-readable baggage information
     */
    const getBaggageInfo = (offer, details) => {
        // Return default if pricing details not available
        if (!details?.data?.flightOffers?.[0]) {
            return "Check with airline";
        }

        // Navigate through Amadeus response structure to find baggage info
        const travelerPricings = details.data.flightOffers[0].travelerPricings || [];
        if (travelerPricings.length === 0) return "Check with airline";

        const fareDetails = travelerPricings[0].fareDetailsBySegment?.[0];
        const baggage = fareDetails?.includedCheckedBags;

        if (!baggage) return "Not included";

        // Handle quantity-based baggage (e.g., 2 pieces)
        if (baggage.quantity !== undefined) {
            if (baggage.quantity === 0) return "Not included";
            return `${baggage.quantity} checked bag${baggage.quantity !== 1 ? 's' : ''}`;
        }

        // Handle weight-based baggage (e.g., 23kg)
        if (baggage.weight !== undefined) {
            return `${baggage.weight}${baggage.weightUnit || 'kg'}`;
        }

        return "Check with airline";
    };

    /**
     * Extract aircraft type from Amadeus pricing response
     * Uses dictionaries to map aircraft codes to full names
     *
     * @param {object} offer - Original flight offer
     * @param {object} details - Detailed pricing response from /api/flights/confirm
     * @returns {string} Aircraft name (e.g., "Boeing 737-800")
     */
    const getAircraftInfo = (offer, details) => {
        if (!details?.data?.flightOffers?.[0]) {
            return "TBD";
        }

        const segments = details.data.flightOffers[0].itineraries?.[0]?.segments || [];
        if (segments.length === 0) return "TBD";

        // Get aircraft code from first segment
        const aircraftCode = segments[0].aircraft?.code;

        // Look up full aircraft name in dictionaries
        const aircraftName = details.data.dictionaries?.aircraft?.[aircraftCode];

        return aircraftName || `Aircraft ${aircraftCode || 'TBD'}`;
    };

    /**
     * Extract stop/layover information from Amadeus pricing response
     * Calculates layover duration by comparing arrival and departure times between segments
     *
     * Each segment in Amadeus represents a flight leg (e.g., IAH→ATL is one segment)
     * Stops occur between segments (e.g., arrive ATL at 11:45, depart ATL at 2:15)
     *
     * @param {object} details - Detailed pricing response from /api/flights/confirm
     * @returns {Array} Array of stop objects with airport, times, and duration
     */
    const getStopInfo = (details) => {
        if (!details?.data?.flightOffers?.[0]) {
            return [];
        }

        const segments = details.data.flightOffers[0].itineraries?.[0]?.segments || [];
        const stops = [];

        // Iterate through segments to find layovers between them
        for (let i = 0; i < segments.length - 1; i++) {
            const currentSegment = segments[i];
            const nextSegment = segments[i + 1];

            // Extract arrival time of current segment and departure of next segment
            const arrivalTime = currentSegment.arrival?.at;
            const departureTime = nextSegment.departure?.at;
            const stopAirport = currentSegment.arrival?.iataCode;

            if (arrivalTime && departureTime && stopAirport) {
                // Calculate layover duration using Date objects (handles timezones automatically)
                const arrivalDate = new Date(arrivalTime);
                const departureDate = new Date(departureTime);
                const durationMs = departureDate - arrivalDate;

                // Convert milliseconds to hours and minutes
                const hours = Math.floor(durationMs / (1000 * 60 * 60));
                const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                const durationStr = `${hours}h ${minutes}m`;

                stops.push({
                    airport: stopAirport,
                    arrivalTime: formatTime(arrivalTime),
                    departureTime: formatTime(departureTime),
                    duration: durationStr
                });
            }
        }

        return stops;
    };

    /**
     * Smart Information Section Component
     * Dynamically displays additional flight information based on what's available in API response
     * Shows: Amenities, fare conditions, booking class, etc.
     * Only renders if data exists (no empty sections)
     *
     * @param {object} offer - Original flight offer
     * @param {object} details - Detailed pricing response from API
     */
    const SmartInfoSection = ({ offer, details }) => {
        const flightOffer = details?.flightOffers?.[0];
        if (!flightOffer) return null;

        const travelerPricings = flightOffer.travelerPricings || [];
        const fareDetails = travelerPricings[0]?.fareDetailsBySegment?.[0];

        // Extract amenities (if available)
        const amenities = fareDetails?.amenities || [];
        const includedAmenities = amenities.filter(a => !a.isChargeable);
        const chargeableAmenities = amenities.filter(a => a.isChargeable);

        // Extract fare conditions
        const fareConditions = travelerPricings[0]?.fareDetailsBySegment?.[0];
        const bookingClass = fareConditions?.class;
        const fareBasis = fareConditions?.fareBasis;

        // Check if there's any additional info to show
        const hasInfo = includedAmenities.length > 0 ||
            chargeableAmenities.length > 0 ||
            bookingClass ||
            fareBasis;

        if (!hasInfo) return null;

        return (
            <AdditionalInfoSection>
                <InfoHeader>
                    <Star size={16} style={{ marginRight: '0.5rem' }} />
                    Additional Information
                </InfoHeader>

                {/* Included Amenities */}
                {includedAmenities.length > 0 && (
                    <InfoBlock>
                        <InfoSubheader>Included in Your Fare</InfoSubheader>
                        <AmenityList>
                            {includedAmenities.map((amenity, idx) => (
                                <AmenityItem key={idx}>
                                    <CheckCircle size={16} className="check" />
                                    <span>{amenity.description || 'Amenity included'}</span>
                                </AmenityItem>
                            ))}
                        </AmenityList>
                    </InfoBlock>
                )}

                {/* Chargeable Amenities */}
                {chargeableAmenities.length > 0 && (
                    <InfoBlock>
                        <InfoSubheader>Available for Purchase</InfoSubheader>
                        <AmenityList>
                            {chargeableAmenities.map((amenity, idx) => (
                                <AmenityItem key={idx} chargeable>
                                    <DollarSign size={16} className="dollar" />
                                    <span>{amenity.description || 'Upgrade available'}</span>
                                </AmenityItem>
                            ))}
                        </AmenityList>
                    </InfoBlock>
                )}

                {/* Booking Class & Fare Basis (for frequent flyers) */}
                {(bookingClass || fareBasis) && (
                    <InfoBlock>
                        <InfoSubheader>Fare Details</InfoSubheader>
                        <FareDetailsGrid>
                            {bookingClass && (
                                <FareDetail>
                                    <span className="label">Booking Class:</span>
                                    <span className="value">{bookingClass}</span>
                                </FareDetail>
                            )}
                            {fareBasis && (
                                <FareDetail>
                                    <span className="label">Fare Basis:</span>
                                    <span className="value">{fareBasis}</span>
                                </FareDetail>
                            )}
                        </FareDetailsGrid>
                    </InfoBlock>
                )}
            </AdditionalInfoSection>
        );
    };

    // ==================== RENDER ====================

    // Handle empty state
    if (!offers || offers.length === 0) {
        return <Empty>No flights to show.</Empty>;
    }

    return (
        <List>
            {offers.map((offer) => {
                // Extract and format data for display
                const oCode = offer?.originCode || "—";
                const dCode = offer?.destinationCode || "—";
                const oCity = airportsMap[oCode]?.cityName || oCode;
                const dCity = airportsMap[dCode]?.cityName || dCode;
                const departTime = formatTime(offer?.departureTime);
                const arriveTime = formatTime(offer?.arrivalTime);
                const airline = offer?.airlineName || offer?.carrierCode || "—";
                const flightId = [offer?.carrierCode, offer?.flightNumber].filter(Boolean).join(" ");
                const cabin = formatCabin(offer?.cabin);
                const priceStr = formatPrice(offer?.price?.total, offer?.price?.currency);
                const stops = offer?.numberOfStops ?? 0;
                const duration = formatDuration(offer?.duration);
                const isBestValue = offer.id === bestValueId;

                // Get expanded state and cached details for this offer
                const isExpanded = expandedId === offer.id;
                const details = detailsCache[offer.id];
                const stopInfo = isExpanded && details?.data ? getStopInfo(details) : [];

                return (
                    <CardWrapper key={offer.id}>
                        {/* Main Flight Card - Clickable to expand */}
                        <Card
                            onClick={() => handleToggleDetails(offer)}
                            isExpanded={isExpanded}
                        >
                            {/* Best Value Badge - Top left corner */}
                            {isBestValue && (
                                <BestValueBadge>
                                    <Star size={14} fill="currentColor" /> Best Value
                                </BestValueBadge>
                            )}

                            {/* Left Section: Route, Cities & Times */}
                            <RouteSection>
                                {/* Origin Airport: Code → City → Time */}
                                <LocationColumn>
                                    <Code>{oCode}</Code>
                                    <City>{oCity}</City>
                                    <Time>{departTime}</Time>
                                </LocationColumn>

                                {/* Center Icons: Plane (rotated 45°) and Arrow */}
                                <IconColumn>
                                    <Plane size={16} style={{ color: '#0ea5e9', transform: 'rotate(45deg)' }} />
                                    <ArrowRight size={14} style={{ color: '#cbd5e1' }} />
                                </IconColumn>

                                {/* Destination Airport: Code → City → Time */}
                                <LocationColumn>
                                    <Code>{dCode}</Code>
                                    <City>{dCity}</City>
                                    <Time>{arriveTime}</Time>
                                </LocationColumn>
                            </RouteSection>

                            {/* Middle Section: Airline Info (Centered) */}
                            <AirlineSection>
                                {/* Airline Name • Flight Number */}
                                <AirlineLine>
                                    <AirlineName>{airline}</AirlineName>
                                    <Dot>•</Dot>
                                    <FlightNumber>{flightId}</FlightNumber>
                                </AirlineLine>
                                {/* Cabin Class Below */}
                                <CabinClass>{cabin}</CabinClass>
                            </AirlineSection>

                            {/* Right Section: Price & Badges (Right-aligned) */}
                            <PriceSection>
                                <Price>{priceStr}</Price>
                                <BadgeContainer>
                                    {/* Stops Badge - Color coded (green/amber/red) */}
                                    <StopsBadge style={getStopsBadgeStyle(stops)}>
                                        {stops === 0 ? 'Non-stop' : `${stops} stop${stops > 1 ? 's' : ''}`}
                                    </StopsBadge>
                                    {/* View Details Button with Dropdown Arrow */}
                                    <ViewDetailsButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleDetails(offer);
                                        }}
                                    >
                                        {isExpanded ? (
                                            <>
                                                Hide details <ChevronUp size={16} />
                                            </>
                                        ) : (
                                            <>
                                                View details <ChevronDown size={16} />
                                            </>
                                        )}
                                    </ViewDetailsButton>
                                </BadgeContainer>
                            </PriceSection>
                        </Card>

                        {/* Expanded Details Dropdown - Shows when card is clicked */}
                        {isExpanded && (
                            <ExpandedDetails>
                                {/* Loading State */}
                                {details?.loading && (
                                    <LoadingMessage>Loading details…</LoadingMessage>
                                )}

                                {/* Details Content - Only show when loaded */}
                                {!details?.loading && (
                                    <>
                                        {/* Detail Cards Grid - Duration, Baggage, Cabin, Aircraft */}
                                        <DetailsGrid>
                                            {/* Duration Card */}
                                            <DetailCard>
                                                <Clock size={20} style={{ color: '#0ea5e9' }} />
                                                <div>
                                                    <DetailLabel>Duration</DetailLabel>
                                                    <DetailValue>{duration}</DetailValue>
                                                </div>
                                            </DetailCard>

                                            {/* Baggage Card - Luggage Icon */}
                                            <DetailCard>
                                                <Luggage size={20} style={{ color: '#0ea5e9' }} />
                                                <div>
                                                    <DetailLabel>Checked Baggage</DetailLabel>
                                                    <DetailValue>{getBaggageInfo(offer, details?.data)}</DetailValue>
                                                </div>
                                            </DetailCard>

                                            {/* Cabin Card - RockingChair Icon */}
                                            <DetailCard>
                                                <RockingChair size={20} style={{ color: '#0ea5e9' }} />
                                                <div>
                                                    <DetailLabel>Cabin Class</DetailLabel>
                                                    <DetailValue>{cabin}</DetailValue>
                                                </div>
                                            </DetailCard>

                                            {/* Aircraft Card */}
                                            <DetailCard>
                                                <Plane size={20} style={{ color: '#0ea5e9' }} />
                                                <div>
                                                    <DetailLabel>Aircraft</DetailLabel>
                                                    <DetailValue>{getAircraftInfo(offer, details?.data)}</DetailValue>
                                                </div>
                                            </DetailCard>
                                        </DetailsGrid>

                                        {/* Stop/Layover Information - Only show for connecting flights */}
                                        {stopInfo.length > 0 && (
                                            <StopSection>
                                                <StopHeader>
                                                    <AlertTriangle size={16} style={{ marginRight: '0.5rem' }} />
                                                    Layover Information
                                                </StopHeader>
                                                {stopInfo.map((stop, idx) => (
                                                    <StopCard key={idx}>
                                                        <StopAirport>{stop.airport}</StopAirport>
                                                        <StopDetails>
                                                            <span>Arrive: {stop.arrivalTime}</span>
                                                            <span>•</span>
                                                            <span>Depart: {stop.departureTime}</span>
                                                            <span>•</span>
                                                            <span className="duration">{stop.duration} layover</span>
                                                        </StopDetails>
                                                    </StopCard>
                                                ))}
                                            </StopSection>
                                        )}

                                        {/* Smart Additional Information Section */}
                                        {details?.data && (
                                            <SmartInfoSection
                                                offer={offer}
                                                details={details.data}
                                            />
                                        )}

                                        {/* Select Flight Button - Triggers onSelectOffer callback */}
                                        <SelectButton onClick={() => onSelectOffer?.(offer.rawOffer)}>
                                            Select This Flight
                                        </SelectButton>
                                    </>
                                )}
                            </ExpandedDetails>
                        )}
                    </CardWrapper>
                );
            })}
        </List>
    );
}

/* ============================================
   STYLED COMPONENTS
   Professional, accessible styling matching design specs
   ============================================ */

/**
 * Main container for flight cards list
 * Grid layout with spacing between cards
 */
const List = styled.div`
    display: grid;
    gap: 0.8rem;
`;

/**
 * Empty state message when no flights available
 */
const Empty = styled.div`
    padding: 1rem;
    border-radius: 0.75rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #475569;
    font-weight: 600;
`;

/**
 * Individual flight card wrapper
 * Contains main card and expandable details section
 */
const CardWrapper = styled.div`
    background: #fff;
    border: 1px solid #e6edf5;
    border-radius: 0.9rem;
    box-shadow: 0 6px 16px rgba(2, 62, 138, 0.06);
    transition: all 0.2s ease-in-out;
    overflow: hidden;

    &:hover {
        box-shadow: 0 8px 24px rgba(2, 62, 138, 0.1);
        transform: translateY(-1px);
    }
`;

/**
 * Main flight card
 * Three equal columns: Route | Airline | Price
 * Clickable to expand/collapse details
 */
const Card = styled.div`
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1.5rem;
    align-items: center;
    padding: 1rem 1.25rem;
    cursor: pointer;
    background: ${props => props.isExpanded ? '#f8fbff' : 'transparent'};
    transition: background-color 0.2s;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

/**
 * Best Value Badge
 * Green gradient, positioned at top-left corner
 */
const BestValueBadge = styled.div`
    position: absolute;
    top: -1px;
    left: -1px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 0.9rem 0 0.5rem 0;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.25rem;
`;

/**
 * Left section: Route display with airport codes, cities, and times
 */
/**
 * Left section: Route display with airport codes, cities, and times
 */
const RouteSection = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
`;

/**
 * Vertical column for airport information
 * Displays: Code (top) → City (middle) → Time (bottom)
 */
const LocationColumn = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
`;

/**
 * Airport IATA code (e.g., IAH, JFK)
 * Large, bold, prominent display
 */
const Code = styled.span`
    font-size: 1.05rem;
    font-weight: 900;
    color: #023e8a;
    letter-spacing: 0.6px;
`;

/**
 * City name (e.g., Houston, New York)
 */
const City = styled.span`
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 600;
`;

/**
 * Departure/arrival time
 */
const Time = styled.span`
    color: #0b7285;
    font-weight: 700;
    font-size: 0.9rem;
`;

/**
 * Center column between origin and destination
 * Contains plane icon (rotated 45°) and arrow icon
 */
const IconColumn = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding-top: 0.5rem;
`;

/**
 * Middle section: Airline information
 * Centered in card using justify-self: center
 */
const AirlineSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    align-items: center;
    text-align: center;
    justify-self: center;
`;

/**
 * Airline name and flight number on same line
 * Format: "United Airlines • UA 1234"
 */
const AirlineLine = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`;

/**
 * Airline name (e.g., United Airlines)
 */
const AirlineName = styled.span`
    font-size: 1.05rem;
    font-weight: 700;
    color: #0b7285;
`;

/**
 * Dot separator between airline and flight number
 */
const Dot = styled.span`
    color: #cbd5e1;
    font-size: 0.9rem;
`;

/**
 * Flight number (e.g., UA 1234)
 */
const FlightNumber = styled.span`
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 600;
`;

/**
 * Cabin class, displayed below airline info
 */
const CabinClass = styled.div`
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 600;
`;

/**
 * Right section: Price and badges
 * Right-aligned using justify-self: end
 */
const PriceSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-self: end;
    gap: 0.5rem;
    
    @media (max-width: 720px) {
        align-items: flex-start;
        justify-self: start;
    }
`;

/**
 * Price display (e.g., $312.45)
 */
const Price = styled.div`
    font-size: 1.05rem;
    font-weight: 900;
    color: #0b7285;
`;

/**
 * Container for stops badge and view details button
 */
const BadgeContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.4rem;
`;

/**
 * Stops badge with color coding
 * Green (non-stop), Amber (1 stop), Red (2+ stops)
 * Styling applied dynamically via getStopsBadgeStyle()
 */
const StopsBadge = styled.span`
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    font-size: 0.85rem;
    font-weight: 700;
`;

/**
 * View Details button with dropdown chevron icon
 * Changes text and icon based on expanded state
 */
const ViewDetailsButton = styled.button`
    background: transparent;
    color: #0ea5e9;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 0.5rem;
    font-weight: 700;
    cursor: pointer;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    transition: background-color 0.2s;
    
    &:hover {
        background: #f0f9ff;
    }
`;

/**
 * Expanded details section
 * Slides down with animation when card is clicked
 */
const ExpandedDetails = styled.div`
    border-top: 1px solid #e6edf5;
    padding: 1.25rem;
    background: white;
    animation: slideDown 0.3s ease-out;
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

/**
 * Loading message shown while fetching pricing details from API
 */
const LoadingMessage = styled.div`
    text-align: center;
    padding: 1rem;
    color: #64748b;
    font-weight: 600;
`;

/**
 * Grid layout for detail cards
 * Auto-fits cards with minimum width of 200px
 */
const DetailsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.25rem;
`;

/**
 * Individual detail card (Duration, Baggage, Cabin, Aircraft)
 * Blue gradient background with icon and text
 */
const DetailCard = styled.div`
    padding: 0.75rem;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 0.5rem;
    border: 1px solid #bae6fd;
    display: flex;
    gap: 0.5rem;
    align-items: center;
`;

/**
 * Label for detail card (e.g., "Duration", "Checked Baggage")
 */
const DetailLabel = styled.div`
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 600;
`;

/**
 * Value for detail card (e.g., "3h 45m", "1 checked bag")
 */
const DetailValue = styled.div`
    font-weight: 700;
    color: #0b7285;
    font-size: 0.9rem;
`;

/**
 * Stop/layover section
 * Yellow warning style to draw attention to connection times
 * Only displayed for flights with stops
 */
const StopSection = styled.div`
    background: #fef3c7;
    padding: 1rem;
    border-radius: 0.75rem;
    margin-bottom: 1.25rem;
    border: 1px solid #fde68a;
`;

/**
 * Header for layover section with warning emoji
 */
const StopHeader = styled.div`
    font-size: 0.8rem;
    color: #92400e;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
    letter-spacing: 0.5px;
`;

/**
 * Individual stop/layover card
 * Shows airport, arrival/departure times, and layover duration
 */
const StopCard = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    
    & + & {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid #fde68a;
    }
`;

/**
 * Airport code for layover (e.g., "ATL")
 */
const StopAirport = styled.div`
    font-size: 1rem;
    font-weight: 700;
    color: #78350f;
`;

/**
 * Layover details line
 * Format: "Arrive: 11:45 AM • Depart: 02:15 PM • 2h 30m layover"
 */
const StopDetails = styled.div`
    font-size: 0.9rem;
    color: #92400e;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    
    .duration {
        font-weight: 700;
        color: #f59e0b;
    }
`;

/**
 * Select Flight button
 * Primary CTA that triggers onSelectOffer callback
 */
const SelectButton = styled.button`
    width: 100%;
    background: #1d4ed8;
    color: white;
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 0.7rem;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
    
    &:hover {
        background: #1e40af;
    }
`;

/**
 * Smart additional information section
 * Green gradient to highlight positive information
 */
const AdditionalInfoSection = styled.div`
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 1px solid #bbf7d0;
    padding: 1rem;
    border-radius: 0.75rem;
    margin-bottom: 1.25rem;
`;

/**
 * Header for additional info section
 * Uses Lucide Star icon
 */
const InfoHeader = styled.div`
    font-size: 0.85rem;
    color: #166534;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
`;

/**
 * Individual info block
 */
const InfoBlock = styled.div`
    & + & {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #bbf7d0;
    }
`;

/**
 * Subheader within info block
 */
const InfoSubheader = styled.div`
    font-size: 0.8rem;
    color: #15803d;
    font-weight: 600;
    margin-bottom: 0.5rem;
`;

/**
 * List of amenities
 */
const AmenityList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
`;

/**
 * Individual amenity item
 */
const AmenityItem = styled.li`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: ${props => props.chargeable ? '#92400e' : '#166534'};
    
    .check {
        color: #16a34a;
        font-weight: 700;
        font-size: 1rem;
    }
    
    .dollar {
        color: #f59e0b;
        font-weight: 700;
        font-size: 1rem;
    }
`;

/**
 * Grid for fare details
 */
const FareDetailsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
`;

/**
 * Individual fare detail row
 */
const FareDetail = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    
    .label {
        color: #15803d;
        font-weight: 600;
    }
    
    .value {
        color: #166534;
        font-weight: 700;
        font-family: monospace;
    }
`;