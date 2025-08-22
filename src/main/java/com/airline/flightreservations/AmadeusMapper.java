package com.airline.flightreservations;

import com.airline.flightreservations.dto.*;
import com.amadeus.resources.*;
import java.util.*;
import java.util.stream.Collectors;
import com.amadeus.resources.FlightOfferSearch;
import com.amadeus.resources.FlightOfferSearch.Itinerary;
import com.amadeus.resources.FlightOfferSearch.SearchSegment;


/** Maps Amadeus SDK objects to DTOs (faster JSON, stable shape) */
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

    static List<FlightOfferDTO> toFlightOfferDTOs(FlightOfferSearch[] offers) {
        if (offers == null) return List.of();
        List<FlightOfferDTO> out = new ArrayList<>();
        for (FlightOfferSearch offer : offers) {
            if (offer == null) continue;

            FlightOfferDTO dto = new FlightOfferDTO();
            try { dto.id = offer.getId(); } catch (Exception ignored) {}

            // price
            PriceDTO price = new PriceDTO();
            try { price.total = String.valueOf(offer.getPrice().getTotal()); } catch (Exception ignored) {}
            try { price.currency = offer.getPrice().getCurrency(); } catch (Exception ignored) {}
            dto.price = price;

            // validating airlines
            try {
                String[] codes = offer.getValidatingAirlineCodes();
                dto.validatingAirlines = (codes == null) ? List.of() : Arrays.asList(codes);
            } catch (Exception ignored) {}

            // itineraries
            try {
                FlightOfferSearch.Itinerary[] its = offer.getItineraries();
                if (its != null) {
                    dto.itineraries = Arrays.stream(its).map(it -> {
                        ItineraryDTO itDto = new ItineraryDTO();
                        try { itDto.duration = it.getDuration(); } catch (Exception ignored) {}

                        try {
                            FlightOfferSearch.SearchSegment[] segs = it.getSegments();
                            if (segs != null) {
                                itDto.segments = Arrays.stream(segs).map(s -> {
                                    SegmentDTO sDto = new SegmentDTO();
                                    try { sDto.carrierCode = s.getCarrierCode(); } catch (Exception ignored) {}
                                    try { sDto.flightNumber = s.getNumber(); } catch (Exception ignored) {}
                                    try { sDto.departureIata = s.getDeparture().getIataCode(); } catch (Exception ignored) {}
                                    try { sDto.departureAt = s.getDeparture().getAt(); } catch (Exception ignored) {}
                                    try { sDto.arrivalIata = s.getArrival().getIataCode(); } catch (Exception ignored) {}
                                    try { sDto.arrivalAt = s.getArrival().getAt(); } catch (Exception ignored) {}
                                    try { sDto.duration = s.getDuration(); } catch (Exception ignored) {}
                                    try { sDto.numberOfStops = s.getNumberOfStops(); } catch (Exception ignored) {}
                                    return sDto;
                                }).collect(Collectors.toList());
                            }
                        } catch (Exception ignored) {}

                        return itDto;
                    }).collect(Collectors.toList());
                }
            } catch (Exception ignored) {}

            out.add(dto);
        }
        return out;
    }
}
