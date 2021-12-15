import React from 'react';
import { CommandButtonProps } from '../Component/CommandButton';
import { useObservable } from '../Lib/RxReact';

import Lobby from '../Model/Lobby';

export type LobbyScreenProps = {
    lobby: Lobby
};

function LobbyScreen(
    CommandButton: React.FunctionComponent<CommandButtonProps>,
    { lobby } : LobbyScreenProps
) {
    const users = useObservable(lobby.users$);

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
