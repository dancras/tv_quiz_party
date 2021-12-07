import React from 'react';

function WelcomeScreen(createLobby: () => any, joinLobby: (joinCode: string, presenter?: boolean) => any) {
    const [disable, setDisable] = React.useState(false);
    const [joinCode, setJoinCode] = React.useState('');

    function handleHostLobbyButton() {
        createLobby();
        setDisable(true);
    }

    function handleJoinCodeChange(event: React.ChangeEvent<HTMLInputElement>) {
        setJoinCode(event.target.value);
    }

    function handleJoinLobbyButton() {
        joinLobby(joinCode);
        setDisable(true);
    }

    function handlePresenterButton() {
        joinLobby(joinCode, true);
        setDisable(true);
    }

    return (
        <div>
            <div>
                <button disabled={disable} onClick={handleHostLobbyButton}>Host Lobby</button>
            </div>
            <div>
                <label>Join Code <input type="text" onChange={handleJoinCodeChange} /></label>
                <button disabled={disable} onClick={handleJoinLobbyButton}>Join Lobby</button>
                <button disabled={disable} onClick={handlePresenterButton}>Presenter</button>
            </div>
        </div>
    );
}

export default WelcomeScreen;
