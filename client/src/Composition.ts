import { bind } from '@react-rxjs/core';
import { of, BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

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
import { QuestionTimings, setupQuestionTimer } from './Model/QuestionTimer';

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

    const [useActiveLobby] = bind(activeLobby$, null);

    const activeLobbyUsers$ = activeLobby$.pipe(
        switchMap(lobby => lobby ? lobby.users$ : of([])),
        distinctUntilChanged()
    );
    const [useActiveLobbyUsers] = bind(activeLobbyUsers$, []);

    const activeRound$ = activeLobby$.pipe(
        switchMap(lobby => lobby ? lobby.activeRound$ : of(null)),
        distinctUntilChanged()
    );

    const currentQuestion$ = activeRound$.pipe(
        switchMap(round => round ? round.currentQuestion$ : of(null))
    );
    const [useCurrentQuestion] = bind(currentQuestion$, null);

    const currentQuestionTimings$: Observable<QuestionTimings> = currentQuestion$.pipe(
        switchMap(question => question ?
            setupQuestionTimer(window, timer, question) :
            of({
                hasStarted: true,
                displayAnswers: true,
                lockAnswers: true,
                revealAnswer: true,
                hasEnded: true
            })
        )
    );

    const [useAreCommandsDisabled] = bind(areCommandsDisabled$, false);

    const ComposedCommandButton = (props: CommandButtonProps) => CommandButton(useAreCommandsDisabled, props);

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

    const ActiveLobbyScreen = (props: LobbyScreenProps) => LobbyScreen(ComposedCommandButton, useActiveLobbyUsers, props);

    const ComposedCountdown = (props: CountdownProps) => Countdown(window, timer, props);

    const ComposedQuestionViewer = (props: QuestionViewerProps) => QuestionViewer(ComposedCountdown, YouTube, window, timer, props);

    const ActivePresenterRoundScreen = (props: RoundScreenProps) => PresenterRoundScreen(
        ComposedQuestionViewer,
        useCurrentQuestion,
        props
    );

    const ComposedAnswerViewer = (props: AnswerViewerProps) => AnswerViewer(ComposedCommandButton, currentQuestionTimings$, props);

    const ActivePlayerRoundScreen = (props: RoundScreenProps) => PlayerRoundScreen(
        ComposedCommandButton,
        ComposedAnswerViewer,
        ComposedCountdown,
        currentQuestionTimings$,
        props
    );

    const MainActiveScreen = () => ActiveScreen(
        activeLobby$,
        MainWelcomeScreen,
        ActiveLobbyScreen,
        ActivePresenterRoundScreen,
        ActivePlayerRoundScreen
    );

    return () => App(ComposedCommandButton, useActiveLobby, MainActiveScreen);
}
