import React from 'react';

export type LobbyScreenProps = {
    joinCode: string,
    useUsers: () => string[]
};

function LobbyScreen({ joinCode, useUsers } : LobbyScreenProps) {
    const users = useUsers();

    return (
        <div>
            <div>{joinCode}</div>
            {users.map((userID) =>
                <div key={userID}>{userID}</div>
            )}
        </div>
    );
}

export default LobbyScreen;
