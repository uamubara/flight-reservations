import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { X, Mail, Lock, User, Eye, EyeOff, Phone, Shield, ArrowLeft, ArrowRight, Check } from "lucide-react";

export default function LoginModal({ onClose, onLoginSuccess }) {
    const [mode, setMode] = useState("login"); // "login" or "signup"
    const [signupStep, setSignupStep] = useState(1); // 1: Account, 2: Security, 3: Verification
    const [showPassword, setShowPassword] = useState(false);
    const [verificationType, setVerificationType] = useState("phone"); // "phone" or "email"

    // Login form
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Signup form
    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPhone, setSignupPhone] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
    const [verificationCode, setVerificationCode] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!loginEmail || !loginPassword) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        onLoginSuccess(loginEmail);
    };

    const handleSignupNext = () => {
        setError("");

        if (signupStep === 1) {
            if (!signupName || !signupEmail) {
                setError("Please fill in all fields");
                return;
            }
            setSignupStep(2);
        } else if (signupStep === 2) {
            if (!signupPassword || !signupConfirmPassword) {
                setError("Please fill in all fields");
                return;
            }
            if (signupPassword !== signupConfirmPassword) {
                setError("Passwords do not match");
                return;
            }
            if (signupPassword.length < 8) {
                setError("Password must be at least 8 characters");
                return;
            }
            setSignupStep(3);
        }
    };

    const handleSignupBack = () => {
        setError("");
        if (signupStep > 1) {
            setSignupStep(signupStep - 1);
        }
    };

    const handleVerification = async (e) => {
        e.preventDefault();
        setError("");

        if (!verificationCode) {
            setError("Please enter verification code");
            return;
        }

        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        onLoginSuccess(signupEmail);
    };

    const getStepTitle = () => {
        if (mode === "login") return "Login Account";
        if (signupStep === 1) return "Create Account";
        if (signupStep === 2) return "Security";
        if (signupStep === 3) return "Verification";
    };

    const getStepDescription = () => {
        if (mode === "login") return "Login your account to access all the features";
        if (signupStep === 1) return "Enter your name and email to start creating your account for free access all the features.";
        if (signupStep === 2) return "Secure your account with a strong password to protect your information and privacy effectively.";
        if (signupStep === 3) return "We'll send you a one-time code to verify your identity and complete your registration quickly.";
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <CloseButton onClick={onClose}>
                    <X size={20} />
                </CloseButton>

                <Header>
                    <HeaderBg />
                    <HeaderContent>
                        <Title>{getStepTitle()}</Title>
                        <Description>{getStepDescription()}</Description>
                    </HeaderContent>
                </Header>

                <Content>
                    {mode === "login" && (
                        <Form onSubmit={handleLogin}>
                            <InputGroup>
                                <Label>Email Address</Label>
                                <InputWrapper>
                                    <StyledInput
                                        type="email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        placeholder="yourname@example.com"
                                    />
                                    <InputIcon>
                                        <Mail size={18} />
                                    </InputIcon>
                                </InputWrapper>
                            </InputGroup>

                            <InputGroup>
                                <Label>Password</Label>
                                <InputWrapper>
                                    <StyledInput
                                        type={showPassword ? "text" : "password"}
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder="Enter your password"
                                    />
                                    <InputIcon>
                                        <Lock size={18} />
                                    </InputIcon>
                                    <TogglePassword onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </TogglePassword>
                                </InputWrapper>
                            </InputGroup>

                            {error && <ErrorMessage>{error}</ErrorMessage>}

                            <SubmitButton type="submit" disabled={loading}>
                                {loading ? "Logging in..." : "Login Account"}
                            </SubmitButton>

                            <ForgotPassword>Forgot Password?</ForgotPassword>

                            <Divider>
                                <span>Don't Have an Account?</span>
                            </Divider>

                            <SecondaryButton type="button" onClick={() => setMode("signup")}>
                                Create Account
                            </SecondaryButton>
                        </Form>
                    )}

                    {mode === "signup" && signupStep === 1 && (
                        <Form onSubmit={(e) => { e.preventDefault(); handleSignupNext(); }}>
                            <InputGroup>
                                <Label>Full Name</Label>
                                <InputWrapper>
                                    <StyledInput
                                        type="text"
                                        value={signupName}
                                        onChange={(e) => setSignupName(e.target.value)}
                                        placeholder="John Doe"
                                    />
                                    <InputIcon>
                                        <User size={18} />
                                    </InputIcon>
                                </InputWrapper>
                            </InputGroup>

                            <InputGroup>
                                <Label>Email Address</Label>
                                <InputWrapper>
                                    <StyledInput
                                        type="email"
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                        placeholder="yourname@example.com"
                                    />
                                    <InputIcon>
                                        <Mail size={18} />
                                    </InputIcon>
                                </InputWrapper>
                            </InputGroup>

                            <InputGroup>
                                <Label>Birthday (Optional)</Label>
                                <BirthdayRow>
                                    <BirthdaySelect>
                                        <option value="">Dec</option>
                                        <option value="01">Jan</option>
                                        <option value="02">Feb</option>
                                        <option value="03">Mar</option>
                                        <option value="04">Apr</option>
                                        <option value="05">May</option>
                                        <option value="06">Jun</option>
                                        <option value="07">Jul</option>
                                        <option value="08">Aug</option>
                                        <option value="09">Sep</option>
                                        <option value="10">Oct</option>
                                        <option value="11">Nov</option>
                                        <option value="12">Dec</option>
                                    </BirthdaySelect>
                                    <BirthdaySelect>
                                        <option value="">Select</option>
                                        {Array.from({ length: 31 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        ))}
                                    </BirthdaySelect>
                                    <BirthdaySelect>
                                        <option value="">Year</option>
                                        {Array.from({ length: 100 }, (_, i) => {
                                            const year = new Date().getFullYear() - i;
                                            return <option key={year} value={year}>{year}</option>;
                                        })}
                                    </BirthdaySelect>
                                </BirthdayRow>
                            </InputGroup>

                            {error && <ErrorMessage>{error}</ErrorMessage>}

                            <SubmitButton type="submit">
                                Next <ArrowRight size={18} />
                            </SubmitButton>

                            <Divider>
                                <span>Already Have an Account?</span>
                            </Divider>

                            <SecondaryButton type="button" onClick={() => setMode("login")}>
                                Login to Account
                            </SecondaryButton>
                        </Form>
                    )}

                    {mode === "signup" && signupStep === 2 && (
                        <Form onSubmit={(e) => { e.preventDefault(); handleSignupNext(); }}>
                            <InputGroup>
                                <Label>Username</Label>
                                <InputWrapper>
                                    <StyledInput
                                        type="text"
                                        value="Username1234"
                                        readOnly
                                        style={{ background: '#f1f5f9' }}
                                    />
                                    <InputIcon>
                                        <Check size={18} color="#10b981" />
                                    </InputIcon>
                                </InputWrapper>
                            </InputGroup>

                            <InputGroup>
                                <Label>Set Password</Label>
                                <InputWrapper>
                                    <StyledInput
                                        type={showPassword ? "text" : "password"}
                                        value={signupPassword}
                                        onChange={(e) => setSignupPassword(e.target.value)}
                                        placeholder="Min. 8 characters"
                                    />
                                    <InputIcon>
                                        <Lock size={18} />
                                    </InputIcon>
                                    <TogglePassword onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </TogglePassword>
                                </InputWrapper>
                            </InputGroup>

                            <InputGroup>
                                <Label>Confirm Password</Label>
                                <InputWrapper>
                                    <StyledInput
                                        type={showPassword ? "text" : "password"}
                                        value={signupConfirmPassword}
                                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                        placeholder="Re-enter password"
                                    />
                                    <InputIcon>
                                        <Lock size={18} />
                                    </InputIcon>
                                </InputWrapper>
                            </InputGroup>

                            {error && <ErrorMessage>{error}</ErrorMessage>}

                            <ButtonRow>
                                <BackButton type="button" onClick={handleSignupBack}>
                                    <ArrowLeft size={18} /> Back
                                </BackButton>
                                <SubmitButton type="submit">
                                    Next <ArrowRight size={18} />
                                </SubmitButton>
                            </ButtonRow>
                        </Form>
                    )}

                    {mode === "signup" && signupStep === 3 && (
                        <Form onSubmit={handleVerification}>
                            <VerificationMethods>
                                <VerificationOption
                                    active={verificationType === "phone"}
                                    onClick={() => setVerificationType("phone")}
                                >
                                    <Phone size={20} />
                                    <span>Phone</span>
                                    {verificationType === "phone" && <Check size={16} />}
                                </VerificationOption>
                                <VerificationOption
                                    active={verificationType === "email"}
                                    onClick={() => setVerificationType("email")}
                                >
                                    <Mail size={20} />
                                    <span>Email</span>
                                    {verificationType === "email" && <Check size={16} />}
                                </VerificationOption>
                            </VerificationMethods>

                            <InputGroup>
                                <Label>
                                    {verificationType === "phone" ? "Phone Number" : "Email Address"}
                                </Label>
                                <InputWrapper>
                                    <StyledInput
                                        type={verificationType === "phone" ? "tel" : "email"}
                                        value={verificationType === "phone" ? signupPhone : signupEmail}
                                        onChange={(e) => verificationType === "phone"
                                            ? setSignupPhone(e.target.value)
                                            : setSignupEmail(e.target.value)
                                        }
                                        placeholder={verificationType === "phone" ? "123 456 7890" : signupEmail}
                                    />
                                    <InputIcon>
                                        {verificationType === "phone" ? <Phone size={18} /> : <Mail size={18} />}
                                    </InputIcon>
                                </InputWrapper>
                            </InputGroup>

                            <InputGroup>
                                <Label>Verification Code</Label>
                                <InputWrapper>
                                    <StyledInput
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        placeholder="Enter 6-digit code"
                                        maxLength="6"
                                    />
                                    <InputIcon>
                                        <Shield size={18} />
                                    </InputIcon>
                                </InputWrapper>
                                <HelpText>We've sent a code to verify your identity</HelpText>
                            </InputGroup>

                            {error && <ErrorMessage>{error}</ErrorMessage>}

                            <ButtonRow>
                                <BackButton type="button" onClick={handleSignupBack}>
                                    <ArrowLeft size={18} /> Back
                                </BackButton>
                                <SubmitButton type="submit" disabled={loading}>
                                    {loading ? "Verifying..." : <>Send Code <ArrowRight size={18} /></>}
                                </SubmitButton>
                            </ButtonRow>
                        </Form>
                    )}
                </Content>
            </ModalContainer>
        </Overlay>
    );
}

