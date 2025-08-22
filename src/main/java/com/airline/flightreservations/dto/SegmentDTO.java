package com.airline.flightreservations.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/** One flight leg between two airports */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SegmentDTO {
    public String carrierCode;     // "UA"
    public String flightNumber;    // "1234"
    public String departureIata;   // "HOU"
    public String departureAt;     // ISO-8601
    public String arrivalIata;     // "JFK"
    public String arrivalAt;       // ISO-8601
    public String duration;        // "PT3H25M"
    public Integer numberOfStops;  // 0, 1, ...
}
