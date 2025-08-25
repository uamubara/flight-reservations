package com.airline.flightreservations;

import com.airline.flightreservations.dto.*;
import com.amadeus.resources.*;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/** Maps Amadeus SDK objects to our rich DTO for the frontend. */
final class AmadeusMapper {
    private AmadeusMapper() {}

    static List<LocationDTO> toLocationDTOs(Location[] locations) {
        if (locations == null) return List.of();
        List<LocationDTO> out = new ArrayList<>();
        for (Location loc : locations) {
            if (loc == null) continue;
            LocationDTO dto = new LocationDTO();
            try { dto.iataCode = loc.getIataCode(); } catch (Exception ignored) {}
            try { dto.name = loc.getName(); } catch (Exception ignored) {}
            try { dto.city = loc.getAddress().getCityName(); } catch (Exception ignored) {}
            try { dto.countryCode = loc.getAddress().getCountryCode(); } catch (Exception ignored) {}
            try { dto.latitude = loc.getGeoCode().getLatitude(); } catch (Exception ignored) {}
            try { dto.longitude = loc.getGeoCode().getLongitude(); } catch (Exception ignored) {}
            out.add(dto);
        }
        return out;
    }

    /**
     * Creates a list of rich FlightOfferDTOs.
     * @param offers The original offers from the Amadeus SDK.
     * @param airlineNames A map of IATA codes to airline names for enrichment.
     * @param rawOffers A list of raw JsonNode objects for passthrough to the confirmation step.
     * @return A list of DTOs ready for the frontend.
     */
    static List<FlightOfferDTO> toFlightOfferDTOs(FlightOfferSearch[] offers, Map<String, String> airlineNames, List<JsonNode> rawOffers) {
        if (offers == null) return List.of();
        List<FlightOfferDTO> out = new ArrayList<>();

        for (int i = 0; i < offers.length; i++) {
            FlightOfferSearch offer = offers[i];
            if (offer == null) continue;

            FlightOfferDTO dto = new FlightOfferDTO();
            // Attach the raw JSON. This is critical for a stateless confirmation process.
            dto.rawOffer = rawOffers.get(i);

            try {
                // --- Populate Original Detailed Structure ---
                dto.id = offer.getId();
                PriceDTO price = new PriceDTO();
                price.total = String.valueOf(offer.getPrice().getTotal());
                price.currency = offer.getPrice().getCurrency();
                dto.price = price;

                // --- Populate New Summary Fields ---
                if (offer.getItineraries() != null && offer.getItineraries().length > 0) {
                    FlightOfferSearch.Itinerary firstItinerary = offer.getItineraries()[0];
                    dto.duration = firstItinerary.getDuration();

                    if (firstItinerary.getSegments() != null && firstItinerary.getSegments().length > 0) {
                        FlightOfferSearch.SearchSegment firstSegment = firstItinerary.getSegments()[0];
                        FlightOfferSearch.SearchSegment lastSegment = firstItinerary.getSegments()[firstItinerary.getSegments().length - 1];

                        String carrierCode = firstSegment.getCarrierCode();
                        dto.carrierCode = carrierCode;
                        // Enrich with the full airline name fetched earlier.
                        dto.airlineName = airlineNames.getOrDefault(carrierCode, carrierCode);
                        dto.flightNumber = firstSegment.getNumber();
                        dto.numberOfStops = Math.max(0, firstItinerary.getSegments().length - 1);
                        dto.originCode = firstSegment.getDeparture().getIataCode();
                        dto.destinationCode = lastSegment.getArrival().getIataCode();
                        dto.departureTime = firstSegment.getDeparture().getAt();
                        dto.arrivalTime = lastSegment.getArrival().getAt();
                    }
                }

                if (offer.getTravelerPricings() != null && offer.getTravelerPricings().length > 0) {
                    FlightOfferSearch.TravelerPricing travelerPricing = offer.getTravelerPricings()[0];
                    if (travelerPricing.getFareDetailsBySegment() != null && travelerPricing.getFareDetailsBySegment().length > 0) {
                        dto.cabin = travelerPricing.getFareDetailsBySegment()[0].getCabin();
                    }
                }
            } catch (Exception ignored) {
                // Be resilient to unexpected changes in the Amadeus response.
            }
            out.add(dto);
        }
        return out;
    }
}