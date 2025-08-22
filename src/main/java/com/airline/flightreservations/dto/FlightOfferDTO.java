package com.airline.flightreservations.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/** Compact flight offer for search results */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FlightOfferDTO {
    public String id;                         // offer id (string from Amadeus)
    public PriceDTO price;                    // total + currency
    public List<String> validatingAirlines;   // ["UA"]
    public List<ItineraryDTO> itineraries;    // outbound/return
}

