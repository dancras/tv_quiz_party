import { Observable } from 'rxjs';
import { ensureObservable, useObservable } from '../Lib/RxReact';
import Lobby from '../Model/Lobby';
import { LobbyScreenProps } from './LobbyScreen';
import { RoundScreenProps } from './PresenterRoundScreen';

function ActiveScreen(
    activeLobby$: Observable<Lobby | null>,
    isCommandPending$: Observable<boolean>,
    WelcomeScreen: React.FunctionComponent,
    LobbyScreen: React.FunctionComponent<LobbyScreenProps>,
    PresenterRoundScreen: React.FunctionComponent<RoundScreenProps>,
    PlayerRoundScreen: React.FunctionComponent<RoundScreenProps>,
    ProfileScreen: React.FunctionComponent
) {
    const lobby = useObservable(activeLobby$);
    const round = useObservable(ensureObservable(lobby?.activeRound$, null));
    const isCommandPending = useObservable(isCommandPending$);

    if (isCommandPending) {
        return <ProfileScreen />;
    } else if (round && lobby?.isPresenter) {
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
