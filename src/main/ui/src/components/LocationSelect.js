import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { MapPin, Plane } from "lucide-react";

// API base URL from environment variables
const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

/**
 * LocationSelect Component
 *
 * A predictive airport search dropdown that integrates with Amadeus API.
 * Features:
 * - Real-time search as user types
 * - Geolocation-based nearby airport suggestions
 * - Cached results to minimize API calls
 *
 * @param {string} label - Label text for the input field
 * @param {string} placeholder - Placeholder text for the input
 * @param {object} value - Selected airport value {code, display}
 * @param {function} onChange - Callback when airport is selected
 * @param {boolean} suggestCurrentLocation - Whether to show nearby airports
 */
export default function LocationSelect({ label, placeholder, value, onChange, suggestCurrentLocation }) {
    // State management
    const [open, setOpen] = useState(false);                    // Controls dropdown visibility
    const [items, setItems] = useState([]);                     // Search results from API
    const [loading, setLoading] = useState(false);              // Loading state for API calls
    const [nearbyAirports, setNearbyAirports] = useState([]);   // Airports near user's location
    const [userLocation, setUserLocation] = useState(null);     // User's geographic coordinates

    // Refs for DOM manipulation and data persistence
    const boxRef = useRef(null);                                // Reference to dropdown container
    const cache = useRef({});                                   // Cache for search results
    const locationFetched = useRef(false);                      // Prevents duplicate location requests

    // Extract display value from value object
    const query = value?.display || "";

    /**
     * Effect: Handle clicks outside dropdown to close it
     * Cleanup removes event listener on unmount
     */
    useEffect(() => {
        const onDoc = (e) => {
            if (!boxRef.current?.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    /**
     * Fetch nearby airports based on user's current location
     * Uses browser's Geolocation API and Amadeus nearest-airport endpoint
     */
    const fetchNearbyAirports = () => {
        // Only fetch once and only if feature is enabled
        if (!suggestCurrentLocation || locationFetched.current) return;

        locationFetched.current = true;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        setUserLocation({ latitude, longitude });

                        // Call backend API to get nearest airports
                        const r = await fetch(
                            `${BASE}/api/nearest-airport?latitude=${latitude}&longitude=${longitude}`
                        );

                        if (!r.ok) throw new Error("Failed to fetch nearby airports");

                        const data = await r.json();

                        // Map API response to component format, limit to top 3
                        const airports = Array.isArray(data) ? data.slice(0, 3).map((loc) => ({
                            code: loc.iataCode,
                            city: loc.city,
                            country: loc.countryCode,
                            name: loc.name,
                        })) : [];

                        setNearbyAirports(airports);
                    } catch (e) {
                        console.error("Failed to fetch nearby airports:", e);
                        setNearbyAirports([]);
                    }
                },
                (error) => {
                    // User denied geolocation permission or error occurred
                    console.warn("Geolocation denied:", error.message);
                    setNearbyAirports([]);
                }
            );
        }
    };

    /**
     * Effect: Fetch airport search results as user types
     * Features:
     * - 300ms debounce to reduce API calls
     * - Caching to prevent duplicate requests
     * - Minimum 2 characters before searching
     */
    useEffect(() => {
        setItems([]);

        // Don't search if query is too short
        if (!query || query.length < 2) {
            return;
        }

        // Debounce search requests
        const debounceTimer = setTimeout(() => {
            async function fetchData() {
                // Return cached results if available
                if (cache.current[query]) {
                    setItems(cache.current[query]);
                    return;
                }

                try {
                    setLoading(true);

                    // Call Amadeus locations API
                    const r = await fetch(
                        `${BASE}/api/locations?keyword=${encodeURIComponent(query)}`
                    );

                    if (!r.ok) throw new Error("Search failed");

                    const data = await r.json();

                    // Transform API response to component format
                    const list = Array.isArray(data) ? data.map((loc) => ({
                        code: loc.iataCode,
                        city: loc.city,
                        country: loc.countryCode,
                        name: loc.name,
                    })).filter(item => item.code && item.name) : [];

                    // Cache results for future use
                    cache.current[query] = list;
                    setItems(list);
                } catch (e) {
                    console.error("Airport search error:", e);
                    setItems([]);
                } finally {
                    setLoading(false);
                }
            }
            fetchData();
        }, 300); // 300ms debounce delay

        // Cleanup: cancel pending search on new input
        return () => clearTimeout(debounceTimer);
    }, [query]);

    /**
     * Handle airport selection
     * Updates parent component and closes dropdown
     *
     * @param {object} airport - Selected airport object
     */
    const pick = (airport) => {
        onChange?.({
            code: airport.code,
            display: `${airport.city} (${airport.code})`
        });
        setOpen(false);
    };

    return (
        <Box ref={boxRef}>
            {/* Input label */}
            <label>{label}</label>

            {/* Search input field */}
            <input
                placeholder={placeholder}
                value={query}
                onChange={(e) => {
                    // Update value and open dropdown
                    onChange?.({ code: "", display: e.target.value });
                    setOpen(true);
                }}
                onFocus={() => {
                    // Open dropdown and fetch nearby airports
                    setOpen(true);
                    fetchNearbyAirports();
                }}
                autoComplete="off"
            />

            {/* Dropdown results list */}
            {open && (
                <List role="listbox">
                    {/* Loading indicator */}
                    {loading && <LoadingItem>Searching…</LoadingItem>}

                    {/* Current Location Section - shown when no search query */}
                    {nearbyAirports.length > 0 && !query && (
                        <>
                            <Header>
                                <MapPin size={16} />
                                <span>Current location</span>
                            </Header>
                            {nearbyAirports.map((airport, index) => (
                                <ListItem key={`nearby-${airport.code}-${index}`} onClick={() => pick(airport)}>
                                    <LocationInfo>
                                        <MainText>{airport.city}, {airport.country}</MainText>
                                        <SubText>{airport.name}</SubText>
                                    </LocationInfo>
                                    <BadgeContainer>
                                        <Plane size={16} className="plane-icon" />
                                        <IataCode>{airport.code}</IataCode>
                                    </BadgeContainer>
                                </ListItem>
                            ))}
                        </>
                    )}

                    {/* All Locations Section - search results */}
                    {items.length > 0 && (
                        <>
                            <Header>
                                <MapPin size={16} />
                                <span>All locations</span>
                            </Header>
                            {items.map((airport, index) => (
                                <ListItem key={`search-${airport.code}-${index}`} onClick={() => pick(airport)}>
                                    <LocationInfo>
                                        <MainText>{airport.city}, {airport.country}</MainText>
                                        <SubText>{airport.name}</SubText>
                                    </LocationInfo>
                                    <BadgeContainer>
                                        <Plane size={16} className="plane-icon" />
                                        <IataCode>{airport.code}</IataCode>
                                    </BadgeContainer>
                                </ListItem>
                            ))}
                        </>
                    )}

                    {/* Empty state when search returns no results */}
                    {!loading && items.length === 0 && query && (
                        <EmptyState>No airports found</EmptyState>
                    )}

                    {/* Empty state when dropdown first opens */}
                    {!loading && !query && nearbyAirports.length === 0 && (
                        <EmptyState>Start typing to search for airports</EmptyState>
                    )}
                </List>
            )}
        </Box>
    );
}

