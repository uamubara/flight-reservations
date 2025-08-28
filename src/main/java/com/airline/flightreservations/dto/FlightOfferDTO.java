package com.airline.flightreservations.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

/**
 * Represents a flight offer for the UI.
 * This DTO serves a dual purpose:
 * 1. It contains the full, detailed structure using other DTOs (ItineraryDTO, PriceDTO).
 * 2. It also provides simple, top-level "summary" fields (airlineName, cabin, etc.)
 * for fast and easy rendering of search result cards.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FlightOfferDTO {

    public String id;
    public PriceDTO price;
    public List<String> validatingAirlines;
    public List<ItineraryDTO> itineraries;
    public JsonNode rawOffer; // The raw Amadeus JSON, for the stateless booking flow

    // --- Summary Fields for UI  ---
    public String airlineName;
    public String carrierCode;
    public String flightNumber;
    public String cabin;
    public Integer numberOfStops;
    public String duration;
    public String originCode;
    public String destinationCode;
    public String departureTime;
    public String arrivalTime;


}

