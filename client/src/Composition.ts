/* eslint react-hooks/rules-of-hooks: 0 */
import { BehaviorSubject, fromEvent } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';

import YouTube from 'react-youtube';

import App from './App';
import ActiveScreen from './Screen/ActiveScreen';
import WelcomeScreen from './Screen/WelcomeScreen';
import { setupActiveLobby } from './Model/ActiveLobby';
import LobbyScreen, { LobbyScreenProps } from './Screen/LobbyScreen';
import PresenterRoundScreen, { PresenterRoundScreenProps } from './Screen/PresenterRoundScreen';
import PlayerRoundScreen, { PlayerRoundScreenProps } from './Screen/PlayerRoundScreen';
import QuestionViewer, { QuestionViewerProps } from './Screen/QuestionViewer';
import Countdown, { CountdownProps } from './Component/Countdown';
import { Timer } from './Lib/Timer';
import AnswerViewer, { AnswerViewerProps } from './Screen/AnswerViewer';
import CommandButton, { CommandButtonProps } from './Component/CommandButton';
import { handleAppStateEvent, setupAppState } from './AppState';
import { HandshakeData, setupLobbyWebSocket } from './Service';
import { handleAppCmd, setupCmdBus } from './AppCmd';
import { setupQuestionTimer } from './Model/QuestionTimer';
import { QuestionTimingsHook, useQuestionTimings } from './Hook/QuestionTimingsHook';
import CurrentQuestion from './Model/CurrentQuestion';
import CurrentQuestionLifecycle from './Model/CurrentQuestionLifecycle';
import LeaderboardDisplay, { LeaderboardDisplayProps } from './Screen/PresenterRoundScreen/LeaderboardDisplay';
import ProfileScreen, { processProfileImage } from './Screen/ProfileScreen';
import Lobby from './Model/Lobby';
import lifecycle from 'page-lifecycle';

export function composeApp(handshakeData: HandshakeData): React.FunctionComponent {
    const areCommandsDisabled$ = new BehaviorSubject(false);

    const [state$, stateEvents$] = setupAppState(
        handshakeData.userID,
        handshakeData.activeLobby,
        handshakeData.profile,
        handleAppStateEvent
    );

    state$.subscribe((state) => {
        areCommandsDisabled$.next(false);
    });

    const cmds$ = setupCmdBus(state$, ([cmd, state]) => {
        areCommandsDisabled$.next(true);
        return handleAppCmd(stateEvents$, [cmd, state]);
    });

    const currentQuestionLifeCycle = new CurrentQuestionLifecycle(
        (question) => setupQuestionTimer(window, timer, question)
    );

    const sendCmd = cmds$.next.bind(cmds$);

    const activeLobby$ = setupActiveLobby(
        currentQuestionLifeCycle,
        sendCmd,
        state$.pipe(map(x => x.activeLobby))
    );

    let closeSocket: ((code: number) => void) | undefined;

    activeLobby$.subscribe(activeLobby => {
        if (closeSocket) closeSocket(1000);
        if (activeLobby) {
            setupActiveLobbyWebSocket(activeLobby);
        }
    });

    const lifecycleStateChanges$ = fromEvent(lifecycle, 'statechange');
    lifecycleStateChanges$.pipe(withLatestFrom(activeLobby$)).subscribe(([event, activeLobby]) => {
        if (
            activeLobby &&
            ['active', 'passive'].includes(event.newState) &&
            event.oldState === 'hidden'
        ) {
            setupActiveLobbyWebSocket(activeLobby);
            sendCmd({ cmd: 'SyncStateWithServer' });
        }
    });

    function setupActiveLobbyWebSocket(activeLobby: Lobby) {
        const socket = setupLobbyWebSocket(stateEvents$, activeLobby.id);
        closeSocket = socket.close.bind(socket);
    }

    const isCommandPending$ = state$.pipe(map(x => x.pendingCommand !== null));

    const timer: Timer = {
        now() {
            return Date.now() + handshakeData.timeOffset;
        }
    };

    const ComposedCommandButton = (props: CommandButtonProps) => CommandButton(areCommandsDisabled$, props);

    const MainWelcomeScreen = () => WelcomeScreen(
        ComposedCommandButton,
        sendCmd
    );

    const ActiveLobbyScreen = (props: LobbyScreenProps) => LobbyScreen(ComposedCommandButton, props);

    const composedUseQuestionTimings: QuestionTimingsHook<CurrentQuestion | undefined> = (question) => useQuestionTimings(
        (question) => setupQuestionTimer(window, timer, question),
        question
    );

    const ComposedCountdown = (props: CountdownProps) => Countdown(window, timer, props);

    const ComposedLeaderboardDisplay = (props: LeaderboardDisplayProps) => LeaderboardDisplay(composedUseQuestionTimings, props);
    const ComposedQuestionViewer = (props: QuestionViewerProps) => QuestionViewer(ComposedCountdown, YouTube, composedUseQuestionTimings, timer, props);

    const ActivePresenterRoundScreen = (props: PresenterRoundScreenProps) => PresenterRoundScreen(
        ComposedLeaderboardDisplay,
        ComposedQuestionViewer,
        props
    );

    const ComposedAnswerViewer = (props: AnswerViewerProps) => AnswerViewer(ComposedCommandButton, composedUseQuestionTimings, props);

    const ActivePlayerRoundScreen = (props: PlayerRoundScreenProps) => PlayerRoundScreen(
        ComposedCommandButton,
        ComposedAnswerViewer,
        ComposedCountdown,
        composedUseQuestionTimings,
        props
    );

    const ComposedProfileScreen = () => ProfileScreen(ComposedCommandButton, processProfileImage, sendCmd);

    const MainActiveScreen = () => ActiveScreen(
        activeLobby$,
        isCommandPending$,
        MainWelcomeScreen,
        ActiveLobbyScreen,
        ActivePresenterRoundScreen,
        ActivePlayerRoundScreen,
        ComposedProfileScreen
    );

    return () => App(ComposedCommandButton, activeLobby$, MainActiveScreen);
}
