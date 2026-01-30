import React, { useState } from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { CreditCard, Lock, AlertCircle, Check, ChevronDown } from "lucide-react";
import ProgressIndicator from "./ProgressIndicator";

export default function Payment() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const booking = state || {};
    const formattedTravelers = booking.formattedTravelers || [];  // ← ADDED FOR AMADEUS API
    const totalPrice = booking.totalPrice || 0;

    const [cardNumber, setCardNumber] = useState("");
    const [cardName, setCardName] = useState("");
    const [expiryMonth, setExpiryMonth] = useState("");
    const [expiryYear, setExpiryYear] = useState("");
    const [cvv, setCvv] = useState("");

    const [billingAddress, setBillingAddress] = useState("");
    const [billingCity, setBillingCity] = useState("");
    const [billingState, setBillingState] = useState("");
    const [billingZip, setBillingZip] = useState("");
    const [billingCountry, setBillingCountry] = useState("US");

    const [agreeTerms, setAgreeTerms] = useState(false);
    const [reviewedDetails, setReviewedDetails] = useState(false);

    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const formatCardNumber = (value) => {
        const numbers = value.replace(/\D/g, '');
        const formatted = numbers.match(/.{1,4}/g)?.join('-') || numbers;
        return formatted.substring(0, 19); // 4-4-4-4 format
    };

    const handleCardNumberChange = (e) => {
        setCardNumber(formatCardNumber(e.target.value));
    };

    const handleCvvChange = (e) => {
        const numbers = e.target.value.replace(/\D/g, '');
        setCvv(numbers.substring(0, 3));
    };

    const validateForm = () => {
        const newErrors = {};

        const cardDigits = cardNumber.replace(/\D/g, '');
        if (!cardNumber || cardDigits.length !== 16) {
            newErrors.cardNumber = "Please enter a valid 16-digit card number";
        }

        if (!cardName) newErrors.cardName = "Cardholder name is required";
        if (!expiryMonth) newErrors.expiryMonth = "Expiry month is required";
        if (!expiryYear) newErrors.expiryYear = "Expiry year is required";
        if (!cvv || cvv.length !== 3) newErrors.cvv = "CVV must be 3 digits";

        if (!billingAddress) newErrors.billingAddress = "Billing address is required";
        if (!billingCity) newErrors.billingCity = "City is required";
        if (!billingState) newErrors.billingState = "State is required";
        if (!billingZip) newErrors.billingZip = "ZIP code is required";

        if (!agreeTerms) newErrors.agreeTerms = "You must agree to the terms and conditions";
        if (!reviewedDetails) newErrors.reviewedDetails = "Please confirm you've reviewed all booking details";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setProcessing(true);

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Generate booking reference
        const bookingRef = `FLY-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Navigate to confirmation
        navigate("/confirmation", {
            state: {
                ...booking,
                formattedTravelers: formattedTravelers,  // ← EXPLICITLY PASS FORMATTED DATA
                bookingReference: bookingRef,
                paymentDetails: {
                    cardLast4: cardNumber.slice(-4),
                    cardName: cardName
                },
                bookingDate: new Date().toISOString()
            }
        });
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear + i);
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

    return (
        <PageContainer>
            <ProgressIndicator currentStep={6} totalSteps={7} />

            <ContentWrapper>
                <MainColumn>
                    <DemoNotice>
                        <AlertCircle size={20} />
                        <div>
                            <strong>DEMO MODE</strong>
                            <p>This is a demonstration. No actual charges will be made. Use test card: 4242-4242-4242-4242</p>
                        </div>
                    </DemoNotice>

                    <PaymentCard>
                        <CardHeader>
                            <CreditCard size={24} />
                            <div>
                                <h1>💳 Payment Information</h1>
                                <SecureBadge>
                                    <Lock size={14} />
                                    <span>Secure Demo Payment</span>
                                </SecureBadge>
                            </div>
                        </CardHeader>

                        <Form onSubmit={handleSubmit}>
                            <Section>
                                <SectionTitle>Card Details</SectionTitle>

                                <FormGroup>
                                    <Label>Card Number</Label>
                                    <CardInput
                                        type="text"
                                        value={cardNumber}
                                        onChange={handleCardNumberChange}
                                        placeholder="4242-4242-4242-4242"
                                        error={errors.cardNumber}
                                    />
                                    {errors.cardNumber && <ErrorText>{errors.cardNumber}</ErrorText>}
                                </FormGroup>

                                <FormGrid>
                                    <FormGroup>
                                        <Label>Expiration Month</Label>
                                        <Select
                                            value={expiryMonth}
                                            onChange={(e) => setExpiryMonth(e.target.value)}
                                            error={errors.expiryMonth}
                                        >
                                            <option value="">MM</option>
                                            {months.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </Select>
                                        {errors.expiryMonth && <ErrorText>{errors.expiryMonth}</ErrorText>}
                                    </FormGroup>

                                    <FormGroup>
                                        <Label>Expiration Year</Label>
                                        <Select
                                            value={expiryYear}
                                            onChange={(e) => setExpiryYear(e.target.value)}
                                            error={errors.expiryYear}
                                        >
                                            <option value="">YYYY</option>
                                            {years.map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </Select>
                                        {errors.expiryYear && <ErrorText>{errors.expiryYear}</ErrorText>}
                                    </FormGroup>

                                    <FormGroup>
                                        <Label>CVV</Label>
                                        <Input
                                            type="text"
                                            value={cvv}
                                            onChange={handleCvvChange}
                                            placeholder="123"
                                            maxLength="3"
                                            error={errors.cvv}
                                        />
                                        {errors.cvv && <ErrorText>{errors.cvv}</ErrorText>}
                                    </FormGroup>
                                </FormGrid>

                                <FormGroup>
                                    <Label>Cardholder Name</Label>
                                    <Input
                                        type="text"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value)}
                                        placeholder="John Smith"
                                        error={errors.cardName}
                                    />
                                    {errors.cardName && <ErrorText>{errors.cardName}</ErrorText>}
                                </FormGroup>
                            </Section>

                            <Section>
                                <SectionTitle>Billing Address</SectionTitle>

                                <FormGroup>
                                    <Label>Street Address</Label>
                                    <Input
                                        type="text"
                                        value={billingAddress}
                                        onChange={(e) => setBillingAddress(e.target.value)}
                                        placeholder="123 Main Street"
                                        error={errors.billingAddress}
                                    />
                                    {errors.billingAddress && <ErrorText>{errors.billingAddress}</ErrorText>}
                                </FormGroup>

                                <FormGrid>
                                    <FormGroup>
                                        <Label>City</Label>
                                        <Input
                                            type="text"
                                            value={billingCity}
                                            onChange={(e) => setBillingCity(e.target.value)}
                                            placeholder="Houston"
                                            error={errors.billingCity}
                                        />
                                        {errors.billingCity && <ErrorText>{errors.billingCity}</ErrorText>}
                                    </FormGroup>

                                    <FormGroup>
                                        <Label>State</Label>
                                        <Input
                                            type="text"
                                            value={billingState}
                                            onChange={(e) => setBillingState(e.target.value)}
                                            placeholder="TX"
                                            error={errors.billingState}
                                        />
                                        {errors.billingState && <ErrorText>{errors.billingState}</ErrorText>}
                                    </FormGroup>

                                    <FormGroup>
                                        <Label>ZIP Code</Label>
                                        <Input
                                            type="text"
                                            value={billingZip}
                                            onChange={(e) => setBillingZip(e.target.value)}
                                            placeholder="77001"
                                            error={errors.billingZip}
                                        />
                                        {errors.billingZip && <ErrorText>{errors.billingZip}</ErrorText>}
                                    </FormGroup>
                                </FormGrid>

                                <FormGroup>
                                    <Label>Country</Label>
                                    <Select
                                        value={billingCountry}
                                        onChange={(e) => setBillingCountry(e.target.value)}
                                    >
                                        <option value="US">United States</option>
                                        <option value="GB">United Kingdom</option>
                                        <option value="CA">Canada</option>
                                        <option value="AU">Australia</option>
                                        <option value="DE">Germany</option>
                                        <option value="FR">France</option>
                                    </Select>
                                </FormGroup>
                            </Section>

                            <Section>
                                <SectionTitle>Confirmation</SectionTitle>

                                <CheckboxGroup error={errors.agreeTerms}>
                                    <input
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                    />
                                    <label>
                                        I agree to the <Link href="#">Terms and Conditions</Link> and <Link href="#">Privacy Policy</Link>
                                    </label>
                                </CheckboxGroup>
                                {errors.agreeTerms && <ErrorText>{errors.agreeTerms}</ErrorText>}

                                <CheckboxGroup error={errors.reviewedDetails}>
                                    <input
                                        type="checkbox"
                                        checked={reviewedDetails}
                                        onChange={(e) => setReviewedDetails(e.target.checked)}
                                    />
                                    <label>
                                        I have reviewed all booking details and passenger information
                                    </label>
                                </CheckboxGroup>
                                {errors.reviewedDetails && <ErrorText>{errors.reviewedDetails}</ErrorText>}
                            </Section>

                            <ActionButtons>
                                <SecondaryButton type="button" onClick={() => navigate(-1)}>
                                    Back to Add-ons
                                </SecondaryButton>
                                <PrimaryButton type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Spinner />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={18} />
                                            Complete Booking (Demo)
                                        </>
                                    )}
                                </PrimaryButton>
                            </ActionButtons>
                        </Form>
                    </PaymentCard>
                </MainColumn>

                <SidebarColumn>
                    <SummaryCard>
                        <SummaryHeader>
                            <h3>Order Summary</h3>
                        </SummaryHeader>

                        <SummaryBody>
                            <SummarySection>
                                <SummaryLabel>Flight</SummaryLabel>
                                <FlightDetails>
                                    <div className="route">
                                        {booking.flightDetails?.originCode} → {booking.flightDetails?.destCode}
                                    </div>
                                    <div className="date">
                                        {booking.flightDetails?.departureDate}
                                    </div>
                                    <div className="airline">
                                        {booking.flightDetails?.airlineName}
                                    </div>
                                </FlightDetails>
                            </SummarySection>

                            <SummarySection>
                                <SummaryLabel>Passengers</SummaryLabel>
                                {booking.travelers?.map((t, idx) => (
                                    <PassengerRow key={idx}>
                                        <span>{t.firstName || `Passenger ${idx + 1}`} {t.lastName || ''}</span>
                                        <span className="type">({t.typeLabel})</span>
                                    </PassengerRow>
                                ))}
                            </SummarySection>

                            <Divider />

                            <PriceRow>
                                <span>Flight</span>
                                <strong>{booking.flightDetails?.totalPrice}</strong>
                            </PriceRow>

                            {booking.seatPrice > 0 && (
                                <PriceRow>
                                    <span>Seats</span>
                                    <strong>${booking.seatPrice.toFixed(2)}</strong>
                                </PriceRow>
                            )}

                            {booking.baggage?.price > 0 && (
                                <PriceRow>
                                    <span>Baggage</span>
                                    <strong>${booking.baggage.price.toFixed(2)}</strong>
                                </PriceRow>
                            )}

                            {booking.insurance?.price > 0 && (
                                <PriceRow>
                                    <span>Insurance</span>
                                    <strong>${booking.insurance.price.toFixed(2)}</strong>
                                </PriceRow>
                            )}

                            <Divider />

                            <TotalRow>
                                <span>Total Amount</span>
                                <strong>${totalPrice.toFixed(2)}</strong>
                            </TotalRow>
                        </SummaryBody>
                    </SummaryCard>

                    <SecurityBadges>
                        <Badge>
                            <Lock size={16} />
                            <span>SSL Encrypted</span>
                        </Badge>
                        <Badge>
                            <Check size={16} />
                            <span>PCI Compliant</span>
                        </Badge>
                        <Badge>
                            <Check size={16} />
                            <span>Secure Payment</span>
                        </Badge>
                    </SecurityBadges>
                </SidebarColumn>
            </ContentWrapper>
        </PageContainer>
    );
}

/* Styled Components */

const PageContainer = styled.div`
    min-height: 100vh;
    background: #f8fafc;
`;

const ContentWrapper = styled.div`
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem 1rem;
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 2rem;

    @media (max-width: 1200px) {
        grid-template-columns: 1fr;
    }
`;

const MainColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
`;

const SidebarColumn = styled.div`
    position: sticky;
    top: 2rem;
    align-self: start;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    @media (max-width: 1200px) {
        position: static;
    }
`;

const DemoNotice = styled.div`
    display: flex;
    gap: 1rem;
    padding: 1.25rem;
    background: #fef3c7;
    border: 2px solid #fbbf24;
    border-radius: 0.75rem;

    svg {
        flex-shrink: 0;
        color: #d97706;
    }

    strong {
        display: block;
        color: #92400e;
        margin-bottom: 0.25rem;
        font-size: 1.1rem;
    }

    p {
        margin: 0;
        color: #78350f;
        font-size: 0.9rem;
    }
`;

const PaymentCard = styled.div`
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden;
`;

const CardHeader = styled.div`
    padding: 2rem;
    border-bottom: 2px solid #e2e8f0;
    display: flex;
    gap: 1rem;

    svg {
        color: #7c3aed;
        flex-shrink: 0;
    }

    h1 {
        margin: 0 0 0.5rem;
        color: #0f172a;
        font-size: 1.75rem;
    }
`;

const SecureBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #dcfce7;
    border: 1px solid #86efac;
    border-radius: 0.5rem;
    color: #166534;
    font-weight: 700;
    font-size: 0.9rem;
`;

const Form = styled.form`
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
`;

const SectionTitle = styled.h3`
    margin: 0;
    color: #0f172a;
    font-size: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e2e8f0;
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const FormGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

const Label = styled.label`
    font-weight: 600;
    color: #334155;
    font-size: 0.9rem;
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

const CardInput = styled(Input)`
    font-family: 'Courier New', monospace;
    letter-spacing: 0.05em;
    font-size: 1.1rem;
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

const CheckboxGroup = styled.label`
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: ${p => p.error ? '#fef2f2' : '#f8fafc'};
    border: 1px solid ${p => p.error ? '#fecaca' : '#e2e8f0'};
    border-radius: 0.5rem;
    cursor: pointer;

    input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        flex-shrink: 0;
        margin-top: 0.15rem;
    }

    label {
        color: #475569;
        font-weight: 500;
        line-height: 1.5;
        cursor: pointer;
    }
`;

const Link = styled.a`
    color: #7c3aed;
    text-decoration: none;
    font-weight: 600;

    &:hover {
        text-decoration: underline;
    }
`;

const ErrorText = styled.span`
    color: #dc2626;
    font-size: 0.85rem;
    font-weight: 500;
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 1rem;
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
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;

    &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 10px 20px rgba(124, 58, 237, 0.3);
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
`;

const Spinner = styled.div`
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

const SummaryCard = styled.div`
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden;
`;

const SummaryHeader = styled.div`
    padding: 1.25rem;
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);

    h3 {
        margin: 0;
        color: white;
        font-size: 1.125rem;
    }
`;

const SummaryBody = styled.div`
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const SummarySection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const SummaryLabel = styled.div`
    font-weight: 700;
    color: #64748b;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const FlightDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .route {
        font-weight: 700;
        color: #0f172a;
        font-size: 1.1rem;
    }

    .date, .airline {
        color: #64748b;
        font-size: 0.9rem;
    }
`;

const PassengerRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #475569;
    font-size: 0.9rem;

    .type {
        color: #94a3b8;
        font-size: 0.85rem;
    }
`;

const Divider = styled.div`
    height: 1px;
    background: #e2e8f0;
`;

const PriceRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;

    span {
        color: #64748b;
        font-weight: 500;
    }

    strong {
        color: #0f172a;
        font-weight: 700;
    }
`;

const TotalRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0.5rem;

    span {
        color: #475569;
        font-weight: 600;
        font-size: 1.1rem;
    }

    strong {
        color: #0f172a;
        font-size: 1.75rem;
    }
`;

const SecurityBadges = styled.div`
    background: white;
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const Badge = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #059669;
    font-weight: 600;
    font-size: 0.9rem;

    svg {
        flex-shrink: 0;
    }
`;