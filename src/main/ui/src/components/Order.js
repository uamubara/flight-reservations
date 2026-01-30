import React, { useState } from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { User, Calendar, Globe, Phone, Mail, X, ChevronDown, Info, AlertCircle, LogIn } from "lucide-react";
import LoginModal from "./LoginModal";
import ProgressIndicator from "./ProgressIndicator";

const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");

// ============================================
// AMADEUS API FORMATTER - FIXES BLANK DATA ISSUE
// ============================================
const formatTravelersForAmadeus = (travelers, contactDetails) => {
    return travelers.map((traveler, index) => {
        // Format date of birth as YYYY-MM-DD (required by Amadeus)
        const dob = traveler.dateOfBirth;
        const dateOfBirthFormatted = dob.year && dob.month && dob.day
            ? `${dob.year}-${String(dob.month).padStart(2, '0')}-${String(dob.day).padStart(2, '0')}`
            : "";

        // Build traveler object according to Amadeus Flight Create Orders API spec
        const formattedTraveler = {
            id: String(index + 1),
            dateOfBirth: dateOfBirthFormatted,  // YYYY-MM-DD format
            name: {
                firstName: traveler.firstName.trim(),
                lastName: traveler.lastName.trim()
            },
            gender: traveler.gender,  // "MALE" or "FEMALE"
            contact: {
                emailAddress: contactDetails.email,
                phones: [{
                    deviceType: "MOBILE",
                    countryCallingCode: contactDetails.countryCode.replace('+', ''),
                    number: contactDetails.phoneNumber.replace(/\D/g, '')
                }]
            }
        };

        // Add traveler type (ADULT, CHILD, HELD_INFANT)
        if (traveler.type) {
            formattedTraveler.travelerType = traveler.type;
        }

        // Add documents (passport) if provided
        if (traveler.passportNumber) {
            const expiry = traveler.passportExpiry;
            const expiryFormatted = expiry?.year && expiry?.month && expiry?.day
                ? `${expiry.year}-${String(expiry.month).padStart(2, '0')}-${String(expiry.day).padStart(2, '0')}`
                : null;

            formattedTraveler.documents = [{
                documentType: "PASSPORT",
                birthPlace: traveler.nationality || "US",
                issuanceLocation: traveler.nationality || "US",
                issuanceDate: expiryFormatted ? expiryFormatted : "2020-01-01",
                number: traveler.passportNumber.trim(),
                expiryDate: expiryFormatted,
                issuanceCountry: traveler.nationality || "US",
                validityCountry: traveler.nationality || "US",
                nationality: traveler.nationality || "US",
                holder: true
            }];
        }

        // Add infant association if applicable
        if (traveler.type === "HELD_INFANT" && traveler.associatedAdult) {
            formattedTraveler.associatedAdultId = String(traveler.associatedAdult);
        }

        return formattedTraveler;
    });
};

