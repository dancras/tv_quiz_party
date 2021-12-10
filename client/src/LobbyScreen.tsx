import React from 'react';

import Lobby from './Lobby';

export type LobbyScreenProps = {
    lobby: Lobby
};

function LobbyScreen(
    useUsers: () => string[],
    { lobby } : LobbyScreenProps
) {
    const users = useUsers();

    const [disable, setDisable] = React.useState(false);

    function handleStartRoundButton() {
        lobby.startRound();
        setDisable(true);
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
                    <button disabled={disable} onClick={handleStartRoundButton}>Start Round</button>
                </div> :
                <></>
            }
        </div>
    );
}

export default LobbyScreen;
