import React from 'react';
import { CommandButtonProps } from '../Component/CommandButton';
import { useObservable } from '../Lib/RxReact';

import Lobby from '../Model/Lobby';
import { Profile } from '../Model/Profile';

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

    function getProfileImageSrc(profile: Profile): string {
        return '/api/profile_images/' + profile.imageFilename;
    }

    return (
        <div>
            <h2>JOIN CODE</h2>
            <div>{lobby.joinCode}</div>
            <h2>USERS</h2>
            <div>
                {Object.values(users).map(profile =>
                    <div key={profile.userID}>
                        <span>{profile.displayName}</span><img className="profile-img" src={getProfileImageSrc(profile)} alt={profile.displayName} />
                    </div>
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
