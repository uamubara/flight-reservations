package com.airline.flightreservations.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.List;

/**
 * Minimal booking payload: selected offer + travelers.
 * will add payment/contact emails later.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderRequestDTO {
    @NotNull public JsonNode offer;              // same raw Amadeus offer JSON used for confirm
    @NotNull @Size(min = 1)
    public List<TravelerDTO> travelers;          // 1..N travelers
}

