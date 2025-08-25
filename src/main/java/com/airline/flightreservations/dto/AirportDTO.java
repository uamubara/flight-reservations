package com.airline.flightreservations.dto;

public class AirportDTO {
    private String code;           // IATA code (e.g., JFK)
    private String cityName;       // e.g., New York
    private String airportName;    // e.g., John F. Kennedy
    private String countryCode;    // e.g., US
    private String timeZoneOffset; // e.g., -05:00

    public AirportDTO() {}

    public AirportDTO(String code, String cityName, String airportName, String countryCode, String timeZoneOffset) {
        this.code = code;
        this.cityName = cityName;
        this.airportName = airportName;
        this.countryCode = countryCode;
        this.timeZoneOffset = timeZoneOffset;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }

    public String getAirportName() { return airportName; }
    public void setAirportName(String airportName) { this.airportName = airportName; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public String getTimeZoneOffset() { return timeZoneOffset; }
    public void setTimeZoneOffset(String timeZoneOffset) { this.timeZoneOffset = timeZoneOffset; }
}