export default function Order() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const priced = state?.flight;
    const flightDetails = state?.flightDetails;
    const passengerCounts = state?.passengerCounts || { adults: 1, children: 0, infants: 0 };

    // Initialize travelers based on passenger counts from search
    const initializeTravelers = () => {
        const travelers = [];
        let id = 1;

        // Add adults
        for (let i = 0; i < passengerCounts.adults; i++) {
            travelers.push({
                id: id++,
                type: "ADULT",
                typeLabel: "Adult",
                title: "",
                firstName: "",
                middleName: "",
                lastName: "",
                dateOfBirth: { day: "", month: "", year: "" },
                gender: "",
                nationality: "",
                passportNumber: "",
                passportExpiry: { day: "", month: "", year: "" },
                knownTravelerNumber: "",
                redress: "",
                frequentFlyerNumber: ""
            });
        }

        // Add children
        for (let i = 0; i < passengerCounts.children; i++) {
            travelers.push({
                id: id++,
                type: "CHILD",
                typeLabel: "Child",
                title: "",
                firstName: "",
                middleName: "",
                lastName: "",
                dateOfBirth: { day: "", month: "", year: "" },
                gender: "",
                nationality: "",
                passportNumber: "",
                passportExpiry: { day: "", month: "", year: "" },
                age: ""
            });
        }

        // Add infants
        for (let i = 0; i < passengerCounts.infants; i++) {
            travelers.push({
                id: id++,
                type: "HELD_INFANT",
                typeLabel: "Infant",
                title: "",
                firstName: "",
                middleName: "",
                lastName: "",
                dateOfBirth: { day: "", month: "", year: "" },
                gender: "",
                associatedAdult: 1 // Default to first adult
            });
        }

        return travelers;
    };

    const [travelers, setTravelers] = useState(initializeTravelers());
    const [contactDetails, setContactDetails] = useState({
        email: "",
        confirmEmail: "",
        countryCode: "+1",
        phoneNumber: ""
    });

    const [errors, setErrors] = useState({});
    const [showAdditionalInfo, setShowAdditionalInfo] = useState({});
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userEmail, setUserEmail] = useState("");

    const titles = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Master"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
    const nationalities = ["US", "GB", "CA", "AU", "DE", "FR", "IT", "ES", "NL", "JP", "CN"];

    const handleTravelerChange = (index, field, value) => {
        const updated = [...travelers];
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            updated[index][parent][child] = value;
        } else {
            updated[index][field] = value;
        }
        setTravelers(updated);
    };

    const handleContactChange = (field, value) => {
        setContactDetails(prev => ({ ...prev, [field]: value }));
    };

    const toggleAdditionalInfo = (index) => {
        setShowAdditionalInfo(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const validateForm = () => {
        const newErrors = {};

        travelers.forEach((traveler, idx) => {
            if (!traveler.title) newErrors[`traveler${idx}_title`] = "Please select a title";
            if (!traveler.firstName) newErrors[`traveler${idx}_firstName`] = "First name is required";
            if (!traveler.lastName) newErrors[`traveler${idx}_lastName`] = "Last name is required";
            if (!traveler.dateOfBirth.day || !traveler.dateOfBirth.month || !traveler.dateOfBirth.year) {
                newErrors[`traveler${idx}_dob`] = "Complete date of birth is required";
            }
            if (!traveler.gender) newErrors[`traveler${idx}_gender`] = "Please select gender";
        });

        if (!contactDetails.email) newErrors.email = "Email is required";
        if (contactDetails.email !== contactDetails.confirmEmail) newErrors.confirmEmail = "Emails do not match";
        if (!contactDetails.phoneNumber) newErrors.phoneNumber = "Phone number is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContinue = () => {
        if (!validateForm()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Format travelers for Amadeus API
        const formattedTravelers = formatTravelersForAmadeus(travelers, contactDetails);

        // DEBUG: Log to verify formatting
        console.log("=== TRAVELER DATA FOR API ===");
        console.log("Original travelers:", travelers);
        console.log("Formatted for Amadeus:", formattedTravelers);
        console.log("First traveler check:");
        console.log("  - firstName:", formattedTravelers[0]?.name?.firstName);
        console.log("  - lastName:", formattedTravelers[0]?.name?.lastName);
        console.log("  - dateOfBirth:", formattedTravelers[0]?.dateOfBirth);

        // Navigate to seat selection with BOTH versions
        navigate("/seats", {
            state: {
                travelers: travelers,                      // Original for display
                formattedTravelers: formattedTravelers,   // For API calls
                contactDetails: contactDetails,
                flight: priced,
                flightDetails: flightDetails,
                passengerCounts: passengerCounts
            }
        });
    };

    const handleLoginSuccess = (email) => {
        setIsLoggedIn(true);
        setUserEmail(email);
        setShowLoginModal(false);
    };

    return (
        <PageContainer>
            <ProgressIndicator currentStep={3} totalSteps={7} />

            <ContentWrapper>
                <FormColumn>
                    <FormCard>
                        <FormHeader>
                            <HeaderTop>
                                <div>
                                    <h1>Traveler Information</h1>
                                    {isLoggedIn && (
                                        <LoggedInBadge>
                                            Logged in as {userEmail}
                                        </LoggedInBadge>
                                    )}
                                </div>
                                {!isLoggedIn && (
                                    <LoginButton onClick={() => setShowLoginModal(true)}>
                                        <LogIn size={18} />
                                        Log in to your account
                                    </LoginButton>
                                )}
                            </HeaderTop>

                            <InfoBanner>
                                <Info size={16} />
                                <div>
                                    <strong>Important:</strong> Names must exactly match passport details and should be entered using English characters only.
                                    They can't be changed after booking is complete.
                                </div>
                            </InfoBanner>
                        </FormHeader>

                        <Form>
                            {travelers.map((traveler, index) => (
                                <TravelerSection key={traveler.id}>
                                    <SectionHeader>
                                        <User size={20} />
                                        <span>Passenger {index + 1} ({traveler.typeLabel})</span>
                                    </SectionHeader>

                                    {traveler.type === "CHILD" && (
                                        <SectionSubheader>
                                            Children must be 2-11 years old at time of travel
                                        </SectionSubheader>
                                    )}

                                    {traveler.type === "HELD_INFANT" && (
                                        <SectionSubheader>
                                            Infants must be under 2 years old and will sit on an adult's lap
                                        </SectionSubheader>
                                    )}

                                    <FormGrid>
                                        <FormGroup>
                                            <Label>
                                                Title <Required>*</Required>
                                            </Label>
                                            <Select
                                                value={traveler.title}
                                                onChange={(e) => handleTravelerChange(index, 'title', e.target.value)}
                                                error={errors[`traveler${index}_title`]}
                                            >
                                                <option value="">Select</option>
                                                {titles.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </Select>
                                            {errors[`traveler${index}_title`] && (
                                                <ErrorText>{errors[`traveler${index}_title`]}</ErrorText>
                                            )}
                                        </FormGroup>

                                        <FormGroup style={{ gridColumn: 'span 2' }}>
                                            <Label>
                                                First & Middle Name(s) <Required>*</Required>
                                            </Label>
                                            <Input
                                                value={traveler.firstName}
                                                onChange={(e) => handleTravelerChange(index, 'firstName', e.target.value)}
                                                placeholder="As shown on passport"
                                                error={errors[`traveler${index}_firstName`]}
                                            />
                                            {errors[`traveler${index}_firstName`] && (
                                                <ErrorText>{errors[`traveler${index}_firstName`]}</ErrorText>
                                            )}
                                        </FormGroup>

                                        <FormGroup style={{ gridColumn: 'span 2' }}>
                                            <Label>
                                                Last Name <Required>*</Required>
                                            </Label>
                                            <Input
                                                value={traveler.lastName}
                                                onChange={(e) => handleTravelerChange(index, 'lastName', e.target.value)}
                                                placeholder="As shown on passport"
                                                error={errors[`traveler${index}_lastName`]}
                                            />
                                            {errors[`traveler${index}_lastName`] && (
                                                <ErrorText>{errors[`traveler${index}_lastName`]}</ErrorText>
                                            )}
                                        </FormGroup>
                                    </FormGrid>

                                    <FormGroup>
                                        <Label>
                                            Date of Birth <Required>*</Required>
                                        </Label>
                                        <DateGrid>
                                            <Select
                                                value={traveler.dateOfBirth.day}
                                                onChange={(e) => handleTravelerChange(index, 'dateOfBirth.day', e.target.value)}
                                                error={errors[`traveler${index}_dob`]}
                                            >
                                                <option value="">Day</option>
                                                {days.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </Select>
                                            <Select
                                                value={traveler.dateOfBirth.month}
                                                onChange={(e) => handleTravelerChange(index, 'dateOfBirth.month', e.target.value)}
                                                error={errors[`traveler${index}_dob`]}
                                            >
                                                <option value="">Month</option>
                                                {months.map((m, i) => (
                                                    <option key={i} value={i + 1}>{m}</option>
                                                ))}
                                            </Select>
                                            <Select
                                                value={traveler.dateOfBirth.year}
                                                onChange={(e) => handleTravelerChange(index, 'dateOfBirth.year', e.target.value)}
                                                error={errors[`traveler${index}_dob`]}
                                            >
                                                <option value="">Year</option>
                                                {years.map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </Select>
                                        </DateGrid>
                                        {errors[`traveler${index}_dob`] && (
                                            <ErrorText>{errors[`traveler${index}_dob`]}</ErrorText>
                                        )}
                                    </FormGroup>

                                    {traveler.type === "CHILD" && (
                                        <FormGroup>
                                            <Label>Age at time of travel</Label>
                                            <Input
                                                type="number"
                                                min="2"
                                                max="11"
                                                value={traveler.age}
                                                onChange={(e) => handleTravelerChange(index, 'age', e.target.value)}
                                                placeholder="Age (2-11)"
                                            />
                                        </FormGroup>
                                    )}

                                    {traveler.type === "HELD_INFANT" && (
                                        <FormGroup>
                                            <Label>
                                                Associated Adult <Required>*</Required>
                                            </Label>
                                            <Select
                                                value={traveler.associatedAdult}
                                                onChange={(e) => handleTravelerChange(index, 'associatedAdult', parseInt(e.target.value))}
                                            >
                                                {travelers
                                                    .filter(t => t.type === "ADULT")
                                                    .map((adult, adultIdx) => (
                                                        <option key={adultIdx} value={adult.id}>
                                                            Passenger {travelers.indexOf(adult) + 1}: {adult.firstName || 'Not entered'} {adult.lastName || ''}
                                                        </option>
                                                    ))}
                                            </Select>
                                        </FormGroup>
                                    )}

                                    <FormGroup>
                                        <Label>
                                            Gender <Required>*</Required>
                                        </Label>
                                        <RadioGroup>
                                            <RadioLabel>
                                                <input
                                                    type="radio"
                                                    name={`gender-${index}`}
                                                    value="MALE"
                                                    checked={traveler.gender === "MALE"}
                                                    onChange={(e) => handleTravelerChange(index, 'gender', e.target.value)}
                                                />
                                                Male
                                            </RadioLabel>
                                            <RadioLabel>
                                                <input
                                                    type="radio"
                                                    name={`gender-${index}`}
                                                    value="FEMALE"
                                                    checked={traveler.gender === "FEMALE"}
                                                    onChange={(e) => handleTravelerChange(index, 'gender', e.target.value)}
                                                />
                                                Female
                                            </RadioLabel>
                                        </RadioGroup>
                                        {errors[`traveler${index}_gender`] && (
                                            <ErrorText>{errors[`traveler${index}_gender`]}</ErrorText>
                                        )}
                                    </FormGroup>

                                    {traveler.type !== "HELD_INFANT" && (
                                        <>
                                            <Divider />
                                            <SectionHeader style={{ marginTop: '1rem' }}>
                                                <Globe size={18} />
                                                <span>Travel Documents</span>
                                            </SectionHeader>

                                            <FormGrid>
                                                <FormGroup>
                                                    <Label>Nationality</Label>
                                                    <Select
                                                        value={traveler.nationality}
                                                        onChange={(e) => handleTravelerChange(index, 'nationality', e.target.value)}
                                                    >
                                                        <option value="">Select country</option>
                                                        {nationalities.map(n => (
                                                            <option key={n} value={n}>{n}</option>
                                                        ))}
                                                    </Select>
                                                </FormGroup>

                                                <FormGroup style={{ gridColumn: 'span 2' }}>
                                                    <Label>Passport Number</Label>
                                                    <Input
                                                        value={traveler.passportNumber}
                                                        onChange={(e) => handleTravelerChange(index, 'passportNumber', e.target.value)}
                                                        placeholder="Passport number"
                                                    />
                                                </FormGroup>
                                            </FormGrid>

                                            <FormGroup>
                                                <Label>Passport Expiry Date</Label>
                                                <DateGrid>
                                                    <Select
                                                        value={traveler.passportExpiry.day}
                                                        onChange={(e) => handleTravelerChange(index, 'passportExpiry.day', e.target.value)}
                                                    >
                                                        <option value="">Day</option>
                                                        {days.map(d => (
                                                            <option key={d} value={d}>{d}</option>
                                                        ))}
                                                    </Select>
                                                    <Select
                                                        value={traveler.passportExpiry.month}
                                                        onChange={(e) => handleTravelerChange(index, 'passportExpiry.month', e.target.value)}
                                                    >
                                                        <option value="">Month</option>
                                                        {months.map((m, i) => (
                                                            <option key={i} value={i + 1}>{m}</option>
                                                        ))}
                                                    </Select>
                                                    <Select
                                                        value={traveler.passportExpiry.year}
                                                        onChange={(e) => handleTravelerChange(index, 'passportExpiry.year', e.target.value)}
                                                    >
                                                        <option value="">Year</option>
                                                        {Array.from({ length: 30 }, (_, i) => currentYear + i).map(y => (
                                                            <option key={y} value={y}>{y}</option>
                                                        ))}
                                                    </Select>
                                                </DateGrid>
                                            </FormGroup>

                                            <ExpandableSection>
                                                <ExpandHeader onClick={() => toggleAdditionalInfo(index)}>
                                                    <span>Additional travel information (optional)</span>
                                                    <ChevronDown
                                                        size={18}
                                                        style={{
                                                            transform: showAdditionalInfo[index] ? 'rotate(180deg)' : 'rotate(0deg)',
                                                            transition: 'transform 0.2s'
                                                        }}
                                                    />
                                                </ExpandHeader>
                                                {showAdditionalInfo[index] && (
                                                    <ExpandContent>
                                                        <FormGroup>
                                                            <Label>Known Traveler Number (TSA PreCheck)</Label>
                                                            <Input
                                                                value={traveler.knownTravelerNumber}
                                                                onChange={(e) => handleTravelerChange(index, 'knownTravelerNumber', e.target.value)}
                                                                placeholder="Optional"
                                                            />
                                                        </FormGroup>
                                                        <FormGroup>
                                                            <Label>Redress Number</Label>
                                                            <Input
                                                                value={traveler.redress}
                                                                onChange={(e) => handleTravelerChange(index, 'redress', e.target.value)}
                                                                placeholder="Optional"
                                                            />
                                                        </FormGroup>
                                                        <FormGroup>
                                                            <Label>Frequent Flyer Number</Label>
                                                            <Input
                                                                value={traveler.frequentFlyerNumber}
                                                                onChange={(e) => handleTravelerChange(index, 'frequentFlyerNumber', e.target.value)}
                                                                placeholder="Optional"
                                                            />
                                                        </FormGroup>
                                                    </ExpandContent>
                                                )}
                                            </ExpandableSection>
                                        </>
                                    )}

                                    {index < travelers.length - 1 && <Divider style={{ margin: '2rem 0' }} />}
                                </TravelerSection>
                            ))}

                            <ContactSection>
                                <SectionHeader>
                                    <Mail size={20} />
                                    <span>Contact Information</span>
                                </SectionHeader>

                                <FormGroup>
                                    <Label>
                                        Email Address <Required>*</Required>
                                    </Label>
                                    <Input
                                        type="email"
                                        value={contactDetails.email}
                                        onChange={(e) => handleContactChange('email', e.target.value)}
                                        placeholder="your@email.com"
                                        error={errors.email}
                                    />
                                    {errors.email && <ErrorText>{errors.email}</ErrorText>}
                                    <HelpText>Booking confirmation will be sent to this email</HelpText>
                                </FormGroup>

                                <FormGroup>
                                    <Label>
                                        Confirm Email <Required>*</Required>
                                    </Label>
                                    <Input
                                        type="email"
                                        value={contactDetails.confirmEmail}
                                        onChange={(e) => handleContactChange('confirmEmail', e.target.value)}
                                        placeholder="your@email.com"
                                        error={errors.confirmEmail}
                                    />
                                    {errors.confirmEmail && <ErrorText>{errors.confirmEmail}</ErrorText>}
                                </FormGroup>

                                <FormGroup>
                                    <Label>
                                        Phone Number <Required>*</Required>
                                    </Label>
                                    <PhoneGrid>
                                        <Select
                                            value={contactDetails.countryCode}
                                            onChange={(e) => handleContactChange('countryCode', e.target.value)}
                                            style={{ width: '120px' }}
                                        >
                                            <option value="+1">🇺🇸 +1</option>
                                            <option value="+44">🇬🇧 +44</option>
                                            <option value="+33">🇫🇷 +33</option>
                                            <option value="+49">🇩🇪 +49</option>
                                        </Select>
                                        <Input
                                            type="tel"
                                            value={contactDetails.phoneNumber}
                                            onChange={(e) => handleContactChange('phoneNumber', e.target.value)}
                                            placeholder="555-123-4567"
                                            error={errors.phoneNumber}
                                        />
                                    </PhoneGrid>
                                    {errors.phoneNumber && <ErrorText>{errors.phoneNumber}</ErrorText>}
                                    <HelpText>For flight updates and notifications</HelpText>
                                </FormGroup>
                            </ContactSection>

                            <ActionButtons>
                                <SecondaryButton onClick={() => navigate(-1)}>
                                    Back to Flight Details
                                </SecondaryButton>
                                <PrimaryButton onClick={handleContinue}>
                                    Continue to Seat Selection
                                </PrimaryButton>
                            </ActionButtons>
                        </Form>
                    </FormCard>
                </FormColumn>

                <SummaryColumn>
                    <SummaryCard>
                        <SummaryHeader>Flight Summary</SummaryHeader>
                        <SummaryRoute>
                            {flightDetails.originCode} → {flightDetails.destCode}
                        </SummaryRoute>
                        <SummaryDetail>
                            <Calendar size={16} />
                            <span>{flightDetails.departureDate}</span>
                        </SummaryDetail>
                        <SummaryDetail>
                            <User size={16} />
                            <span>
                                {passengerCounts.adults} Adult{passengerCounts.adults > 1 ? 's' : ''}
                                {passengerCounts.children > 0 && `, ${passengerCounts.children} Child${passengerCounts.children > 1 ? 'ren' : ''}`}
                                {passengerCounts.infants > 0 && `, ${passengerCounts.infants} Infant${passengerCounts.infants > 1 ? 's' : ''}`}
                            </span>
                        </SummaryDetail>
                        <SummaryDivider />
                        <SummaryPrice>
                            <span>Total</span>
                            <strong>{flightDetails.totalPrice}</strong>
                        </SummaryPrice>
                    </SummaryCard>

                    <ImportantInfo>
                        <AlertCircle size={18} />
                        <div>
                            <strong>Important Notes</strong>
                            <ul>
                                <li>All fields marked with * are required</li>
                                <li>Names must match your passport exactly</li>
                                <li>Double-check all information before continuing</li>
                            </ul>
                        </div>
                    </ImportantInfo>
                </SummaryColumn>
            </ContentWrapper>

            {showLoginModal && (
                <LoginModal
                    onClose={() => setShowLoginModal(false)}
                    onLoginSuccess={handleLoginSuccess}
                />
            )}
        </PageContainer>
    );
}

/* Styled Components - Complete styling for the component */

const PageContainer = styled.div`
    min-height: 100vh;
    background: #f8fafc;
`;

const ContentWrapper = styled.div`
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem 1rem;
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 2rem;

    @media (max-width: 1200px) {
        grid-template-columns: 1fr;
    }
`;

const FormColumn = styled.div``;

const SummaryColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    position: sticky;
    top: 2rem;
    align-self: start;

    @media (max-width: 1200px) {
        position: static;
    }
`;

const FormCard = styled.div`
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden;
`;

const FormHeader = styled.div`
    padding: 2rem;
    border-bottom: 2px solid #e2e8f0;
`;

const HeaderTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;

    h1 {
        margin: 0 0 0.5rem;
        color: #0f172a;
        font-size: 1.75rem;
    }

    @media (max-width: 640px) {
        flex-direction: column;
        gap: 1rem;
    }
`;

const LoginButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(124, 58, 237, 0.3);
    }
`;

const LoggedInBadge = styled.div`
    display: inline-flex;
    padding: 0.5rem 1rem;
    background: #dcfce7;
    border: 1px solid #86efac;
    border-radius: 0.5rem;
    color: #166534;
    font-weight: 600;
    font-size: 0.9rem;
`;

const InfoBanner = styled.div`
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 0.5rem;

    svg {
        flex-shrink: 0;
        color: #1e40af;
        margin-top: 2px;
    }

    strong {
        color: #1e3a8a;
    }

    div {
        color: #1e40af;
        font-size: 0.9rem;
        line-height: 1.5;
    }
`;

const Form = styled.div`
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
`;

const TravelerSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
`;

const SectionHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #0f172a;
    font-weight: 700;
    font-size: 1.125rem;

    svg {
        color: #7c3aed;
    }
`;

const SectionSubheader = styled.div`
    color: #64748b;
    font-size: 0.9rem;
    margin-top: -0.5rem;
    padding-left: 2rem;
`;

const FormGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const Label = styled.label`
    font-weight: 600;
    color: #334155;
    font-size: 0.9rem;
`;

const Required = styled.span`
    color: #dc2626;
`;

const Input = styled.input`
    padding: 0.75rem;
    border: 1px solid ${p => p.error ? '#ef4444' : '#cbd5e1'};
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: all 0.2s;

    &:focus {
        outline: none;
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }
`;

const Select = styled.select`
    padding: 0.75rem;
    border: 1px solid ${p => p.error ? '#ef4444' : '#cbd5e1'};
    border-radius: 0.5rem;
    font-size: 1rem;
    background: white;
    cursor: pointer;
    transition: all 0.2s;

    &:focus {
        outline: none;
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }
`;

const DateGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 2fr 1.5fr;
    gap: 0.5rem;
`;

const RadioGroup = styled.div`
    display: flex;
    gap: 1.5rem;
`;

const RadioLabel = styled.label`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    color: #475569;

    input[type="radio"] {
        cursor: pointer;
    }
`;

const PhoneGrid = styled.div`
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 0.5rem;
`;

const ErrorText = styled.span`
    color: #dc2626;
    font-size: 0.85rem;
    font-weight: 500;
`;

const HelpText = styled.span`
    color: #64748b;
    font-size: 0.85rem;
`;

const Divider = styled.div`
    height: 1px;
    background: #e2e8f0;
`;

const ExpandableSection = styled.div`
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    overflow: hidden;
`;

const ExpandHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8fafc;
    cursor: pointer;
    font-weight: 600;
    color: #475569;
    transition: background 0.2s;

    &:hover {
        background: #f1f5f9;
    }

    svg {
        transition: transform 0.2s;
    }
`;

const ExpandContent = styled.div`
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    border-top: 1px solid #e2e8f0;
`;

const ContactSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-top: 2rem;
    border-top: 2px solid #e2e8f0;
`;

const ActionButtons = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 2rem;
    border-top: 2px solid #e2e8f0;

    @media (max-width: 640px) {
        flex-direction: column-reverse;
    }
`;

const SecondaryButton = styled.button`
    padding: 0.875rem 2rem;
    border: 2px solid #cbd5e1;
    background: white;
    color: #475569;
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #f8fafc;
        border-color: #94a3b8;
    }
`;

const PrimaryButton = styled.button`
    padding: 0.875rem 2rem;
    border: none;
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    color: white;
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 20px rgba(124, 58, 237, 0.3);
    }
`;

const SummaryCard = styled.div`
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const SummaryHeader = styled.div`
    font-weight: 700;
    color: #0f172a;
    font-size: 1.125rem;
    margin-bottom: 1rem;
`;

const SummaryRoute = styled.div`
    font-size: 1.5rem;
    font-weight: 700;
    color: #7c3aed;
    margin-bottom: 1rem;
`;

const SummaryDetail = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #64748b;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;

    svg {
        color: #94a3b8;
        flex-shrink: 0;
    }
`;

const SummaryDivider = styled.div`
    height: 1px;
    background: #e2e8f0;
    margin: 1rem 0;
`;

const SummaryPrice = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;

    span {
        color: #64748b;
        font-weight: 600;
    }

    strong {
        color: #0f172a;
        font-size: 1.5rem;
    }
`;

const ImportantInfo = styled.div`
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 0.75rem;
    padding: 1.25rem;
    display: flex;
    gap: 1rem;

    svg {
        flex-shrink: 0;
        color: #d97706;
    }

    strong {
        display: block;
        color: #92400e;
        margin-bottom: 0.5rem;
    }

    ul {
        margin: 0;
        padding-left: 1.25rem;
        color: #78350f;

        li {
            margin-bottom: 0.5rem;
            font-size: 0.85rem;
        }
    }
`;