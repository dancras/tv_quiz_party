import React from 'react';

export type Lobby = {
    joinCode: string,
    users: string[]
};

export type LobbyScreenProps = { lobby: Lobby };

function LobbyScreen({lobby} : LobbyScreenProps) {
    return (
        <div>
            <div>{lobby.joinCode}</div>
            {lobby.users.map((userID) =>
                <div key={userID}>{userID}</div>
            )}
        </div>
    );
}

export default LobbyScreen;
