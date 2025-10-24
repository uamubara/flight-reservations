import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { Badge } from "./FlightSelect";

const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

// --- Helper functions ---
const formatDuration = (iso) => {
    if (!iso) return "—";
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return iso;
    const hours = match[1] ? `${match[1]}h` : "";
    const minutes = match[2] ? `${match[2]}m` : "";
    return `${hours} ${minutes}`.trim();
};
const timeHHMM = (isoMaybe) => {
    if (!isoMaybe) return "—";
    const d = new Date(isoMaybe);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};
const money = (total, currency = "USD") => {
    const v = Number(total || 0);
    try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(v);
    } catch {
        return `$${v.toFixed(2)}`;
    }
};
const humanizeClass = (v) => {
    switch ((v || "").toUpperCase()) {
        case "ECONOMY": return "Economy";
        case "PREMIUM_ECONOMY": return "Premium Economy";
        case "BUSINESS": return "Business";
        case "FIRST": return "First";
        default: return "Economy";
    }
};
const stopsBadge = (n) => (n === 0 ? { text: "Non-stop", tone: "green" } : n === 1 ? { text: "1 stop", tone: "amber" } : { text: `${n} stops`, tone: "amber" });

// Helper to format baggage info
const formatBaggage = (baggage) => {
    if (!baggage) return "Not included";

    // Handle quantity-based baggage
    if (baggage.quantity !== undefined) {
        if (baggage.quantity === 0) return "Not included";
        return `${baggage.quantity} piece${baggage.quantity !== 1 ? 's' : ''}`;
    }

    // Handle weight-based baggage
    if (baggage.weight !== undefined) {
        return `${baggage.weight}${baggage.weightUnit || 'kg'}`;
    }

    return "Check with airline";
};

