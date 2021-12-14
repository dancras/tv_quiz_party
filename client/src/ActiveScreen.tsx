import Lobby from './Model/Lobby';
import Round from './Model/Round';
import { LobbyScreenProps } from './LobbyScreen';
import { RoundScreenProps } from './PresenterRoundScreen';

function ActiveScreen(
    useActiveLobby: () => Lobby | null,
    useActiveRound: () => Round | null,
    WelcomeScreen: React.FunctionComponent,
    LobbyScreen: React.FunctionComponent<LobbyScreenProps>,
    PresenterRoundScreen: React.FunctionComponent<RoundScreenProps>,
    PlayerRoundScreen: React.FunctionComponent<RoundScreenProps>
) {
    const lobby = useActiveLobby();
    const round = useActiveRound();

    if (round && lobby?.isPresenter) {
        return <PresenterRoundScreen round={round} />;
    } else if (round && !lobby?.isPresenter) {
        return <PlayerRoundScreen round={round} />;
    } else if (lobby) {
        return <LobbyScreen lobby={lobby} />;
    } else {
        return <WelcomeScreen />;
    }
}

export default ActiveScreen;
