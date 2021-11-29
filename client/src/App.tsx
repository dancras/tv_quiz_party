import React from 'react';
import { Subscribe } from '@react-rxjs/core'
import { ErrorBoundary } from 'react-error-boundary'
import logo from './logo.svg';
import './App.css';
import {Lobby, LobbyScreenProps} from './LobbyScreen';

function ParagraphComponent(useText: () => any) {
    const text = useText();
    return (
        <p>{text}</p>
    );
}

function App(
    useActiveLobby: () => Lobby | null,
    WelcomeScreen: React.FunctionComponent,
    LobbyScreen: React.FunctionComponent<LobbyScreenProps>
) {
    const lobby = useActiveLobby();
    const UserIdComponent = ParagraphComponent.bind(null, () => 'abc');

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                {lobby ?
                    <LobbyScreen lobby={lobby} /> :
                    <WelcomeScreen />
                }
                <Subscribe fallback={<p>Loading</p>}>
                    <ErrorBoundary fallback={<p>It's a wipe</p>}>
                        <UserIdComponent />
                    </ErrorBoundary>
                </Subscribe>
                <a className="App-link"
                   href="https://reactjs.org"
                   target="_blank"
                   rel="noopener noreferrer"
                >
                    Learn React
                </a>
            </header>
        </div>
    );
}

export default App;
