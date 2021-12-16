/* eslint react-hooks/rules-of-hooks: 0 */
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import YouTube from 'react-youtube';

import App from './App';
import ActiveScreen from './Screen/ActiveScreen';
import WelcomeScreen from './Screen/WelcomeScreen';
import { setupActiveLobby } from './Model/ActiveLobby';
import LobbyScreen, { LobbyScreenProps } from './Screen/LobbyScreen';
import PresenterRoundScreen, { RoundScreenProps } from './Screen/PresenterRoundScreen';
import PlayerRoundScreen from './Screen/PlayerRoundScreen';
import QuestionViewer, { QuestionViewerProps } from './Screen/QuestionViewer';
import Countdown, { CountdownProps } from './Component/Countdown';
import { Timer } from './Lib/Timer';
import AnswerViewer, { AnswerViewerProps } from './Screen/AnswerViewer';
import CommandButton, { CommandButtonProps } from './Component/CommandButton';
import { handleAppStateEvent, setupAppState } from './AppState';
import { createLobby, HandshakeData, joinLobby, setupLobbyWebSocket } from './Service';
import { handleAppCmd, setupCmdBus } from './AppCmd';
import { setupQuestionTimer } from './Model/QuestionTimer';
import { QuestionTimingsHook, useQuestionTimings } from './Hook/QuestionTimingsHook';
import { CurrentQuestion } from './Model/Round';

export function composeApp(handshakeData: HandshakeData): React.FunctionComponent {
    const areCommandsDisabled$ = new BehaviorSubject(false);

    const [state$, stateEvents$] = setupAppState(
        handshakeData.userID,
        handshakeData.activeLobby,
        handleAppStateEvent
    );

    state$.subscribe((state) => {
        areCommandsDisabled$.next(false);
    });

    const cmds$ = setupCmdBus(state$, ([cmd, state]) => {
        areCommandsDisabled$.next(true);
        handleAppCmd(stateEvents$, [cmd, state]);
    });

    const activeLobby$ = setupActiveLobby(
        cmds$.next.bind(cmds$),
        state$.pipe(map(x => x.activeLobby))
    );

    let closeSocket: (() => void) | undefined;

    activeLobby$.subscribe(activeLobby => {
        if (closeSocket) closeSocket();
        if (activeLobby) {
            const socket = setupLobbyWebSocket(stateEvents$, activeLobby.id);
            closeSocket = socket.close.bind(socket);
        }
    });

    const timer: Timer = {
        now() {
            return Date.now() + handshakeData.timeOffset;
        }
    };

    const ComposedCommandButton = (props: CommandButtonProps) => CommandButton(areCommandsDisabled$, props);

    function disableCommandsDuring<T extends unknown[]>(innerFn: (...args: T) => Promise<any>): (...args: T) => void {
        return (...args) => {
            areCommandsDisabled$.next(true);
            innerFn(...args)
                .catch(() => areCommandsDisabled$.next(false));
        };
    }

    const MainWelcomeScreen = () => WelcomeScreen(
        ComposedCommandButton,
        disableCommandsDuring(() => createLobby(stateEvents$)),
        disableCommandsDuring((joinCode: string, presenter?: boolean) => joinLobby(stateEvents$, joinCode, presenter))
    );

    const ActiveLobbyScreen = (props: LobbyScreenProps) => LobbyScreen(ComposedCommandButton, props);

    const composedUseQuestionTimings: QuestionTimingsHook<CurrentQuestion | undefined> = (question) => useQuestionTimings(
        (question) => setupQuestionTimer(window, timer, question),
        question
    );

    const ComposedCountdown = (props: CountdownProps) => Countdown(window, timer, props);

    const ComposedQuestionViewer = (props: QuestionViewerProps) => QuestionViewer(ComposedCountdown, YouTube, composedUseQuestionTimings, timer, props);

    const ActivePresenterRoundScreen = (props: RoundScreenProps) => PresenterRoundScreen(
        ComposedQuestionViewer,
        props
    );

    const ComposedAnswerViewer = (props: AnswerViewerProps) => AnswerViewer(ComposedCommandButton, composedUseQuestionTimings, props);

    const ActivePlayerRoundScreen = (props: RoundScreenProps) => PlayerRoundScreen(
        ComposedCommandButton,
        ComposedAnswerViewer,
        ComposedCountdown,
        composedUseQuestionTimings,
        props
    );

    const MainActiveScreen = () => ActiveScreen(
        activeLobby$,
        MainWelcomeScreen,
        ActiveLobbyScreen,
        ActivePresenterRoundScreen,
        ActivePlayerRoundScreen
    );

    return () => App(ComposedCommandButton, activeLobby$, MainActiveScreen);
}
