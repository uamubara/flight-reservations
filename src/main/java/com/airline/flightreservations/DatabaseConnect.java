package com.airline.flightreservations;

import com.airline.flightreservations.dto.TravelerDTO;
import com.amadeus.resources.Traveler;

import java.util.ArrayList;
import java.util.List;

/**
 * Maps our DTOs to Amadeus SDK models.
 * (No real DB yet—safe to rename later; keeping the class for minimal churn.)
 */
public final class DatabaseConnect {

    private DatabaseConnect() {}

    /** Build a single Amadeus Traveler from our DTO. */
    public static Traveler toTraveler(TravelerDTO dto, String id) {
        Traveler traveler = new Traveler();

        // Id must be unique per traveler in the order payload
        traveler.setId(id != null && !id.isBlank() ? id : "1");

        // Required identity
        Traveler.Name name = traveler.new Name(dto.firstName, dto.lastName);
        traveler.setName(name);
        traveler.setDateOfBirth(dto.dateOfBirth); // yyyy-MM-dd

        // Optional contact (phone)
        if (dto.phoneNumber != null && !dto.phoneNumber.isBlank()) {
            Traveler.Phone phone = traveler.new Phone();
            String cc = (dto.phoneCountryCode == null || dto.phoneCountryCode.isBlank()) ? "1" : dto.phoneCountryCode;
            phone.setCountryCallingCode(cc);
            phone.setNumber(dto.phoneNumber);
            String device = (dto.deviceType == null || dto.deviceType.isBlank()) ? "MOBILE" : dto.deviceType;
            phone.setDeviceType(device);

            Traveler.Contact contact = traveler.new Contact();
            contact.setPhones(new Traveler.Phone[]{phone});
            traveler.setContact(contact);
        }

        // Optional document (passport or other)
        if (dto.documentNumber != null && !dto.documentNumber.isBlank()) {
            Traveler.Document doc = traveler.new Document();
            String type = (dto.documentType == null || dto.documentType.isBlank()) ? "PASSPORT" : dto.documentType;
            doc.setDocumentType(type);
            doc.setNumber(dto.documentNumber);

            if (dto.passportExpiryDate != null && !dto.passportExpiryDate.isBlank()) {
                doc.setExpiryDate(dto.passportExpiryDate); // yyyy-MM-dd
            }
            if (dto.nationality != null && !dto.nationality.isBlank()) {
                doc.setNationality(dto.nationality);       // ISO-2 (e.g., US)
            }
            if (dto.issuanceCountry != null && !dto.issuanceCountry.isBlank()) {
                doc.setIssuanceCountry(dto.issuanceCountry); // ISO-2
            }

            doc.setHolder(true);
            traveler.setDocuments(new Traveler.Document[]{doc});
        }

        return traveler;
    }

    /** Build an array of Amadeus Travelers from a list of our DTOs (ids: "1","2",...). */
    public static Traveler[] toTravelers(List<TravelerDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) return new Traveler[0];
        List<Traveler> list = new ArrayList<>(dtos.size());
        int i = 1;
        for (TravelerDTO dto : dtos) {
            list.add(toTraveler(dto, String.valueOf(i++)));
        }
        return list.toArray(new Traveler[0]);
    }
}
