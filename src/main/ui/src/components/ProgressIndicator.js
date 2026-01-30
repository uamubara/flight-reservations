import React from "react";
import styled from "styled-components";
import { Check, Clock } from "lucide-react";

export default function ProgressIndicator({ currentStep, totalSteps }) {
    const steps = [
        { number: 1, label: "Search" },
        { number: 2, label: "Select Flight" },
        { number: 3, label: "Passenger Info" },
        { number: 4, label: "Select Seats" },
        { number: 5, label: "Add-ons" },
        { number: 6, label: "Payment" },
        { number: 7, label: "Confirmation" }
    ];

    const progressPercentage = (currentStep / totalSteps) * 100;

    // Calculate time remaining (mock)
    const timeRemaining = Math.max(15 - currentStep * 2, 5);

    return (
        <Container>
            <TopRow>
                <StepInfo>
                    <strong>Step {currentStep} of {totalSteps}</strong>
                    <span className="separator">•</span>
                    <span>{steps[currentStep - 1]?.label}</span>
                </StepInfo>
                <Timer>
                    <Clock size={16} />
                    Price locked for {timeRemaining}:00 minutes
                </Timer>
            </TopRow>

            <ProgressBarContainer>
                <ProgressBarFill percentage={progressPercentage} />
            </ProgressBarContainer>

            <StepsContainer>
                {steps.map((step) => (
                    <StepItem key={step.number}>
                        <StepCircle 
                            completed={step.number < currentStep}
                            active={step.number === currentStep}
                        >
                            {step.number < currentStep ? (
                                <Check size={16} />
                            ) : (
                                step.number
                            )}
                        </StepCircle>
                        <StepLabel 
                            completed={step.number < currentStep}
                            active={step.number === currentStep}
                        >
                            {step.label}
                        </StepLabel>
                    </StepItem>
                ))}
            </StepsContainer>
        </Container>
    );
}

/* Styled Components */

const Container = styled.div`
    background: white;
    padding: 1.5rem 2rem;
    border-bottom: 2px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const TopRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
`;

const StepInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.1rem;
    color: #0f172a;
    
    strong {
        font-weight: 700;
    }
    
    .separator {
        color: #cbd5e1;
    }
    
    span:last-child {
        color: #7c3aed;
        font-weight: 600;
    }
`;

const Timer = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 0.5rem;
    color: #92400e;
    font-weight: 600;
    font-size: 0.9rem;
    
    svg {
        color: #d97706;
    }
`;

const ProgressBarContainer = styled.div`
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 1.5rem;
`;

const ProgressBarFill = styled.div`
    height: 100%;
    width: ${p => p.percentage}%;
    background: linear-gradient(90deg, #7c3aed 0%, #a855f7 100%);
    border-radius: 999px;
    transition: width 0.3s ease-out;
`;

const StepsContainer = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    
    @media (max-width: 768px) {
        overflow-x: auto;
        justify-content: flex-start;
        padding-bottom: 0.5rem;
    }
`;

const StepItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 80px;
`;

const StepCircle = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.95rem;
    transition: all 0.2s;
    
    ${p => {
        if (p.completed) {
            return `
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
            `;
        } else if (p.active) {
            return `
                background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
                color: white;
                box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);
                transform: scale(1.1);
            `;
        } else {
            return `
                background: white;
                border: 2px solid #cbd5e1;
                color: #94a3b8;
            `;
        }
    }}
`;

const StepLabel = styled.div`
    font-size: 0.8rem;
    font-weight: 600;
    text-align: center;
    white-space: nowrap;
    
    ${p => {
        if (p.completed) {
            return `
                color: #059669;
            `;
        } else if (p.active) {
            return `
                color: #7c3aed;
            `;
        } else {
            return `
                color: #94a3b8;
            `;
        }
    }}
    
    @media (max-width: 640px) {
        font-size: 0.7rem;
    }
`;
