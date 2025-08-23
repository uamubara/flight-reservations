import React, { useMemo, useState } from "react";
import styled from "styled-components";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Locate from "../components/Locate";
import FlightSelect from "../components/FlightSelect";

export default function Booking() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const onSearch = async (payload) => {
        setLoading(true);
        setResults([]);
        try {
            const base =
                (process.env.REACT_APP_API_BASE || "http://localhost:8081").replace(/\/$/, "");
            const qs = new URLSearchParams({
                origin: payload.origin,
                destination: payload.destination,
                departDate: payload.departDate,
                adults: String(payload.adults || 1),
                ...(payload.returnDate ? { returnDate: payload.returnDate } : {}),
                maxResults: "6",
            });
            const r = await fetch(`${base}/api/flights?${qs.toString()}`);
            if (!r.ok) throw new Error(`API ${r.status}`);
            const json = await r.json();
            setResults(Array.isArray(json) ? json : []);
        } catch (e) {
            console.error(e);
            alert("Failed to search flights. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const hasResults = useMemo(() => results && results.length > 0, [results]);

    return (
        <>
            <Navbar bookingNav />
            {/* page wrapper ensures Partners sits just above Footer */}
            <Page>
                <Header>
                    <div className="wrap">
                        <div className="title">
                            <h1>Book your Flight</h1>
                            <p>Fast, simple, and secure — find the best fares.</p>
                        </div>
                        <HeroBadge>
                            <div className="cta">✈︎ Ready to take off?</div>
                        </HeroBadge>
                    </div>
                </Header>

                <Main>
                    <LeftCol>
                        <Card>
                            <h3>Search flights</h3>
                            <Locate onSearch={onSearch} />
                        </Card>

                        <ResultsHeader hidden={!loading && !hasResults}>
                            <div className="pill">Flights</div>
                            <div className="sort">
                                <label>Sort by</label>
                                <select disabled>
                                    <option>Price</option>
                                </select>
                            </div>
                        </ResultsHeader>

                        {loading && <Skeleton>Searching flights…</Skeleton>}
                        <FlightSelect hidden={!hasResults} results={results} />
                        {!loading && !hasResults && (
                            <Hint>Enter your route & dates to see matching flights here.</Hint>
                        )}
                    </LeftCol>

                    <RightCol>
                        <Widget>
                            <h4>Why Fly Away?</h4>
                            <ul>
                                <li>Partnered with major airlines</li>
                                <li>Transparent pricing</li>
                                <li>Secure checkout</li>
                                <li>24/7 customer support</li>
                            </ul>
                        </Widget>
                    </RightCol>
                </Main>

                {/* Partner airlines section */}
                <Partners aria-label="Airline partners">
                    <div className="inner">
                        <h4>Our Airline Partners</h4>
                        <div className="logos">
                            <span className="logo">Emirates</span>
                            <span className="logo">Delta</span>
                            <span className="logo">United</span>
                            <span className="logo">American</span>
                            <span className="logo">JetBlue</span>
                            <span className="logo">Qatar</span>
                            <span className="logo">Lufthansa</span>
                        </div>
                    </div>
                </Partners>
            </Page>

            <Footer />
        </>
    );
}

/* ===== styles ===== */

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Header = styled.header`
  background: linear-gradient(135deg, #0ea5e9 0%, #0b7285 100%);
  color: #fff;
  padding: 2.75rem 1rem 1.75rem;
  .wrap {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1rem;
  }
  h1 { margin: 0 0 .35rem; font-size: 2rem; }
  p { margin: 0; opacity: .95; }
  @media (max-width: 900px) { .wrap { grid-template-columns: 1fr; } }
`;

const HeroBadge = styled.div`
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 1rem; min-height: 120px;
  display: grid; place-items: center;
  .cta { font-weight: 700; letter-spacing: .3px; }
`;

const Main = styled.main`
  max-width: 1100px; margin: -1.4rem auto 2rem; padding: 0 1rem;
  display: grid; grid-template-columns: 2fr 1fr; gap: 1.25rem;
  width: 100%;
  @media (max-width: 900px) { grid-template-columns: 1fr; margin-top: -1rem; }
`;

const Card = styled.section`
  background: #fff; border-radius: 1rem;
  box-shadow: 0 12px 28px rgba(2,62,138,.08);
  padding: 1.2rem 1.2rem 1.4rem;
  h3 { margin: 0 0 .75rem; }
`;

const LeftCol = styled.div``;

const ResultsHeader = styled.div`
  display: ${({ hidden }) => (hidden ? "none" : "flex")};
  align-items:center; justify-content:space-between; margin:1rem 0 .75rem;
  .pill { background:#e6f7ff; color:#0b7285; font-weight:700; padding:.35rem .7rem; border-radius:999px; }
  .sort { display:flex; gap:.5rem; align-items:center; }
  .sort label { color:#0b7285; font-weight:600; }
  .sort select { border:1px solid #e7eef6; border-radius:.65rem; padding:.45rem .65rem; background:#fff; }
`;

const RightCol = styled.aside`display:grid; gap:1.25rem;`;

const Widget = styled.div`
  background:#fff; border-radius:1rem; box-shadow:0 12px 28px rgba(2,62,138,.08); padding:1.2rem;
  h4{margin:0 0 .75rem;} ul{margin:0; padding-left:1rem; line-height:1.9;}
`;

const Skeleton = styled.div`
  background:#f8fbff; border:1px dashed #cfe8ff; color:#0b7285;
  border-radius:.9rem; padding:1rem; margin:.75rem 0 0;
`;

const Hint = styled.div`opacity:.7; padding:1rem .25rem 0;`;

/* Partner section: responsive, sits above footer */
const Partners = styled.section`
  background:#f7fbff;
  border-top:1px solid #e9f2fb;
  padding: clamp(1.25rem, 2.5vw, 2rem) 1rem;
  margin-top: auto; /* pushes this section to the bottom if content is short */

  .inner { max-width: 1100px; margin: 0 auto; }
  h4 { margin: 0 0 1rem; color:#023e8a; }

  /* Responsive grid of logos */
  .logos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: .75rem;
  }

  .logo {
    display:flex; align-items:center; justify-content:center;
    background:#fff; border:1px solid #e7eef6; border-radius:.75rem;
    padding:.6rem 1rem; min-height:48px;
    font-weight:700; color:#0b7285;
    box-shadow:0 4px 12px rgba(2,62,138,.06);
    text-align:center;
    white-space:nowrap;
  }

  @media (max-width: 480px) {
    .logo { font-size: .95rem; padding: .55rem .8rem; min-height: 44px; }
  }
`;