/* Animations */
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const slideUp = keyframes`
    from { 
        opacity: 0;
        transform: translateY(20px);
    }
    to { 
        opacity: 1;
        transform: translateY(0);
    }
`;

/* Styled Components */
const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 1rem;
    animation: ${fadeIn} 0.2s ease-out;
    backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
    background: white;
    border-radius: 1.5rem;
    width: 100%;
    max-width: 440px;
    position: relative;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: ${slideUp} 0.3s ease-out;
    overflow: hidden;
`;

const CloseButton = styled.button`
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    &:hover {
        background: white;
        transform: rotate(90deg);
    }
`;

const Header = styled.div`
    position: relative;
    padding: 3rem 2rem 2rem;
    color: white;
    overflow: hidden;
`;

const HeaderBg = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%);
    
    &::after {
        content: '';
        position: absolute;
        top: -50%;
        right: -20%;
        width: 200px;
        height: 200px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
    }
    
    &::before {
        content: '';
        position: absolute;
        bottom: -30%;
        left: -10%;
        width: 150px;
        height: 150px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 50%;
    }
`;

const HeaderContent = styled.div`
    position: relative;
    z-index: 1;
`;

const Title = styled.h2`
    margin: 0 0 0.75rem;
    font-size: 1.75rem;
    font-weight: 700;
`;

