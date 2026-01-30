import React from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Download, Mail, Plane, Calendar, MapPin, User, Luggage, UtensilsCrossed, CreditCard, Home } from "lucide-react";

export default function Confirmation() {
    const { state } = useLocation();
    const navigate = useNavigate();
    
    const booking = state || {};
    const bookingRef = booking.bookingReference || "N/A";
    const flightDetails = booking.flightDetails || {};
    const travelers = booking.travelers || [];
    const seatAssignments = booking.seatAssignments || [];
    const contactDetails = booking.contactDetails || {};

    const handleDownloadPDF = () => {
        // In production, this would generate and download a real PDF
        alert("PDF e-ticket would be downloaded here. Feature available in production version.");
    };

    const handleEmailTicket = () => {
        alert(`E-ticket would be sent to ${contactDetails.email}`);
    };

    const handleNewBooking = () => {
        navigate("/booking");
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <PageContainer>
            <ConfirmationHeader>
                <SuccessIcon>
                    <CheckCircle size={80} />
                </SuccessIcon>
                <h1>✅ Booking Confirmed!</h1>
                <BookingReference>
                    Booking Reference: <strong>{bookingRef}</strong>
                </BookingReference>
                <ConfirmationSent>
                    <Mail size={18} />
                    <span>Confirmation sent to {contactDetails.email}</span>
                </ConfirmationSent>
            </ConfirmationHeader>

            <ContentWrapper>
                <MainColumn>
                    {/* E-Ticket Actions */}
                    <ActionCard>
                        <h2>📱 Your E-Ticket</h2>
                        <p>Download or email your boarding pass</p>
                        <ActionButtons>
                            <DownloadButton onClick={handleDownloadPDF}>
                                <Download size={20} />
                                Download PDF
                            </DownloadButton>
                            <EmailButton onClick={handleEmailTicket}>
                                <Mail size={20} />
                                Email Ticket
                            </EmailButton>
                        </ActionButtons>
                    </ActionCard>

                    {/* Flight Details */}
                    <DetailCard>
                        <CardHeader>
                            <Plane size={24} />
                            <h2>Flight Details</h2>
                        </CardHeader>
                        
                        <FlightRoute>
                            <RoutePoint>
                                <Airport>{flightDetails.originCode}</Airport>
                                <City>{flightDetails.originCity}, {flightDetails.originCountry}</City>
                                <Time>{flightDetails.departureTime}</Time>
                                <Date>{flightDetails.departureDate}</Date>
                            </RoutePoint>
                            
                            <RouteArrow>
                                <div className="line"></div>
                                <Plane size={20} />
                                <div className="line"></div>
                            </RouteArrow>
                            
                            <RoutePoint>
                                <Airport>{flightDetails.destCode}</Airport>
                                <City>{flightDetails.destCity}, {flightDetails.destCountry}</City>
                                <Time>{flightDetails.arrivalTime}</Time>
                                <Date>{flightDetails.arrivalDate}</Date>
                            </RoutePoint>
                        </FlightRoute>

                        <FlightInfo>
                            <InfoRow>
                                <label>Airline:</label>
                                <value>{flightDetails.airlineName}</value>
                            </InfoRow>
                            <InfoRow>
                                <label>Flight Number:</label>
                                <value>{flightDetails.carrierCode} {flightDetails.flightNumber}</value>
                            </InfoRow>
                            <InfoRow>
                                <label>Duration:</label>
                                <value>{flightDetails.duration}</value>
                            </InfoRow>
                            <InfoRow>
                                <label>Class:</label>
                                <value>{flightDetails.cabin || 'Economy'}</value>
                            </InfoRow>
                        </FlightInfo>
                    </DetailCard>

                    {/* Passengers */}
                    <DetailCard>
                        <CardHeader>
                            <User size={24} />
                            <h2>Passengers</h2>
                        </CardHeader>
                        
                        <PassengersList>
                            {travelers.map((traveler, idx) => {
                                const seat = seatAssignments[idx]?.seat;
                                const seatDetails = seatAssignments[idx]?.seatDetails;
                                
                                return (
                                    <PassengerRow key={idx}>
                                        <PassengerNumber>{idx + 1}</PassengerNumber>
                                        <PassengerInfo>
                                            <strong>
                                                {traveler.title} {traveler.firstName} {traveler.lastName}
                                            </strong>
                                            <span className="type">{traveler.typeLabel}</span>
                                            {seat && (
                                                <SeatInfo>
                                                    <MapPin size={14} />
                                                    <span>Seat {seat}</span>
                                                    {seatDetails?.isWindow && <span>• Window</span>}
                                                    {seatDetails?.isAisle && <span>• Aisle</span>}
                                                </SeatInfo>
                                            )}
                                        </PassengerInfo>
                                    </PassengerRow>
                                );
                            })}
                        </PassengersList>
                    </DetailCard>

                    {/* Baggage & Add-ons */}
                    {(booking.baggage || booking.meals || booking.insurance) && (
                        <DetailCard>
                            <CardHeader>
                                <Luggage size={24} />
                                <h2>Add-ons & Services</h2>
                            </CardHeader>
                            
                            <AddonsList>
                                {booking.baggage && booking.baggage.price > 0 && (
                                    <AddonItem>
                                        <strong>Baggage:</strong>
                                        <span>
                                            {booking.baggage.checkedBags > 0 && `${booking.baggage.checkedBags} checked bag(s)`}
                                            {booking.baggage.secondBags > 0 && `, ${booking.baggage.secondBags} additional bag(s)`}
                                            {booking.baggage.oversizedItems > 0 && `, ${booking.baggage.oversizedItems} oversized item(s)`}
                                        </span>
                                    </AddonItem>
                                )}
                                
                                {booking.meals && booking.meals.some(m => m.preference !== 'STANDARD') && (
                                    <AddonItem>
                                        <strong>
                                            <UtensilsCrossed size={16} />
                                            Meal Preferences:
                                        </strong>
                                        <MealsList>
                                            {booking.meals.filter(m => m.preference !== 'STANDARD').map((meal, idx) => (
                                                <span key={idx}>
                                                    {meal.traveler.firstName}: {meal.preference.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                        </MealsList>
                                    </AddonItem>
                                )}
                                
                                {booking.insurance && booking.insurance.type !== 'none' && (
                                    <AddonItem>
                                        <strong>Travel Insurance:</strong>
                                        <span>{booking.insurance.type.charAt(0).toUpperCase() + booking.insurance.type.slice(1)} Coverage</span>
                                    </AddonItem>
                                )}
                            </AddonsList>
                        </DetailCard>
                    )}

                    {/* Payment Summary */}
                    <DetailCard>
                        <CardHeader>
                            <CreditCard size={24} />
                            <h2>Payment Summary</h2>
                        </CardHeader>
                        
                        <PricingTable>
                            <PriceRow>
                                <span>Flight</span>
                                <strong>{flightDetails.totalPrice}</strong>
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
                                <span>Total Paid</span>
                                <strong>${booking.totalPrice?.toFixed(2) || '0.00'}</strong>
                            </TotalRow>
                            
                            {booking.paymentDetails && (
                                <PaymentMethod>
                                    <CreditCard size={16} />
                                    <span>Card ending in {booking.paymentDetails.cardLast4}</span>
                                </PaymentMethod>
                            )}
                        </PricingTable>
                    </DetailCard>
                </MainColumn>

                <SidebarColumn>
                    {/* Next Steps */}
                    <NextStepsCard>
                        <h3>📋 What's Next?</h3>
                        <StepsList>
                            <Step>
                                <StepNumber>1</StepNumber>
                                <StepContent>
                                    <strong>Check-in opens 24 hours before departure</strong>
                                    <span>Complete online check-in to save time at the airport</span>
                                </StepContent>
                            </Step>
                            
                            <Step>
                                <StepNumber>2</StepNumber>
                                <StepContent>
                                    <strong>Download boarding pass</strong>
                                    <span>Mobile boarding pass available after check-in</span>
                                </StepContent>
                            </Step>
                            
                            <Step>
                                <StepNumber>3</StepNumber>
                                <StepContent>
                                    <strong>Arrive at airport 2-3 hours early</strong>
                                    <span>International flights require more time</span>
                                </StepContent>
                            </Step>
                            
                            <Step>
                                <StepNumber>4</StepNumber>
                                <StepContent>
                                    <strong>Bring required documents</strong>
                                    <span>Valid passport and any visa requirements</span>
                                </StepContent>
                            </Step>
                        </StepsList>
                    </NextStepsCard>

                    {/* Important Info */}
                    <ImportantInfo>
                        <h3>⚠️ Important Information</h3>
                        <InfoList>
                            <li>Names must match passport exactly</li>
                            <li>Baggage must meet airline size/weight limits</li>
                            <li>Arrive at gate 30 minutes before boarding</li>
                            <li>Check visa requirements for your destination</li>
                        </InfoList>
                    </ImportantInfo>

                    {/* Actions */}
                    <ActionButtons style={{ flexDirection: 'column', gap: '0.75rem' }}>
                        <FullButton onClick={() => window.print()}>
                            Print Confirmation
                        </FullButton>
                        <FullButton secondary onClick={handleNewBooking}>
                            <Home size={18} />
                            Book Another Flight
                        </FullButton>
                    </ActionButtons>
                </SidebarColumn>
            </ContentWrapper>
        </PageContainer>
    );
}

/* Styled Components */

const PageContainer = styled.div`
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem 1rem;
`;

const ConfirmationHeader = styled.div`
    text-align: center;
    color: white;
    margin-bottom: 3rem;
    
    h1 {
        margin: 1rem 0;
        font-size: 2.5rem;
    }
`;

const SuccessIcon = styled.div`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
    background: white;
    border-radius: 50%;
    margin-bottom: 1rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    
    svg {
        color: #10b981;
    }
`;

const BookingReference = styled.div`
    font-size: 1.25rem;
    margin: 1rem 0;
    
    strong {
        font-family: 'Courier New', monospace;
        font-size: 1.5rem;
        letter-spacing: 0.1em;
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 0.5rem;
    }
`;

const ConfirmationSent = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    font-weight: 600;
    margin-top: 1rem;
`;

const ContentWrapper = styled.div`
    max-width: 1400px;
    margin: 0 auto;
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
    gap: 2rem;
`;

const SidebarColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
`;

const ActionCard = styled.div`
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
    
    h2 {
        margin: 0 0 0.5rem;
        color: #0f172a;
        font-size: 1.5rem;
    }
    
    p {
        margin: 0 0 1.5rem;
        color: #64748b;
    }
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 1rem;
    justify-content: center;
    
    @media (max-width: 640px) {
        flex-direction: column;
    }
`;

const DownloadButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 2rem;
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(124, 58, 237, 0.3);
    }
`;

const EmailButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 2rem;
    background: white;
    color: #7c3aed;
    border: 2px solid #7c3aed;
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
        background: #faf5ff;
    }
`;

const DetailCard = styled.div`
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
`;

const CardHeader = styled.div`
    padding: 1.5rem 2rem;
    border-bottom: 2px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 1rem;
    
    svg {
        color: #7c3aed;
    }
    
    h2 {
        margin: 0;
        color: #0f172a;
        font-size: 1.25rem;
    }
`;

const FlightRoute = styled.div`
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 2rem;
    padding: 2rem;
    align-items: center;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
`;

const RoutePoint = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
`;

const Airport = styled.div`
    font-size: 2rem;
    font-weight: 700;
    color: #0f172a;
`;

const City = styled.div`
    color: #64748b;
    font-size: 0.95rem;
`;

const Time = styled.div`
    font-size: 1.5rem;
    font-weight: 700;
    color: #7c3aed;
    margin-top: 0.5rem;
`;

const Date = styled.div`
    color: #64748b;
    font-size: 0.9rem;
`;

const RouteArrow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #7c3aed;
    
    .line {
        flex: 1;
        height: 2px;
        background: linear-gradient(90deg, #7c3aed, #a855f7);
    }
    
    svg {
        flex-shrink: 0;
    }
    
    @media (max-width: 768px) {
        transform: rotate(90deg);
    }
`;

const FlightInfo = styled.div`
    padding: 0 2rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
`;

const InfoRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f1f5f9;
    
    label {
        color: #64748b;
        font-weight: 500;
    }
    
    value {
        color: #0f172a;
        font-weight: 600;
    }
`;

const PassengersList = styled.div`
    padding: 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const PassengerRow = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0.5rem;
`;

const PassengerNumber = styled.div`
    width: 32px;
    height: 32px;
    background: #7c3aed;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
`;

const PassengerInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    
    strong {
        color: #0f172a;
        font-size: 1.05rem;
    }
    
    .type {
        color: #64748b;
        font-size: 0.85rem;
    }
`;

const SeatInfo = styled.div`
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

const AddonsList = styled.div`
    padding: 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const AddonItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0.5rem;
    
    strong {
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    span {
        color: #64748b;
    }
`;

const MealsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.5rem;
    
    span {
        padding-left: 1.5rem;
        font-size: 0.9rem;
    }
`;

const PricingTable = styled.div`
    padding: 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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

const Divider = styled.div`
    height: 1px;
    background: #e2e8f0;
    margin: 0.5rem 0;
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

const PaymentMethod = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;
    font-size: 0.9rem;
    margin-top: 0.5rem;
`;

const NextStepsCard = styled.div`
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    
    h3 {
        margin: 0 0 1.5rem;
        color: #0f172a;
        font-size: 1.25rem;
    }
`;

const StepsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
`;

const Step = styled.div`
    display: flex;
    gap: 1rem;
`;

const StepNumber = styled.div`
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
`;

const StepContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    strong {
        color: #0f172a;
        font-size: 0.95rem;
    }
    
    span {
        color: #64748b;
        font-size: 0.85rem;
        line-height: 1.4;
    }
`;

const ImportantInfo = styled.div`
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 0.75rem;
    padding: 1.25rem;
    
    h3 {
        margin: 0 0 1rem;
        color: #92400e;
        font-size: 1.1rem;
    }
`;

const InfoList = styled.ul`
    margin: 0;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    
    li {
        color: #78350f;
        font-size: 0.9rem;
        line-height: 1.5;
    }
`;

const FullButton = styled.button`
    padding: 0.875rem 2rem;
    background: ${p => p.secondary ? 'white' : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'};
    color: ${p => p.secondary ? '#7c3aed' : 'white'};
    border: ${p => p.secondary ? '2px solid #7c3aed' : 'none'};
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(124, 58, 237, 0.3);
    }
`;
