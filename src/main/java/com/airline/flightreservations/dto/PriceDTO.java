package com.airline.flightreservations.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Compact price info */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PriceDTO {
    public String currency; // "USD"
    public String total;    // "312.45"
}