const Description = styled.p`
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
    opacity: 0.95;
`;

const Content = styled.div`
    padding: 2rem;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const Label = styled.label`
    font-weight: 600;
    color: #334155;
    font-size: 0.9rem;
`;

const InputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
`;

const StyledInput = styled.input`
    width: 100%;
    padding: 0.875rem 3rem 0.875rem 3rem;
    border: 2px solid #e2e8f0;
    border-radius: 0.75rem;
    font-size: 0.95rem;
    transition: all 0.2s;
    
    &:focus {
        outline: none;
        border-color: #0ea5e9;
        box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
    }
    
    &::placeholder {
        color: #94a3b8;
    }
`;

const InputIcon = styled.div`
    position: absolute;
    left: 1rem;
    color: #64748b;
    display: flex;
    align-items: center;
    pointer-events: none;
`;

const TogglePassword = styled.button`
    position: absolute;
    right: 1rem;
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0;
    
    &:hover {
        color: #0ea5e9;
    }
`;

const BirthdayRow = styled.div`
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr;
    gap: 0.5rem;
`;

const BirthdaySelect = styled.select`
    padding: 0.875rem 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 0.75rem;
    font-size: 0.95rem;
    transition: all 0.2s;
    background: white;
    cursor: pointer;
    
    &:focus {
        outline: none;
        border-color: #0ea5e9;
        box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
    }
`;

