package com.airline.flightreservations.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/** Outbound or return journey consisting of segments */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ItineraryDTO {
    public String duration;            // total itinerary duration
    public List<SegmentDTO> segments;  // ordered legs
}

