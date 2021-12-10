import React from 'react';
import { CommandButtonProps } from './CommandButton';

function WelcomeScreen(
    CommandButton: React.FunctionComponent<CommandButtonProps>,
    createLobby: () => any,
    joinLobby: (joinCode: string, presenter?: boolean
) => any) {
    const [joinCode, setJoinCode] = React.useState('');

    function handleHostLobbyButton() {
        createLobby();
    }

    function handleJoinCodeChange(event: React.ChangeEvent<HTMLInputElement>) {
        setJoinCode(event.target.value);
    }

    function handleJoinLobbyButton() {
        joinLobby(joinCode);
    }

    function handlePresenterButton() {
        joinLobby(joinCode, true);
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
