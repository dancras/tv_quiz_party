import React from 'react';
import { bind } from '@react-rxjs/core';
import logo from './logo.svg';
import './App.css';
import Lobby from './Lobby';
import { LobbyScreenProps } from './LobbyScreen';

function App(
    useActiveLobby: () => Lobby | null,
    WelcomeScreen: React.FunctionComponent,
    LobbyScreen: React.FunctionComponent<LobbyScreenProps>
) {
    const lobby = useActiveLobby();

    function bindLobbyUsers(lobby: Lobby) {
        const [useUsers] = bind(lobby.users$, []);
        return useUsers;
    }

    return (
        <div className="App">
            <header className="App-header"><img src={logo} className="App-logo" alt="logo" /></header>
            <main className="App-main">
                {lobby ?
                    <LobbyScreen joinCode={lobby.joinCode} useUsers={bindLobbyUsers(lobby)} /> :
                    <WelcomeScreen />
                }
            </main>
        </div>
    );
}

export default App;
