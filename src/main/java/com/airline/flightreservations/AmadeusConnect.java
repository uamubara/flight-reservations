package com.airline.flightreservations;

import com.amadeus.Amadeus;
import com.amadeus.Params;
import com.amadeus.exceptions.ResponseException;
import com.amadeus.referenceData.Locations;
import com.amadeus.resources.Airline;
import com.amadeus.resources.FlightOfferSearch;
import com.amadeus.resources.FlightOrder;
import com.amadeus.resources.FlightPrice;
import com.amadeus.resources.Location;

import com.airline.flightreservations.dto.AirportDTO;
import com.google.gson.JsonObject;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;



@Component
public class AmadeusConnect {
    private final Amadeus amadeus;

    public AmadeusConnect(
            @Value("${amadeus.api-key}") String apiKey,
            @Value("${amadeus.api-secret}") String apiSecret) {

        if (apiKey == null || apiKey.isBlank() || apiSecret == null || apiSecret.isBlank()) {
            throw new IllegalStateException(
                    "Missing Amadeus credentials. Set AMADEUS_API_KEY and AMADEUS_API_SECRET.");
        }
        this.amadeus = Amadeus.builder(apiKey.trim(), apiSecret.trim()).build();
    }


    public Location[] location(String keyword) throws ResponseException {
        return amadeus.referenceData.locations.get(
                Params.with("keyword", keyword)
                        .and("subType", Locations.AIRPORT)
        );
    }

    private static AirportDTO toAirportDTO(Location loc) {
        String code = loc.getIataCode();
        String city = loc.getAddress() != null ? loc.getAddress().getCityName() : null;
        String airportName = loc.getName();
        String country = loc.getAddress() != null ? loc.getAddress().getCountryCode() : null;
        String tz = loc.getTimeZoneOffset();
        return new AirportDTO(code, city, airportName, country, tz);
    }

    public AirportDTO resolveAirportByCode(String code) throws ResponseException {
        if (code == null || code.isEmpty()) return null;
        Location[] results = amadeus.referenceData.locations.get(
                Params.with("keyword", code)
                        .and("subType", Locations.AIRPORT)
        );
        if (results == null || results.length == 0) return null;

        for (Location loc : results) {
            if (code.equalsIgnoreCase(loc.getIataCode())) {
                return toAirportDTO(loc);
            }
        }
        return toAirportDTO(results[0]);
    }


    public FlightOfferSearch[] flights(
            String origin,
            String destination,
            String departDate,
            String adults,
            // --- Add children and infants parameters ---
            int children,
            int infants,
            String returnDate,
            String travelClass,
            String currencyCode,
            int maxResults
    ) throws ResponseException {

        Params params = Params.with("originLocationCode", origin)
                .and("destinationLocationCode", destination)
                .and("departureDate", departDate)
                .and("adults", adults)
                .and("max", maxResults);

        // --- NEW: Add children and infants to the API request if they are greater than 0 ---
        if (children > 0) {
            params.and("children", children);
        }
        if (infants > 0) {
            params.and("infants", infants);
        }

        if (returnDate != null && !returnDate.isBlank()) {
            params.and("returnDate", returnDate);
        }

        if (travelClass != null && !travelClass.isBlank()) {
            String tc = travelClass.trim().replace(' ', '_').toUpperCase();
            params.and("travelClass", tc);
        }

        if (currencyCode != null && currencyCode.matches("(?i)^[A-Z]{3}$")) {
            params.and("currencyCode", currencyCode.toUpperCase());
        }

        return amadeus.shopping.flightOffersSearch.get(params);
    }


    public Airline[] airlines(String codesCsv) throws ResponseException {
        return amadeus.referenceData.airlines.get(Params.with("airlineCodes", codesCsv));
    }

    public FlightPrice confirm(FlightOfferSearch offer) throws ResponseException {
        return amadeus.shopping.flightOffersSearch.pricing.post(offer);
    }

    public FlightOrder order(JsonObject order) throws ResponseException {
        return amadeus.booking.flightOrders.post(order);
    }
}