import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import App from './App';
import './index.css'; // import CSS file

const history = createBrowserHistory();

ReactDOM.render(
    <React.StrictMode>
        <Router history={history}>
            <App />
        </Router>
    </React.StrictMode>,
    document.getElementById('root')
);