import Lobby, { Round } from './Lobby';

function ActiveScreen(
    useActiveLobby: () => Lobby | null,
    useActiveRound: () => Round | null,
    WelcomeScreen: React.FunctionComponent,
    LobbyScreen: React.FunctionComponent,
    RoundScreen: React.FunctionComponent
) {
    const lobby = useActiveLobby();
    const round = useActiveRound();

    if (round) {
        return <RoundScreen />;
    } else if (lobby) {
        return <LobbyScreen />;
    } else {
        return <WelcomeScreen />;
    }
}

export default ActiveScreen;
