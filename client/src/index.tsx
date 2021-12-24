import 'semantic-ui-css/semantic.min.css';
import React from 'react';
import ReactDOM from 'react-dom';
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