/* ============================================
   STYLED COMPONENTS
   Professional, accessible styling
   ============================================ */

/**
 * Main container for the component
 */
const Box = styled.div`
    position: relative;
    display: grid;
    gap: .35rem;
    
    label {
        font-weight: 700;
        color: #0b7285;
    }
    
    input {
        border: 1px solid #e6edf5;
        border-radius: .65rem;
        padding: .6rem .75rem;
        font-size: 1rem;
        transition: border-color 0.2s;
        
        &:focus {
            outline: none;
            border-color: #0ea5e9;
        }
    }
`;

/**
 * Dropdown list container
 */
const List = styled.ul`
    position: absolute;
    z-index: 20;
    left: 0;
    right: 0;
    top: calc(100% + 6px);
    background: #fff;
    border: 1px solid #e6edf5;
    border-radius: .65rem;
    max-height: 400px;
    overflow-y: auto;
    box-shadow: 0 12px 28px rgba(2, 62, 138, .08);
    margin: 0;
    padding: .3rem;
    list-style: none;
`;

/**
 * Section headers (e.g., "Current location", "All locations")
 */
const Header = styled.li`
    padding: .8rem .8rem .4rem;
    color: #64748b;
    font-weight: 600;
    font-size: .9rem;
    display: flex;
    align-items: center;
    gap: .5rem;
    cursor: default;
    
    svg {
        color: #64748b;
    }
`;

/**
 * Individual airport result item
 */
const ListItem = styled.li`
    padding: .75rem .8rem;
    border-radius: .5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .8rem;
    transition: background-color 0.15s;
    border-bottom: 1px solid #f1f5f9;

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        background: #f6fbff;
    }
`;

/**
 * Container for airport name and location text
 */
const LocationInfo = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-width: 0;
`;

/**
 * Primary text - City and Country
 */
const MainText = styled.span`
    font-weight: 600;
    color: #334155;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

/**
 * Secondary text - Airport name
 */
const SubText = styled.span`
    color: #64748b;
    font-size: 0.9rem;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

/**
 * Container for plane icon and IATA code badge
 */
const BadgeContainer = styled.div`
    display: flex;
    align-items: center;
    gap: .4rem;
    flex-shrink: 0;

    .plane-icon {
        color: #64748b;
    }
`;

/**
 * IATA code badge (e.g., "IAH", "JFK")
 */
const IataCode = styled.span`
    font-weight: 700;
    color: #fff;
    background-color: #0ea5e9;
    padding: .3rem .6rem;
    border-radius: .4rem;
    font-size: 0.85rem;
    letter-spacing: 0.5px;
`;

/**
 * Loading state indicator
 */
const LoadingItem = styled.li`
    padding: 1rem;
    color: #64748b;
    text-align: center;
    cursor: default;
`;

/**
 * Empty state message
 */
const EmptyState = styled.li`
    padding: 1rem;
    color: #64748b;
    text-align: center;
    cursor: default;
`;