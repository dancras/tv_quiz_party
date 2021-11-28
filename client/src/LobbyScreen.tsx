export type Lobby = {
    joinCode: string,
    users: string[]
};

function LobbyScreen(useLobby: () => Lobby) {
    const lobby = useLobby();
    return (<div>
        <div>{lobby.joinCode}</div>
        {lobby.users.map((userID) =>
            <div>{userID}</div>
        )}
    </div>);
}

export default LobbyScreen;
