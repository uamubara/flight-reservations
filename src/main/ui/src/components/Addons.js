import React, { useState } from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { Luggage, UtensilsCrossed, Shield, Heart, Plus, Minus, Info, Check } from "lucide-react";
import ProgressIndicator from "./ProgressIndicator";

export default function Addons() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const travelers = state?.travelers || [];
    const formattedTravelers = state?.formattedTravelers || [];  // ← ADDED FOR AMADEUS API
    const contactDetails = state?.contactDetails || {};
    const flight = state?.flight;
    const flightDetails = state?.flightDetails || {};
    const passengerCounts = state?.passengerCounts || {};
    const seatAssignments = state?.seatAssignments || [];
    const seatPrice = state?.seatPrice || 0;

    // Baggage state
    const [checkedBags, setCheckedBags] = useState(0);
    const [secondBags, setSecondBags] = useState(0);
    const [oversizedItems, setOversizedItems] = useState(0);

    // Meal preferences state - one per traveler
    const [mealPreferences, setMealPreferences] = useState(
        travelers.map(() => "STANDARD")
    );

    // Special assistance state
    const [specialAssistance, setSpecialAssistance] = useState({
        wheelchair: false,
        wheelchairToAircraft: false,
        wheelchairToSeat: false,
        medicalEquipment: false,
        serviceAnimal: false,
        oxygen: false,
        deaf: false,
        blind: false,
        pregnant: false,
        pregnantDueDate: ""
    });

    // Travel insurance state
    const [insurance, setInsurance] = useState("none");

    // Pricing
    const PRICES = {
        checkedBag1: 35,
        checkedBag2: 45,
        oversized: 75,
        insuranceBasic: 25,
        insuranceStandard: 45,
        insurancePremium: 75
    };

    const calculateBaggageTotal = () => {
        return (
            checkedBags * PRICES.checkedBag1 +
            secondBags * PRICES.checkedBag2 +
            oversizedItems * PRICES.oversized
        );
    };

    const calculateInsurancePrice = () => {
        switch (insurance) {
            case "basic": return PRICES.insuranceBasic;
            case "standard": return PRICES.insuranceStandard;
            case "premium": return PRICES.insurancePremium;
            default: return 0;
        }
    };

    const calculateTotal = () => {
        const flightPrice = parseFloat(flightDetails.totalPrice?.replace(/[^0-9.]/g, '') || 0);
        return flightPrice + seatPrice + calculateBaggageTotal() + calculateInsurancePrice();
    };

    const handleMealChange = (index, value) => {
        const updated = [...mealPreferences];
        updated[index] = value;
        setMealPreferences(updated);
    };

    const handleAssistanceChange = (field, value) => {
        setSpecialAssistance(prev => ({ ...prev, [field]: value }));
    };

    const handleContinue = () => {
        navigate("/payment", {
            state: {
                travelers: travelers,
                formattedTravelers: formattedTravelers,  // ← PASS FORMATTED DATA
                contactDetails: contactDetails,
                flight: flight,
                flightDetails: flightDetails,
                passengerCounts: passengerCounts,
                seatAssignments: seatAssignments,
                seatPrice: seatPrice,
                baggage: {
                    checkedBags: checkedBags,
                    secondBags: secondBags,
                    oversizedItems: oversizedItems,
                    price: calculateBaggageTotal()
                },
                meals: mealPreferences.map((pref, idx) => ({
                    traveler: travelers[idx],
                    preference: pref
                })),
                specialAssistance: specialAssistance,
                insurance: {
                    type: insurance,
                    price: calculateInsurancePrice()
                },
                totalPrice: calculateTotal()
            }
        });
    };

    return (
        <PageContainer>
            <ProgressIndicator currentStep={5} totalSteps={7} />

            <ContentWrapper>
                <MainColumn>
                    {/* Baggage Section */}
                    <AddonCard>
                        <CardHeader>
                            <Luggage size={24} />
                            <div>
                                <h2>Baggage</h2>
                                <p>Add checked bags to your trip. Included: 1 carry-on + 1 personal item</p>
                            </div>
                        </CardHeader>

                        <CardBody>
                            <BaggageOption>
                                <OptionInfo>
                                    <strong>1st Checked Bag (up to 23kg)</strong>
                                    <span>Pre-purchase: ${PRICES.checkedBag1} • At airport: $45</span>
                                </OptionInfo>
                                <Counter>
                                    <CounterButton
                                        onClick={() => setCheckedBags(Math.max(0, checkedBags - 1))}
                                        disabled={checkedBags === 0}
                                    >
                                        <Minus size={16} />
                                    </CounterButton>
                                    <CounterValue>{checkedBags}</CounterValue>
                                    <CounterButton onClick={() => setCheckedBags(checkedBags + 1)}>
                                        <Plus size={16} />
                                    </CounterButton>
                                </Counter>
                                <OptionPrice>${(checkedBags * PRICES.checkedBag1).toFixed(2)}</OptionPrice>
                            </BaggageOption>

                            <BaggageOption>
                                <OptionInfo>
                                    <strong>2nd Checked Bag (up to 23kg)</strong>
                                    <span>Pre-purchase: ${PRICES.checkedBag2} • At airport: $60</span>
                                </OptionInfo>
                                <Counter>
                                    <CounterButton
                                        onClick={() => setSecondBags(Math.max(0, secondBags - 1))}
                                        disabled={secondBags === 0}
                                    >
                                        <Minus size={16} />
                                    </CounterButton>
                                    <CounterValue>{secondBags}</CounterValue>
                                    <CounterButton onClick={() => setSecondBags(secondBags + 1)}>
                                        <Plus size={16} />
                                    </CounterButton>
                                </Counter>
                                <OptionPrice>${(secondBags * PRICES.checkedBag2).toFixed(2)}</OptionPrice>
                            </BaggageOption>

                            <BaggageOption>
                                <OptionInfo>
                                    <strong>Oversized/Special Items</strong>
                                    <span>Golf clubs, skis, surfboards, bicycles</span>
                                </OptionInfo>
                                <Counter>
                                    <CounterButton
                                        onClick={() => setOversizedItems(Math.max(0, oversizedItems - 1))}
                                        disabled={oversizedItems === 0}
                                    >
                                        <Minus size={16} />
                                    </CounterButton>
                                    <CounterValue>{oversizedItems}</CounterValue>
                                    <CounterButton onClick={() => setOversizedItems(oversizedItems + 1)}>
                                        <Plus size={16} />
                                    </CounterButton>
                                </Counter>
                                <OptionPrice>${(oversizedItems * PRICES.oversized).toFixed(2)}</OptionPrice>
                            </BaggageOption>

                            <Subtotal>
                                <span>Baggage subtotal:</span>
                                <strong>${calculateBaggageTotal().toFixed(2)}</strong>
                            </Subtotal>
                        </CardBody>
                    </AddonCard>

                    {/* Meal Preferences Section */}
                    <AddonCard>
                        <CardHeader>
                            <UtensilsCrossed size={24} />
                            <div>
                                <h2>Meal Preferences</h2>
                                <p>Special meal requests must be made at least 24 hours before departure</p>
                            </div>
                        </CardHeader>

                        <CardBody>
                            {travelers.map((traveler, idx) => (
                                <MealOption key={idx}>
                                    <PassengerLabel>
                                        <strong>Passenger {idx + 1}:</strong>
                                        <span>{traveler.firstName || 'Not entered'} {traveler.lastName || ''}</span>
                                        <TypeBadge>{traveler.typeLabel}</TypeBadge>
                                    </PassengerLabel>
                                    <MealSelect
                                        value={mealPreferences[idx]}
                                        onChange={(e) => handleMealChange(idx, e.target.value)}
                                    >
                                        <option value="STANDARD">Standard Meal (Included)</option>
                                        <optgroup label="Vegetarian Options">
                                            <option value="VEGETARIAN">Vegetarian (VGML)</option>
                                            <option value="VEGAN">Vegan (VGML)</option>
                                            <option value="HINDU">Hindu Meal (HNML)</option>
                                        </optgroup>
                                        <optgroup label="Religious Options">
                                            <option value="KOSHER">Kosher (KSML)</option>
                                            <option value="HALAL">Halal (MOML)</option>
                                        </optgroup>
                                        <optgroup label="Dietary Restrictions">
                                            <option value="GLUTEN_FREE">Gluten-Free (GFML)</option>
                                            <option value="DIABETIC">Diabetic (DBML)</option>
                                            <option value="LOW_SODIUM">Low Sodium (LSML)</option>
                                            <option value="LOW_FAT">Low Fat (LFML)</option>
                                        </optgroup>
                                        <optgroup label="Special Meals">
                                            <option value="CHILD">Child Meal (CHML)</option>
                                            <option value="BABY">Baby Meal (BBML)</option>
                                            <option value="SEAFOOD">Seafood (SFML)</option>
                                            <option value="BLAND">Bland Meal (BLML)</option>
                                        </optgroup>
                                    </MealSelect>
                                </MealOption>
                            ))}

                            <InfoBox>
                                <Info size={16} />
                                <div>
                                    <strong>Meal Information</strong>
                                    <p>Special meals are complimentary on international flights. Availability varies by route and class of service.</p>
                                </div>
                            </InfoBox>
                        </CardBody>
                    </AddonCard>

                    {/* Special Assistance Section */}
                    <AddonCard>
                        <CardHeader>
                            <Heart size={24} />
                            <div>
                                <h2>Special Assistance</h2>
                                <p>Let us know if you need any special services during your journey</p>
                            </div>
                        </CardHeader>

                        <CardBody>
                            <AssistanceGroup>
                                <GroupLabel>Mobility Assistance</GroupLabel>
                                <CheckboxOption>
                                    <input
                                        type="checkbox"
                                        checked={specialAssistance.wheelchair}
                                        onChange={(e) => handleAssistanceChange('wheelchair', e.target.checked)}
                                    />
                                    <label>Wheelchair (airport only)</label>
                                </CheckboxOption>
                                <CheckboxOption>
                                    <input
                                        type="checkbox"
                                        checked={specialAssistance.wheelchairToAircraft}
                                        onChange={(e) => handleAssistanceChange('wheelchairToAircraft', e.target.checked)}
                                    />
                                    <label>Wheelchair (to aircraft door)</label>
                                </CheckboxOption>
                                <CheckboxOption>
                                    <input
                                        type="checkbox"
                                        checked={specialAssistance.wheelchairToSeat}
                                        onChange={(e) => handleAssistanceChange('wheelchairToSeat', e.target.checked)}
                                    />
                                    <label>Wheelchair (to seat)</label>
                                </CheckboxOption>
                            </AssistanceGroup>

                            <AssistanceGroup>
                                <GroupLabel>Medical Needs</GroupLabel>
                                <CheckboxOption>
                                    <input
                                        type="checkbox"
                                        checked={specialAssistance.medicalEquipment}
                                        onChange={(e) => handleAssistanceChange('medicalEquipment', e.target.checked)}
                                    />
                                    <label>Traveling with medical equipment</label>
                                </CheckboxOption>
                                <CheckboxOption>
                                    <input
                                        type="checkbox"
                                        checked={specialAssistance.serviceAnimal}
                                        onChange={(e) => handleAssistanceChange('serviceAnimal', e.target.checked)}
                                    />
                                    <label>Service animal</label>
                                </CheckboxOption>
                                <CheckboxOption>
                                    <input
                                        type="checkbox"
                                        checked={specialAssistance.oxygen}
                                        onChange={(e) => handleAssistanceChange('oxygen', e.target.checked)}
                                    />
                                    <label>Oxygen required</label>
                                </CheckboxOption>
                            </AssistanceGroup>

                            <AssistanceGroup>
                                <GroupLabel>Accessibility</GroupLabel>
                                <CheckboxOption>
                                    <input
                                        type="checkbox"
                                        checked={specialAssistance.deaf}
                                        onChange={(e) => handleAssistanceChange('deaf', e.target.checked)}
                                    />
                                    <label>Deaf or hard of hearing</label>
                                </CheckboxOption>
                                <CheckboxOption>
                                    <input
                                        type="checkbox"
                                        checked={specialAssistance.blind}
                                        onChange={(e) => handleAssistanceChange('blind', e.target.checked)}
                                    />
                                    <label>Blind or visually impaired</label>
                                </CheckboxOption>
                            </AssistanceGroup>

                            <AssistanceGroup>
                                <GroupLabel>Other</GroupLabel>
                                <CheckboxOption>
                                    <input
                                        type="checkbox"
                                        checked={specialAssistance.pregnant}
                                        onChange={(e) => handleAssistanceChange('pregnant', e.target.checked)}
                                    />
                                    <label>Pregnant traveler</label>
                                </CheckboxOption>
                                {specialAssistance.pregnant && (
                                    <SubField>
                                        <label>Expected due date:</label>
                                        <input
                                            type="date"
                                            value={specialAssistance.pregnantDueDate}
                                            onChange={(e) => handleAssistanceChange('pregnantDueDate', e.target.value)}
                                        />
                                    </SubField>
                                )}
                            </AssistanceGroup>
                        </CardBody>
                    </AddonCard>

                    {/* Travel Insurance Section */}
                    <AddonCard>
                        <CardHeader>
                            <Shield size={24} />
                            <div>
                                <h2>Travel Insurance</h2>
                                <p>Protect your trip from unexpected events</p>
                            </div>
                        </CardHeader>

                        <CardBody>
                            <InsuranceOption selected={insurance === "none"}>
                                <input
                                    type="radio"
                                    name="insurance"
                                    value="none"
                                    checked={insurance === "none"}
                                    onChange={(e) => setInsurance(e.target.value)}
                                />
                                <InsuranceDetails>
                                    <strong>No Insurance</strong>
                                    <span>Continue without protection</span>
                                </InsuranceDetails>
                                <InsurancePrice>$0.00</InsurancePrice>
                            </InsuranceOption>

                            <InsuranceOption selected={insurance === "basic"}>
                                <input
                                    type="radio"
                                    name="insurance"
                                    value="basic"
                                    checked={insurance === "basic"}
                                    onChange={(e) => setInsurance(e.target.value)}
                                />
                                <InsuranceDetails>
                                    <strong>Basic Protection</strong>
                                    <Benefits>
                                        <li>Trip cancellation up to $1,000</li>
                                        <li>Medical coverage up to $25,000</li>
                                        <li>Baggage loss up to $500</li>
                                    </Benefits>
                                </InsuranceDetails>
                                <InsurancePrice>${PRICES.insuranceBasic.toFixed(2)}</InsurancePrice>
                            </InsuranceOption>

                            <InsuranceOption selected={insurance === "standard"} recommended>
                                <input
                                    type="radio"
                                    name="insurance"
                                    value="standard"
                                    checked={insurance === "standard"}
                                    onChange={(e) => setInsurance(e.target.value)}
                                />
                                <InsuranceDetails>
                                    <strong>Standard Protection</strong>
                                    <RecommendedBadge>Recommended</RecommendedBadge>
                                    <Benefits>
                                        <li>Trip cancellation up to $1,500</li>
                                        <li>Medical coverage up to $50,000</li>
                                        <li>Baggage loss up to $1,000</li>
                                        <li>24/7 travel assistance</li>
                                        <li>Flight delay coverage</li>
                                    </Benefits>
                                </InsuranceDetails>
                                <InsurancePrice>${PRICES.insuranceStandard.toFixed(2)}</InsurancePrice>
                            </InsuranceOption>

                            <InsuranceOption selected={insurance === "premium"}>
                                <input
                                    type="radio"
                                    name="insurance"
                                    value="premium"
                                    checked={insurance === "premium"}
                                    onChange={(e) => setInsurance(e.target.value)}
                                />
                                <InsuranceDetails>
                                    <strong>Premium Protection</strong>
                                    <Benefits>
                                        <li>Trip cancellation up to $2,500</li>
                                        <li>Medical coverage up to $100,000</li>
                                        <li>Baggage loss up to $2,000</li>
                                        <li>24/7 concierge service</li>
                                        <li>Cancel for any reason (75% refund)</li>
                                        <li>Emergency evacuation</li>
                                    </Benefits>
                                </InsuranceDetails>
                                <InsurancePrice>${PRICES.insurancePremium.toFixed(2)}</InsurancePrice>
                            </InsuranceOption>

                            <InfoBox>
                                <Info size={16} />
                                <div>
                                    <strong>Why choose insurance?</strong>
                                    <p>Unexpected things happen. Travel insurance gives you peace of mind and protects your investment against trip cancellations, medical emergencies, and lost baggage.</p>
                                </div>
                            </InfoBox>
                        </CardBody>
                    </AddonCard>
                </MainColumn>

                <SidebarColumn>
                    <SummaryCard>
                        <SummaryHeader>
                            <h3>Booking Summary</h3>
                        </SummaryHeader>

                        <SummaryBody>
                            <SummaryItem>
                                <span>Flight</span>
                                <strong>{flightDetails.totalPrice}</strong>
                            </SummaryItem>

                            {seatPrice > 0 && (
                                <SummaryItem>
                                    <span>Seats</span>
                                    <strong>${seatPrice.toFixed(2)}</strong>
                                </SummaryItem>
                            )}

                            {calculateBaggageTotal() > 0 && (
                                <SummaryItem>
                                    <span>Baggage</span>
                                    <strong>${calculateBaggageTotal().toFixed(2)}</strong>
                                </SummaryItem>
                            )}

                            {calculateInsurancePrice() > 0 && (
                                <SummaryItem>
                                    <span>Insurance</span>
                                    <strong>${calculateInsurancePrice().toFixed(2)}</strong>
                                </SummaryItem>
                            )}

                            <Divider />

                            <TotalRow>
                                <span>Total</span>
                                <strong>${calculateTotal().toFixed(2)}</strong>
                            </TotalRow>
                        </SummaryBody>
                    </SummaryCard>

                    <ActionButtons>
                        <SecondaryButton onClick={() => navigate(-1)}>
                            Back to Seats
                        </SecondaryButton>
                        <PrimaryButton onClick={handleContinue}>
                            Continue to Payment
                        </PrimaryButton>
                    </ActionButtons>
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
    gap: 2rem;
`;

const SidebarColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: sticky;
    top: 2rem;
    align-self: start;

    @media (max-width: 1200px) {
        position: static;
    }
`;

const AddonCard = styled.div`
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden;
`;

const CardHeader = styled.div`
    padding: 1.5rem 2rem;
    border-bottom: 2px solid #e2e8f0;
    display: flex;
    gap: 1rem;

    svg {
        color: #7c3aed;
        flex-shrink: 0;
    }

    h2 {
        margin: 0 0 0.25rem;
        color: #0f172a;
        font-size: 1.5rem;
    }

    p {
        margin: 0;
        color: #64748b;
        font-size: 0.9rem;
    }
`;

const CardBody = styled.div`
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
`;

const BaggageOption = styled.div`
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.25rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;

    @media (max-width: 640px) {
        flex-direction: column;
        align-items: stretch;
    }
`;

const OptionInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    strong {
        color: #0f172a;
        font-size: 1rem;
    }

    span {
        color: #64748b;
        font-size: 0.85rem;
    }
`;

const Counter = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`;

const CounterButton = styled.button`
    width: 36px;
    height: 36px;
    border: 2px solid #cbd5e1;
    background: white;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        background: #f8fafc;
        border-color: #7c3aed;
        color: #7c3aed;
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
`;

const CounterValue = styled.div`
    min-width: 40px;
    text-align: center;
    font-weight: 700;
    font-size: 1.1rem;
    color: #0f172a;
`;

const OptionPrice = styled.div`
    font-weight: 700;
    font-size: 1.25rem;
    color: #059669;
    min-width: 80px;
    text-align: right;
`;

const Subtotal = styled.div`
    display: flex;
    justify-content: space-between;
    padding-top: 1rem;
    border-top: 2px solid #e2e8f0;

    span {
        color: #64748b;
        font-weight: 600;
    }

    strong {
        color: #0f172a;
        font-size: 1.25rem;
    }
`;

const MealOption = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
`;

const PassengerLabel = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;

    strong {
        color: #0f172a;
    }

    span {
        color: #64748b;
    }
`;

const TypeBadge = styled.span`
    padding: 0.25rem 0.75rem;
    background: #e0e7ff;
    color: #3730a3;
    border-radius: 0.375rem;
    font-size: 0.8rem;
    font-weight: 700;
`;

const MealSelect = styled.select`
    padding: 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.5rem;
    font-size: 1rem;
    background: white;
    cursor: pointer;

    &:focus {
        outline: none;
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }
`;

const AssistanceGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
`;

const GroupLabel = styled.div`
    font-weight: 700;
    color: #0f172a;
    font-size: 1rem;
    margin-bottom: 0.5rem;
`;

const CheckboxOption = styled.label`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: background 0.2s;

    &:hover {
        background: white;
    }

    input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
    }

    label {
        color: #475569;
        font-weight: 500;
        cursor: pointer;
    }
