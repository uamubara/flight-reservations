package com.airline.flightreservations.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Slim airport/location info for search/autocomplete */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LocationDTO {
    public String iataCode;     // ex. "IAH"
    public String name;         // "George Bush Intercontinental"
    public String city;         // "Houston"
    public String countryCode;  // "US"
    public Double latitude;     // 29.98695
    public Double longitude;    // -95.34222
}
