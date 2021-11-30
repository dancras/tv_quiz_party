import React from 'react';

export type LobbyScreenProps = {
    joinCode: string,
    useUsers: () => string[]
};

function LobbyScreen(exitLobby: () => void, { joinCode, useUsers } : LobbyScreenProps) {
    const users = useUsers();
    const [disable, setDisable] = React.useState(false);

    function handleExitLobbyButton() {
        exitLobby();
        setDisable(true);
    }

    return (
        <div>
            <div>{joinCode}</div>
            {users.map((userID) =>
                <div key={userID}>{userID}</div>
            )}
            <div>
                <button disabled={disable} onClick={handleExitLobbyButton}>Exit Lobby</button>
            </div>
        </div>
    );
}

export default LobbyScreen;