`;

const SubField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-left: 2rem;

    label {
        color: #64748b;
        font-size: 0.9rem;
        font-weight: 600;
    }

    input[type="date"] {
        padding: 0.5rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.375rem;
        font-size: 0.95rem;
    }
`;

const InsuranceOption = styled.label`
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    border: 2px solid ${p => p.selected ? '#7c3aed' : '#e2e8f0'};
    background: ${p => p.selected ? '#faf5ff' : '#f8fafc'};
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;

    ${p => p.recommended && `
        &::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(135deg, #7c3aed, #a855f7);
            border-radius: 0.75rem;
            z-index: -1;
        }
    `}

    &:hover {
        border-color: #7c3aed;
    }

    input[type="radio"] {
        margin-top: 0.25rem;
        width: 20px;
        height: 20px;
        cursor: pointer;
        flex-shrink: 0;
    }
`;

const InsuranceDetails = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    strong {
        color: #0f172a;
        font-size: 1.1rem;
    }
`;

const RecommendedBadge = styled.span`
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: white;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 700;
    width: fit-content;
`;

const Benefits = styled.ul`
    margin: 0;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    li {
        color: #475569;
        font-size: 0.9rem;
        line-height: 1.4;
    }
`;

const InsurancePrice = styled.div`
    font-weight: 700;
    font-size: 1.25rem;
    color: #059669;
    flex-shrink: 0;
`;

const InfoBox = styled.div`
    display: flex;
    gap: 0.75rem;
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
        display: block;
        color: #1e3a8a;
        margin-bottom: 0.5rem;
    }

    p {
        margin: 0;
        color: #1e40af;
        font-size: 0.9rem;
        line-height: 1.5;
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

const SummaryItem = styled.div`
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

const ActionButtons = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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