import React from 'react';
import logo from './logo.svg';
import './App.css';
import Lobby from './Lobby';

function App(
    useActiveLobby: () => Lobby | null,
    ActiveScreen: React.FunctionComponent
) {
    const lobby = useActiveLobby();
    const [disable, setDisable] = React.useState(false);

    function handleExitLobbyButton() {
        (lobby as Lobby).exit();
        setDisable(true);
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
                        <button disabled={disable} onClick={handleExitLobbyButton}>Exit Lobby</button>
                    </div> :
                    <></>
                }
            </footer>
        </div>
    );
}

export default App;
