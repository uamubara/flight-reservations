package com.airline.flightreservations;

import com.airline.flightreservations.dto.TravelerDTO;
import com.airline.flightreservations.dto.FlightOfferDTO;
import com.airline.flightreservations.dto.LocationDTO;
import com.airline.flightreservations.dto.AirportDTO;

import com.amadeus.exceptions.ResponseException;
import com.amadeus.resources.FlightOfferSearch;
import com.amadeus.resources.FlightPrice;
import com.amadeus.resources.Location;
import com.amadeus.resources.Traveler;
import com.amadeus.resources.FlightOrder;
import com.google.gson.JsonObject;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import org.springframework.validation.BindingResult;

import java.util.*;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final AmadeusConnect amadeusConnect;
    private final ObjectMapper objectMapper;

    @Autowired
    public ApiController(AmadeusConnect amadeusConnect, ObjectMapper objectMapper) {
        this.amadeusConnect = amadeusConnect;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GetMapping("/locations")
    public ResponseEntity<?> locations(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "false") boolean raw
    ) {
        try {
            Location[] results = amadeusConnect.location(keyword);

            if (raw) {
                if (results != null && results.length > 0 && results[0].getResponse() != null) {
                    String json = results[0].getResponse().getResult().toString();
                    Object asMap = objectMapper.readValue(json, Object.class);
                    return ResponseEntity.ok(asMap);
                }
                return ResponseEntity.ok(Map.of("data", List.of()));
            }

            List<LocationDTO> dto = AmadeusMapper.toLocationDTOs(results);
            return ResponseEntity.ok(dto);

        } catch (ResponseException re) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Error fetching locations", "details", re.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process locations", "details", ex.getMessage()));
        }
    }

    private final Map<String, AirportDTO> airportCache = new ConcurrentHashMap<>();
    @GetMapping("/airports")
    public ResponseEntity<?> airports(@RequestParam String codes) {
        try {
            List<String> list = Arrays.stream(codes.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(String::toUpperCase)
                    .distinct()
                    .collect(Collectors.toList());

            Map<String, AirportDTO> out = new LinkedHashMap<>();
            for (String c : list) {
                AirportDTO dto = airportCache.get(c);
                if (dto == null) {
                    dto = amadeusConnect.resolveAirportByCode(c);
                    if (dto != null) airportCache.put(c, dto);
                }
                if (dto != null) out.put(c, dto);
            }
            return ResponseEntity.ok(out);
        } catch (ResponseException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error resolving airports: " + e.getMessage());
        }
    }

    @GetMapping("/flights")
    public ResponseEntity<?> flights(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam String departDate,
            @RequestParam String adults,
            @RequestParam(defaultValue = "0") int children,
            @RequestParam(defaultValue = "0") int infants,
            @RequestParam(required = false) String returnDate,
            @RequestParam(defaultValue = "10") int maxResults,
            @RequestParam(defaultValue = "false") boolean raw,
            @RequestParam(defaultValue = "USD") String currencyCode,
            @RequestParam(required = false) String travelClass
    ) {
        try {
            FlightOfferSearch[] offers = amadeusConnect.flights(
                    origin, destination, departDate, adults, children, infants, returnDate, travelClass, currencyCode, maxResults
            );

            if (raw) {
                if (offers != null && offers.length > 0 && offers[0].getResponse() != null) {
                    String json = offers[0].getResponse().getResult().toString();
                    Object asMap = objectMapper.readValue(json, Object.class);
                    return ResponseEntity.ok(asMap);
                }
                return ResponseEntity.ok(Map.of("data", List.of()));
            }

            Map<String, String> airlineNames = new HashMap<>();
            List<JsonNode> rawOffersList = new ArrayList<>();

            if (offers != null && offers.length > 0) {
                // --- THIS IS THE CORRECTED LINE ---
                // Convert the Amadeus SDK's Gson object to a String before parsing it with Jackson's ObjectMapper.
                JsonNode rawResultNode = objectMapper.readTree(offers[0].getResponse().getResult().toString());
                ArrayNode dataArray = (ArrayNode) rawResultNode.get("data");
                if (dataArray != null) {
                    dataArray.forEach(rawOffersList::add);
                }

                Set<String> airlineCodes = Arrays.stream(offers)
                        .filter(Objects::nonNull)
                        .flatMap(offer -> Arrays.stream(offer.getItineraries()))
                        .filter(Objects::nonNull)
                        .flatMap(itinerary -> Arrays.stream(itinerary.getSegments()))
                        .filter(Objects::nonNull)
                        .map(FlightOfferSearch.SearchSegment::getCarrierCode)
                        .collect(Collectors.toSet());

                if (!airlineCodes.isEmpty()) {
                    airlineNames = airlines(String.join(",", airlineCodes));
                }
            }

            List<FlightOfferDTO> dto = AmadeusMapper.toFlightOfferDTOs(offers, airlineNames, rawOffersList);
            return ResponseEntity.ok(dto);

        } catch (ResponseException re) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Error fetching flights", "details", re.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process flights", "details", ex.getMessage()));
        }
    }

    @GetMapping("/airlines")
    public Map<String,String> airlines(@RequestParam String codes) throws ResponseException {
        var arr = amadeusConnect.airlines(codes);
        Map<String,String> map = new HashMap<>();
        if (arr != null) {
            for (var a : arr) {
                String name = a.getBusinessName();
                if (name == null || name.isBlank()) name = a.getCommonName();
                map.put(a.getIataCode(), name != null ? name : a.getIataCode());
            }
        }
        return map;
    }

    @PostMapping("/flights/confirm")
    public ResponseEntity<?> confirm(@RequestBody JsonNode offerJson) {
        try {
            FlightOfferSearch selectedOffer = objectMapper.treeToValue(offerJson, FlightOfferSearch.class);
            FlightPrice priced = amadeusConnect.confirm(selectedOffer);

            if (priced != null && priced.getResponse() != null) {
                String json = priced.getResponse().getResult().toString();
                Object asMap = objectMapper.readValue(json, Object.class);
                return ResponseEntity.ok(asMap);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Empty pricing response"));
        } catch (ResponseException re) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Error confirming price", "details", re.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process pricing", "details", ex.getMessage()));
        }
    }

    @PostMapping("/traveler")
    public ResponseEntity<?> traveler(
            @Valid @RequestBody TravelerDTO dto,
            BindingResult br
    ) {
        if (br.hasErrors()) {
            var errors = br.getFieldErrors().stream()
                    .map(e -> e.getField() + ": " + e.getDefaultMessage())
                    .toArray(String[]::new);
            return ResponseEntity.badRequest().body(Map.of("errors", errors));
        }

        try {
            Traveler traveler = DatabaseConnect.toTraveler(dto, "1");
            return ResponseEntity.ok(traveler);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Error building traveler", "details", ex.getMessage()));
        }
    }

    @PostMapping("/bookings/order")
    public ResponseEntity<?> order(@RequestBody JsonObject order) {
        try {
            FlightOrder result = amadeusConnect.order(order);

            if (result != null && result.getResponse() != null) {
                String json = result.getResponse().getResult().toString();
                Object asMap = objectMapper.readValue(json, Object.class);
                return ResponseEntity.ok(asMap);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Empty order response"));

        } catch (ResponseException re) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Error creating order", "details", re.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process order", "details", ex.getMessage()));
        }
    }
}