const VerificationMethods = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
`;

const VerificationOption = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.25rem;
    border: 2px solid ${p => p.active ? '#0ea5e9' : '#e2e8f0'};
    border-radius: 0.75rem;
    background: ${p => p.active ? '#f0f9ff' : 'white'};
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    
    &:hover {
        border-color: #0ea5e9;
        background: #f0f9ff;
    }
    
    svg:first-child {
        color: ${p => p.active ? '#0ea5e9' : '#64748b'};
    }
    
    svg:last-child {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        color: #10b981;
        background: white;
        border-radius: 50%;
    }
    
    span {
        font-weight: 600;
        color: ${p => p.active ? '#0ea5e9' : '#64748b'};
        font-size: 0.9rem;
    }
`;

const SubmitButton = styled.button`
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    
    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(14, 165, 233, 0.3);
    }
    
    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
`;

const BackButton = styled.button`
    flex: 1;
    padding: 1rem;
    background: #1e293b;
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    
    &:hover {
        background: #334155;
    }
`;

const SecondaryButton = styled.button`
    width: 100%;
    padding: 1rem;
    background: transparent;
    color: #0ea5e9;
    border: 2px solid #0ea5e9;
    border-radius: 0.75rem;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
        background: #f0f9ff;
    }
`;

const ButtonRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 0.75rem;
`;

const ErrorMessage = styled.div`
    padding: 0.875rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    color: #dc2626;
    font-size: 0.9rem;
    font-weight: 500;
`;

const ForgotPassword = styled.button`
    background: none;
    border: none;
    color: #0ea5e9;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    text-align: center;
    padding: 0;
    
    &:hover {
        text-decoration: underline;
    }
`;

const Divider = styled.div`
    display: flex;
    align-items: center;
    text-align: center;
    color: #64748b;
    font-size: 0.9rem;
    margin: 0.5rem 0;
    
    &::before,
    &::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid #e2e8f0;
    }
    
    span {
        padding: 0 1rem;
    }
`;

const HelpText = styled.span`
    font-size: 0.85rem;
    color: #64748b;
    margin-top: 0.25rem;
`;