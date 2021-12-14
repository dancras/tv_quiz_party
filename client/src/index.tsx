import React from 'react';
import ReactDOM from 'react-dom';
import { bind, Subscribe } from '@react-rxjs/core';
import { of, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { ErrorBoundary } from 'react-error-boundary';
import './index.css';

import YouTube from 'react-youtube';

import App from './App';
import ActiveScreen from './ActiveScreen';
import WelcomeScreen from './WelcomeScreen';
import { setupActiveLobby } from './ActiveLobby';
import LobbyScreen, { LobbyScreenProps } from './LobbyScreen';
import reportWebVitals from './reportWebVitals';
import PresenterRoundScreen, { RoundScreenProps } from './PresenterRoundScreen';
import PlayerRoundScreen from './PlayerRoundScreen';
import QuestionViewer, { QuestionViewerProps } from './QuestionViewer';
import Countdown, { CountdownProps } from './Countdown';
import { Timer } from './lib/Timer';
import AnswerViewer, { AnswerViewerProps } from './AnswerViewer';
import CommandButton, { CommandButtonProps } from './CommandButton';
import { handleAppStateEvent, setupAppState } from './AppState';
import { createLobby, doHandshake, joinLobby, setupLobbyWebSocket } from './Service';
import { handleAppCmd, setupCmdBus } from './AppCmd';

const areCommandsDisabled$ = new BehaviorSubject(false);

const [state$, stateEvents$] = setupAppState(handleAppStateEvent);

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

let timeOffset = 0;
const timer: Timer = {
    now() {
        return Date.now() + timeOffset;
    }
};

doHandshake().then(handshakeData => {
    timeOffset = handshakeData.timeOffset;

    stateEvents$.next({
        code: 'USER_ID_SET',
        data: handshakeData.userID
    });

    stateEvents$.next({
        code: 'ACTIVE_LOBBY_UPDATED',
        data: handshakeData.activeLobby
    });
});

// TODO reimplement this fix with the new code
// activeLobby.value$ has a default of null so we need to wait for the
// handshake before reading from it so we can see loading/error state
// const activeLobby$ = from(handshake).pipe(
//     switchMap(() => activeLobby.value$),
// );
const [useActiveLobby] = bind(activeLobby$);

const activeLobbyUsers$ = activeLobby$.pipe(
    switchMap(lobby => lobby ? lobby.users$ : of([])),
    distinctUntilChanged()
);
const [useActiveLobbyUsers] = bind(activeLobbyUsers$, []);

const activeRound$ = activeLobby$.pipe(
    switchMap(lobby => lobby ? lobby.activeRound$ : of(null)),
    distinctUntilChanged()
);
const [useActiveRound] = bind(activeRound$, null);

const currentQuestion$ = activeRound$.pipe(
    switchMap(round => round ? round.currentQuestion$ : of(null))
);
const [useCurrentQuestion] = bind(currentQuestion$, null);

const canStartNextQuestion$ = activeRound$.pipe(
    switchMap(round => round ? round.canStartNextQuestion$ : of(false))
);
const [useCanStartNextQuestion] = bind(canStartNextQuestion$, false);

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

const ComposedAnswerViewer = (props: AnswerViewerProps) => AnswerViewer(ComposedCommandButton, window, timer, props);

const ActivePlayerRoundScreen = (props: RoundScreenProps) => PlayerRoundScreen(
    ComposedCommandButton,
    ComposedAnswerViewer,
    ComposedCountdown,
    useCurrentQuestion,
    useCanStartNextQuestion,
    props
);

const MainActiveScreen = () => ActiveScreen(
    useActiveLobby,
    useActiveRound,
    MainWelcomeScreen,
    ActiveLobbyScreen,
    ActivePresenterRoundScreen,
    ActivePlayerRoundScreen
);

const TvQuizPartyApp = () => App(ComposedCommandButton, useActiveLobby, MainActiveScreen);

ReactDOM.render(
    <React.StrictMode>
        <Subscribe fallback={<p>Loading</p>}>
            <ErrorBoundary fallback={<p>It's a wipe</p>}>
                <TvQuizPartyApp />
            </ErrorBoundary>
        </Subscribe>
    </React.StrictMode>,
    document.getElementById('root')
);

reportWebVitals(console.log);
