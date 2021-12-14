import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';

import { doHandshake } from './Service';
import { composeApp } from './Composition';

doHandshake().then(handshakeData => {
    const TvQuizPartyApp = composeApp(handshakeData);

    ReactDOM.render(
        <React.StrictMode>
            <TvQuizPartyApp />
        </React.StrictMode>,
        document.getElementById('root')
    );
});

reportWebVitals(console.log);