// --- Details Component ---
const FlightDetails = ({ details, isLoading, error, offer }) => {
    if (isLoading) {
        return <DetailsWrapper><Spinner /></DetailsWrapper>;
    }

    if (error) {
        // Show basic details from the original offer even if pricing failed
        return (
            <DetailsWrapper>
                <ErrorBox>
                    <p>⚠️ Live pricing unavailable at the moment</p>
                    <small>Showing available flight information</small>
                </ErrorBox>

                <AmenitySection>
                    <SubHeader>Flight Information</SubHeader>
                    <BasicInfoList>
                        <InfoRow>
                            <label>Route:</label>
                            <span>{offer?.originCode} → {offer?.destinationCode}</span>
                        </InfoRow>
                        <InfoRow>
                            <label>Departure:</label>
                            <span>{timeHHMM(offer?.departureTime)}</span>
                        </InfoRow>
                        <InfoRow>
                            <label>Arrival:</label>
                            <span>{timeHHMM(offer?.arrivalTime)}</span>
                        </InfoRow>
                        <InfoRow>
                            <label>Duration:</label>
                            <span>{formatDuration(offer?.duration)}</span>
                        </InfoRow>
                        <InfoRow>
                            <label>Cabin:</label>
                            <span>{humanizeClass(offer?.cabin)}</span>
                        </InfoRow>
                        <InfoRow>
                            <label>Airline:</label>
                            <span>{offer?.airlineName || offer?.carrierCode}</span>
                        </InfoRow>
                        {offer?.flightNumber && (
                            <InfoRow>
                                <label>Flight:</label>
                                <span>{offer?.carrierCode} {offer?.flightNumber}</span>
                            </InfoRow>
                        )}
                        <InfoRow>
                            <label>Stops:</label>
                            <span>{offer?.numberOfStops === 0 ? 'Non-stop' : `${offer?.numberOfStops} stop(s)`}</span>
                        </InfoRow>
                    </BasicInfoList>
                </AmenitySection>

                <RetryButton onClick={() => window.location.reload()}>
                    Refresh to try again
                </RetryButton>
            </DetailsWrapper>
        );
    }

    if (!details) {
        return <DetailsWrapper><p>Loading flight details...</p></DetailsWrapper>;
    }

    const flightOffer = details.data?.flightOffers?.[0];
    const travelerPricings = flightOffer?.travelerPricings || [];
    const itinerary = flightOffer?.itineraries?.[0];

    // Extract baggage and amenity info from all segments
    const segmentDetails = [];
    travelerPricings.forEach(traveler => {
        (traveler.fareDetailsBySegment || []).forEach((fareDetail, index) => {
            if (!segmentDetails[index]) {
                segmentDetails[index] = {
                    cabin: fareDetail.cabin,
                    brandedFare: fareDetail.brandedFare,
                    includedBaggage: fareDetail.includedCheckedBags,
                    amenities: fareDetail.amenities || [],
                    meal: null
                };

                // Check for meal in amenities
                const mealAmenity = (fareDetail.amenities || []).find(a =>
                        a.description && (
                            a.description.toLowerCase().includes('meal') ||
                            a.description.toLowerCase().includes('food') ||
                            a.description.toLowerCase().includes('snack') ||
                            a.description.toLowerCase().includes('beverage')
                        )
                );
                if (mealAmenity) {
                    segmentDetails[index].meal = mealAmenity.description;
                }
            }
        });
    });

    // Get included and chargeable amenities from first segment (usually representative)
    const firstSegmentDetails = segmentDetails[0] || {};
    const includedAmenities = firstSegmentDetails.amenities?.filter(a => !a.isChargeable) || [];
    const chargeableAmenities = firstSegmentDetails.amenities?.filter(a => a.isChargeable) || [];

    return (
        <DetailsWrapper>
            {/* Baggage and Meal Summary */}
            <InclusionsGrid>
                <InclusionCard>
                    <InclusionIcon>🧳</InclusionIcon>
                    <InclusionContent>
                        <InclusionTitle>Checked Baggage</InclusionTitle>
                        <InclusionValue>
                            {formatBaggage(firstSegmentDetails.includedBaggage)}
                        </InclusionValue>
                    </InclusionContent>
                </InclusionCard>

                <InclusionCard>
                    <InclusionIcon>🍽️</InclusionIcon>
                    <InclusionContent>
                        <InclusionTitle>Meal Service</InclusionTitle>
                        <InclusionValue>
                            {firstSegmentDetails.meal || "Check with airline"}
                        </InclusionValue>
                    </InclusionContent>
                </InclusionCard>

                <InclusionCard>
                    <InclusionIcon>💺</InclusionIcon>
                    <InclusionContent>
                        <InclusionTitle>Cabin Class</InclusionTitle>
                        <InclusionValue>
                            {humanizeClass(firstSegmentDetails.cabin)}
                        </InclusionValue>
                    </InclusionContent>
                </InclusionCard>

                {firstSegmentDetails.brandedFare && (
                    <InclusionCard>
                        <InclusionIcon>🎫</InclusionIcon>
                        <InclusionContent>
                            <InclusionTitle>Fare Type</InclusionTitle>
                            <InclusionValue>{firstSegmentDetails.brandedFare}</InclusionValue>
                        </InclusionContent>
                    </InclusionCard>
                )}
            </InclusionsGrid>

            <AmenitySection>
                <SubHeader>Flight Itinerary</SubHeader>
                <ItineraryList>
                    {itinerary?.segments?.map((segment, index) => {
                        const aircraftCode = segment.aircraft?.code;
                        const aircraftName = details.data?.dictionaries?.aircraft?.[aircraftCode] || `Aircraft ${aircraftCode || 'TBD'}`;
                        const segDetail = segmentDetails[index] || {};

                        return (
                            <SegmentItem key={segment.id || index}>
                                <div className="flight-path">
                                    <span className="time">{timeHHMM(segment.departure.at)}</span>
                                    <span className="code">{segment.departure.iataCode}</span>
                                    <span className="arrow">→</span>
                                    <span className="time">{timeHHMM(segment.arrival.at)}</span>
                                    <span className="code">{segment.arrival.iataCode}</span>
                                </div>
                                <div className="flight-info">
                                    <span>{segment.carrierCode} {segment.number}</span>
                                    <span className="dot">•</span>
                                    <span>{aircraftName}</span>
                                    <span className="dot">•</span>
                                    <span>{formatDuration(segment.duration)}</span>
                                </div>

                                {/* Per-segment baggage if different */}
                                {segDetail.includedBaggage && index > 0 &&
                                    formatBaggage(segDetail.includedBaggage) !== formatBaggage(firstSegmentDetails.includedBaggage) && (
                                        <div className="segment-details">
                                        <span className="detail-item">
                                            Baggage: {formatBaggage(segDetail.includedBaggage)}
                                        </span>
                                        </div>
                                    )}

                                {segment.stops && segment.stops.length > 0 && (
                                    <div className="stops-info">
                                        {segment.stops.map((stop, stopIdx) => (
                                            <span key={stopIdx} className="stop">
                                                Stop at {stop.iataCode} ({formatDuration(stop.duration)})
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </SegmentItem>
                        );
                    })}
                </ItineraryList>
            </AmenitySection>

            {includedAmenities.length > 0 && (
                <AmenitySection>
                    <SubHeader>Included in Your Fare</SubHeader>
                    <AmenityList>
                        {includedAmenities.map((amenity, index) => (
                            <AmenityItem key={index}>
                                <span className="icon">✅</span>
                                <span>{amenity.description}</span>
                            </AmenityItem>
                        ))}
                    </AmenityList>
                </AmenitySection>
            )}

            {chargeableAmenities.length > 0 && (
                <AmenitySection>
                    <SubHeader>Available for Purchase</SubHeader>
                    <AmenityList>
                        {chargeableAmenities.map((amenity, index) => (
                            <AmenityItem key={index}>
                                <span className="icon">💲</span>
                                <span>{amenity.description}</span>
                            </AmenityItem>
                        ))}
                    </AmenityList>
                </AmenitySection>
            )}
        </DetailsWrapper>
    );
};

// --- OfferCard Component ---
function OfferCard({ offer, airportsMap, isExpanded, onToggleDetails, details, isLoadingDetails, detailsError }) {
    const oCode = offer?.originCode || "—";
    const dCode = offer?.destinationCode || "—";
    const departTime = timeHHMM(offer?.departureTime);
    const arriveTime = timeHHMM(offer?.arrivalTime);
    const oCity = airportsMap[oCode]?.cityName || oCode;
    const dCity = airportsMap[dCode]?.cityName || dCode;
    const airline = offer?.airlineName || offer?.carrierCode || "—";
    const flightId = [offer?.carrierCode, offer?.flightNumber].filter(Boolean).join(" ");
    const duration = formatDuration(offer?.duration);
    const cabin = humanizeClass(offer?.cabin);
    const priceStr = money(offer?.price?.total, offer?.price?.currency);
    const { text: stopsTxt, tone } = stopsBadge(offer?.numberOfStops ?? 0);

    return (
        <CardWrapper>
            <Card onClick={() => onToggleDetails(offer)} role="button" isExpanded={isExpanded}>
                <div className="route">
                    <div className="codes">
                        <span className="code">{oCode}</span>
                        <span className="arrow">→</span>
                        <span className="code">{dCode}</span>
                    </div>
                    <div className="names">
                        <span className="name">{oCity}</span>
                        <span className="sep">—</span>
                        <span className="name">{dCity}</span>
                    </div>
                    <div className="times">
                        <span>{departTime}</span>
                        <span className="sep">—</span>
                        <span>{arriveTime}</span>
                    </div>
                </div>
                <div className="middle">
                    <div className="airline">
                        <strong>{airline}</strong>
                        {flightId && <span className="muted"> • {flightId}</span>}
                    </div>
                    <div className="meta">
                        <span>{duration}</span>
                        <span className="dot">•</span>
                        <span>{cabin}</span>
                    </div>
                </div>
                <div className="right">
                    <div className="price">{priceStr}</div>
                    <div className="stops"><Badge tone={tone}>{stopsTxt}</Badge></div>
                    <button className="cta" onClick={(e) => { e.stopPropagation(); onToggleDetails(offer); }}>
                        {isExpanded ? "Hide details" : "View details"}
                    </button>
                </div>
            </Card>
            {isExpanded && (
                <FlightDetails
                    details={details}
                    isLoading={isLoadingDetails}
                    error={detailsError}
                    offer={offer}
                />
            )}
        </CardWrapper>
    );
}

// --- Main Flight Component ---
export default function Flight({ offers = [], onSelectOffer }) {
    const [expandedId, setExpandedId] = useState(null);
    const [detailsCache, setDetailsCache] = useState({});
    const [airportsMap, setAirportsMap] = useState({});

    const codes = useMemo(() => {
        const set = new Set();
        for (const o of offers) {
            if (o?.originCode) set.add(o.originCode);
            if (o?.destinationCode) set.add(o.destinationCode);
        }
        return Array.from(set).filter(Boolean);
    }, [offers]);

    useEffect(() => {
        let isMounted = true;
        async function go() {
            if (!codes.length) {
                setAirportsMap({});
                return;
            }
            try {
                const r = await fetch(`${BASE}/api/airports?codes=${encodeURIComponent(codes.join(","))}`);
                if (!r.ok) throw new Error(await r.text());
                const json = await r.json();
                if (isMounted) {
                    setAirportsMap(json || {});
                }
            } catch (e) {
                if (isMounted) {
                    setAirportsMap({});
                }
                console.error("Airport lookup error:", e);
            }
        }
        go();
        return () => { isMounted = false; };
    }, [codes]);

    const handleToggleDetails = async (offer) => {
        const offerId = offer.id;

        // If clicking the same card, just collapse it
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

        try {
            setDetailsCache(prev => ({
                ...prev,
                [offerId]: { loading: true, data: null, error: false }
            }));

            const response = await fetch(`${BASE}/api/flights/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(offer.rawOffer),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Pricing API error:', errorText);
                throw new Error('Failed to fetch pricing details');
            }

            const data = await response.json();

            setDetailsCache(prev => ({
                ...prev,
                [offerId]: { loading: false, data: data, error: false }
            }));
        } catch (error) {
            console.error("Error fetching flight details:", error);
            setDetailsCache(prev => ({
                ...prev,
                [offerId]: { loading: false, data: null, error: true }
            }));
        }
    };

    return (
        <List>
            {offers.map((offer) => (
                <OfferCard
                    key={offer.id}
                    offer={offer}
                    airportsMap={airportsMap}
                    isExpanded={expandedId === offer.id}
                    onToggleDetails={handleToggleDetails}
                    details={detailsCache[offer.id]?.data}
                    isLoadingDetails={detailsCache[offer.id]?.loading}
                    detailsError={detailsCache[offer.id]?.error}
                />
            ))}
            {offers.length === 0 && <Empty>No flights to show.</Empty>}
        </List>
    );
}

/* --- Styles --- */
const slideDown = keyframes`
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
`;
const List = styled.div`display:grid; gap:.75rem;`;
const Empty = styled.div`padding:1rem; border-radius:.75rem; background:#f8fafc; border:1px solid #e2e8f0; color:#475569; font-weight:600;`;
const CardWrapper = styled.div`
    background:#fff; border:1px solid #e6edf5; border-radius:.9rem;
    box-shadow:0 6px 16px rgba(2,62,138,.06); transition: all 0.2s ease-in-out;
    &:hover { box-shadow: 0 8px 24px rgba(2, 62, 138, 0.1); transform: translateY(-1px); }
`;
const Card = styled.div`
    display:grid; grid-template-columns:1fr 1.2fr auto; gap:1rem; align-items:center;
    padding:1rem; cursor:pointer; transition: background-color 0.2s;
    &:hover { background-color: #f8fbff; }
    .route .codes{ font-weight:900; letter-spacing:.6px; font-size:1.05rem; }
    .route .arrow{ margin:0 6px; color:#64748b; }
    .route .names,.route .times{ color:#64748b; margin-top:4px; font-weight:600; display:flex; gap:6px; flex-wrap:wrap; }
    .route .sep{ color:#94a3b8; }
    .middle .airline{ font-size:1.05rem; }
    .middle .muted{ color:#475569; font-weight:500; }
    .middle .meta{ margin-top:4px; color:#64748b; display: flex; align-items: center; flex-wrap: wrap; }
    .middle .dot{ margin:0 6px; color:#cbd5e1; }
    .right{ display:grid; justify-items:end; gap:.4rem; }
    .right .price{ font-weight:900; font-size:1.05rem; }
    .right .stops{ margin-top:2px; }
    .cta{ 
        margin-top:6px; border:none; background:#1d4ed8; color:#fff; 
        padding:.4rem .8rem; border-radius:.5rem; font-weight:700; 
        transition: background-color 0.2s;
        &:hover { background:#1e40af; }
    }
    @media (max-width:720px){ grid-template-columns:1fr; justify-items:start; .right{ justify-items:start; } }
`;
const DetailsWrapper = styled.div`
    padding: 1rem; padding-top: 0; animation: ${slideDown} 0.3s ease-out;
`;
const InclusionsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-top: 1rem;
`;
const InclusionCard = styled.div`
    display: flex;
    gap: .8rem;
    padding: 1rem;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: .75rem;
`;
const InclusionIcon = styled.span`
    font-size: 1.8rem;
    line-height: 1;
`;
const InclusionContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: .2rem;
`;
const InclusionTitle = styled.div`
    font-size: .85rem;
    color: #64748b;
    font-weight: 600;
`;
const InclusionValue = styled.div`
    font-weight: 700;
    color: #0b7285;
`;
const ErrorBox = styled.div`
    background: #fef3c7; border: 1px solid #fbbf24; border-radius: .75rem;
    padding: 1rem; margin-bottom: 1rem;
    p { margin: 0; color: #92400e; font-weight: 600; }
    small { color: #b45309; }
`;
const BasicInfoList = styled.div`
    display: grid; gap: .6rem;
`;
const InfoRow = styled.div`
    display: flex; gap: .8rem; padding: .4rem 0;
    label { font-weight: 600; color: #64748b; min-width: 100px; }
    span { color: #334155; }
`;
const RetryButton = styled.button`
    background: #0ea5e9; color: white; border: none; padding: .6rem 1.2rem;
    border-radius: .5rem; font-weight: 600; cursor: pointer; margin-top: 1rem;
    &:hover { background: #0284c7; }
`;
const AmenityList = styled.ul`
    list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem;
    .hint { color: #64748b; font-style: italic; }
`;
const AmenityItem = styled.li`
    display: flex; align-items: center; gap: .5rem;
    .icon { font-size: 1.2rem; }
`;
const Spinner = styled.div`
    border: 4px solid #f3f3f3; border-top: 4px solid #0ea5e9; border-radius: 50%;
    width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 1rem auto;
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;
const AmenitySection = styled.div`
    & + & { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
`;
const SubHeader = styled.h5`
    font-size: 1rem; font-weight: 700; color: #334155; margin: 0 0 .8rem;
`;
const ItineraryList = styled.ul`
    list-style: none; margin: 0; padding: 0; display: grid; gap: 1rem;
`;
const SegmentItem = styled.li`
    padding: .8rem; border: 1px solid #e2e8f0; border-radius: .75rem; background: #f8fafc;
    .flight-path { display: flex; align-items: center; gap: .6rem; font-weight: 600; }
    .flight-path .code { font-weight: 700; color: #0b7285; }
    .flight-path .arrow { color: #94a3b8; }
    .flight-info { margin-top: .3rem; display: flex; align-items: center; gap: .5rem; color: #64748b; font-size: .9rem; }
    .flight-info .dot { color: #cbd5e1; }
    .segment-details { margin-top: .5rem; }
    .detail-item { display: inline-block; background: #dbeafe; color: #1e40af; padding: .2rem .5rem; border-radius: .3rem; font-size: .85rem; margin-right: .5rem; }
    .stops-info { margin-top: .5rem; }
    .stop { display: inline-block; background: #fef3c7; color: #92400e; padding: .2rem .5rem; border-radius: .3rem; font-size: .85rem; margin-right: .5rem; }
`;