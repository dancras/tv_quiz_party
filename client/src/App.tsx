import React from 'react';
import logo from './logo.svg';
import './App.css';
import Lobby from './Model/Lobby';
import { CommandButtonProps } from './Component/CommandButton';
import { Observable } from 'rxjs';
import { useObservable } from './Lib/RxReact';

function App(
    CommandButton: React.FunctionComponent<CommandButtonProps>,
    activeLobby$: Observable<Lobby | null>,
    ActiveScreen: React.FunctionComponent
) {
    const lobby = useObservable(activeLobby$);

    function handleExitLobbyButton() {
        (lobby as Lobby).exit();
    }

    return (
        <div className="App">
            <header className="App-header"><img src={logo} className="App-logo" alt="logo" /></header>
            <main className="App-main">
                <ActiveScreen />
            </main>
            <footer>
                { lobby ?
                    <div>
                        <CommandButton onClick={handleExitLobbyButton}>Exit Lobby</CommandButton>
                    </div> :
                    <></>
                }
            </footer>
        </div>
    );
}

export default App;
