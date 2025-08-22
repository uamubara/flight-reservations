package com.airline.flightreservations.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

/** Traveler info for booking */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TravelerDTO {

    // Identity
    @NotBlank public String firstName;                 // "Jane"
    @NotBlank public String lastName;                  // "Doe"

    @NotBlank
    @Pattern(regexp="\\d{4}-\\d{2}-\\d{2}", message="Use yyyy-MM-dd")
    public String dateOfBirth;                         // "1990-01-15"

    // Contact (Format data for better readability)
    @Pattern(regexp="\\d{1,3}", message="Digits only")
    public String phoneCountryCode;                    // "1"
    @Pattern(regexp="\\d{7,20}", message="Digits only")
    public String phoneNumber;                         // "5551234567"
    public String deviceType;                          // "MOBILE" (default if null)

    // Document (optional but common for booking)
    public String documentType;                        // default "PASSPORT" if number provided
    public String documentNumber;                      // "X1234567"
    @Pattern(regexp="\\d{4}-\\d{2}-\\d{2}", message="Use yyyy-MM-dd")
    public String passportExpiryDate;                  // "2028-05-01"
    @Pattern(regexp="^[A-Z]{2}$", message="ISO 3166-1 alpha-2 (e.g., US)")
    public String nationality;                         // "US"
    @Pattern(regexp="^[A-Z]{2}$", message="ISO 3166-1 alpha-2 (e.g., US)")
    public String issuanceCountry;                     // "US"
}

