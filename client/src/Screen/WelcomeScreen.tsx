import React from 'react';
import { CommandButtonProps } from '../Component/CommandButton';
import { LobbyCmd } from '../Model/Lobby';

function WelcomeScreen(
    CommandButton: React.FunctionComponent<CommandButtonProps>,
    sendCmd: (cmd: LobbyCmd) => void
) {
    const [joinCode, setJoinCode] = React.useState('');

    function handleHostLobbyButton() {
        sendCmd({
            cmd: 'CreateLobby'
        });
    }

    function handleJoinCodeChange(event: React.ChangeEvent<HTMLInputElement>) {
        setJoinCode(event.target.value);
    }

    function handleJoinLobbyButton() {
        sendCmd({
            cmd: 'JoinLobby',
            joinCode: joinCode,
            isPresenter: false
        });
    }

    function handlePresenterButton() {
        sendCmd({
            cmd: 'JoinLobby',
            joinCode: joinCode,
            isPresenter: true
        });
    }

    return (
        <div>
            <div>
                <CommandButton onClick={handleHostLobbyButton}>Host Lobby</CommandButton>
            </div>
            <div>
                <label>Join Code <input type="text" onChange={handleJoinCodeChange} /></label>
                <CommandButton onClick={handleJoinLobbyButton}>Join Lobby</CommandButton>
                <CommandButton onClick={handlePresenterButton}>Presenter</CommandButton>
            </div>
        </div>
    );
}

export default WelcomeScreen;
