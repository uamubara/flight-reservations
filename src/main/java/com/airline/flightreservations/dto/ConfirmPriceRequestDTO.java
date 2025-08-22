package com.airline.flightreservations.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import javax.validation.constraints.NotNull;

/**
 * Client sends back the raw Amadeus offer JSON that returned (for a single selected offer).
 * I did this to keep my flow stateless and easy to deploy on AWS.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConfirmPriceRequestDTO {
    @NotNull public JsonNode offer; // the original Amadeus FlightOffer JSON for the chosen option
}

