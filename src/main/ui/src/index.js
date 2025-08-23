import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import App from './App';                    // landing page
import Booking from './components/Booking'; // booking page component
import './index.css';

ReactDOM.render(
    <React.StrictMode>
        <Router>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/book" element={<Booking />} />
            </Routes>
        </Router>
    </React.StrictMode>,
    document.getElementById('root')
);
