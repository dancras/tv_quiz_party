import React from 'react';
import { bind } from '@react-rxjs/core';

import Lobby from './Lobby';

export type LobbyScreenProps = {
    lobby: Lobby
};

function UsersList(
    { useUsers } : { useUsers: () => string[] }
) {
    const users = useUsers();

    return (
        <div>
            {users.map((userID) =>
                <div key={userID}>{userID}</div>
            )}
        </div>
    );
}

function LobbyScreen(
    { lobby } : LobbyScreenProps
) {
    const [useUsers] = bind(lobby.users$, []);

    const [disable, setDisable] = React.useState(false);

    function handleExitLobbyButton() {
        lobby.exit();
        setDisable(true);
    }

    function handleStartRoundButton() {
        lobby.startRound();
        setDisable(true);
    }

    return (
        <div>
            <div>{lobby.joinCode}</div>
            <UsersList useUsers={useUsers} />
            <div>
                <button disabled={disable} onClick={handleExitLobbyButton}>Exit Lobby</button>
            </div>
            <div>
                <button disabled={disable} onClick={handleStartRoundButton}>Start Round</button>
            </div>
        </div>
    );
}

export default LobbyScreen;
