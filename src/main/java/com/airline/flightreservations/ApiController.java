package com.airline.flightreservations;

import com.airline.flightreservations.dto.TravelerDTO;
import com.airline.flightreservations.dto.FlightOfferDTO;
import com.airline.flightreservations.dto.LocationDTO;

import com.amadeus.exceptions.ResponseException;
import com.amadeus.resources.FlightOfferSearch;
import com.amadeus.resources.FlightPrice;
import com.amadeus.resources.Location;
import com.amadeus.resources.Traveler;
import com.amadeus.resources.FlightOrder;
import com.google.gson.JsonObject;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import org.springframework.validation.BindingResult;

import java.util.List;
import java.util.Map;

/**
 * API layer:
 * - returns slim DTOs (fast, frontend-friendly).
 * - Pass ?raw=true to get the original Amadeus JSON payloads for debugging.
 */
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

    // ------------------- LOCATIONS -------------------

    @GetMapping("/locations")
    public ResponseEntity<?> locations(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "false") boolean raw
    ) {
        try {
            Location[] results = amadeusConnect.location(keyword);

            if (raw) {
                // Avoid returning SDK objects directly (Gson/Jackson clash).
                if (results != null && results.length > 0 && results[0].getResponse() != null) {
                    String json = results[0].getResponse().getResult().toString();
                    Object asMap = objectMapper.readValue(json, Object.class);
                    return ResponseEntity.ok(asMap);
                }
                return ResponseEntity.ok(Map.of("data", List.of())); // empty
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

    // ------------------- FLIGHT SEARCH -------------------

    @GetMapping("/flights")
    public ResponseEntity<?> flights(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam String departDate,
            @RequestParam String adults,
            @RequestParam(required = false) String returnDate,
            @RequestParam(defaultValue = "5") int maxResults,
            @RequestParam(defaultValue = "false") boolean raw
    ) {
        try {
            FlightOfferSearch[] offers = amadeusConnect.flights(
                    origin, destination, departDate, adults, returnDate, maxResults
            );

            if (raw) {
                if (offers != null && offers.length > 0 && offers[0].getResponse() != null) {
                    String json = offers[0].getResponse().getResult().toString();
                    Object asMap = objectMapper.readValue(json, Object.class);
                    return ResponseEntity.ok(asMap);
                }
                return ResponseEntity.ok(Map.of("data", List.of()));
            }

            List<FlightOfferDTO> dto = AmadeusMapper.toFlightOfferDTOs(offers);
            return ResponseEntity.ok(dto);

        } catch (ResponseException re) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Error fetching flights", "details", re.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process flights", "details", ex.getMessage()));
        }
    }

    // ------------------- PRICE CONFIRM -------------------
    // Accepts the raw FlightOfferSearch (from UI selection) and returns the pricing result.
    // return the raw Amadeus JSON to avoid SDK serialization issues and to keep full fidelity.

    @PostMapping("/flights/confirm")
    public ResponseEntity<?> confirm(@RequestBody FlightOfferSearch selectedOffer) {
        try {
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

    // ------------------- TRAVELER PREVIEW/BUILD -------------------

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
            return ResponseEntity.ok(traveler); // safe: built by us, no Gson Response field
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Error building traveler", "details", ex.getMessage()));
        }
    }

    // ------------------- PLACE ORDER -------------------
    // Pass through the exact JSON Amadeus expects (build it on the client using the
    // traveler preview above + selected offer). return raw booking JSON.

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

