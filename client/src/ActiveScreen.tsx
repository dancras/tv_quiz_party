import Lobby from './Lobby';
import Round from './Round';
import { LobbyScreenProps } from './LobbyScreen';
import { RoundScreenProps } from './RoundScreen';

function ActiveScreen(
    useActiveLobby: () => Lobby | null,
    useActiveRound: () => Round | null,
    WelcomeScreen: React.FunctionComponent,
    LobbyScreen: React.FunctionComponent<LobbyScreenProps>,
    RoundScreen: React.FunctionComponent<RoundScreenProps>
) {
    const lobby = useActiveLobby();
    const round = useActiveRound();

    if (round) {
        return <RoundScreen round={round} />;
    } else if (lobby) {
        return <LobbyScreen lobby={lobby} />;
    } else {
        return <WelcomeScreen />;
    }
}

export default ActiveScreen;
