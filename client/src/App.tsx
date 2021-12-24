import React from 'react';
import './App.css';
import Lobby from './Model/Lobby';
import { CommandButtonProps } from './Component/CommandButton';
import { Observable } from 'rxjs';
import { useObservable } from './Lib/RxReact';
import { Icon, Menu } from 'semantic-ui-react';

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
            { lobby ?
                <Menu attached='top'>
                    <Menu.Item>
                        <CommandButton icon onClick={handleExitLobbyButton}><Icon name="close" /></CommandButton>
                    </Menu.Item>
                </Menu> :
                <></>
            }
            <main className="App-main">
                <ActiveScreen />
            </main>

        </div>
    );
}

export default App;
