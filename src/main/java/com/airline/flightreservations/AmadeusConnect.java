package com.airline.flightreservations;

import com.amadeus.Amadeus;
import com.amadeus.Params;
import com.amadeus.resources.FlightOfferSearch;
import com.amadeus.resources.Location;
import com.google.gson.JsonObject;

import com.amadeus.referenceData.Locations;
import com.amadeus.exceptions.ResponseException;
import com.amadeus.resources.FlightPrice;
import com.amadeus.resources.FlightOrder;
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


    // Location Search
    public Location[] location(String keyword) throws ResponseException {
        return amadeus.referenceData.locations.get(
                Params.with("keyword", keyword)
                        .and("subType", Locations.AIRPORT)
        );
    }

    // Flight Search
    public FlightOfferSearch[] flights(String origin, String destination,
                                       String departDate, String adults,
                                       String returnDate, int maxResults) throws ResponseException {

        Params params = Params.with("originLocationCode", origin)
                .and("destinationLocationCode", destination)
                .and("departureDate", departDate)
                .and("adults", adults)
                .and("max", maxResults);

        if (returnDate != null && !returnDate.isEmpty()) {
            params.and("returnDate", returnDate);
        }

        return amadeus.shopping.flightOffersSearch.get(params);
    }

    // Confirm Flight Price
    public FlightPrice confirm(FlightOfferSearch offer) throws ResponseException {
        return amadeus.shopping.flightOffersSearch.pricing.post(offer);
    }

    // Place Flight Order
    public FlightOrder order(JsonObject order) throws ResponseException {
        return amadeus.booking.flightOrders.post(order);
    }
}