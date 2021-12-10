import React from 'react';
import { CommandButtonProps } from './CommandButton';

import Lobby from './Lobby';

export type LobbyScreenProps = {
    lobby: Lobby
};

function LobbyScreen(
    CommandButton: React.FunctionComponent<CommandButtonProps>,
    useUsers: () => string[],
    { lobby } : LobbyScreenProps
) {
    const users = useUsers();

    function handleStartRoundButton() {
        lobby.startRound();
    }

    return (
        <div>
            <h2>JOIN CODE</h2>
            <div>{lobby.joinCode}</div>
            <h2>USERS</h2>
            <div>
                {users.map((userID) =>
                    <div key={userID}>{userID}</div>
                )}
            </div>
            { lobby.isHost ?
                <div>
                    <CommandButton onClick={handleStartRoundButton}>Start Round</CommandButton>
                </div> :
                <></>
            }
        </div>
    );
}

export default LobbyScreen;
