import React from 'react';
import ReactDOM from 'react-dom';
import { bind, Subscribe } from '@react-rxjs/core';
import { of, Subject, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { ErrorBoundary } from 'react-error-boundary';
import './index.css';

import YouTube from 'react-youtube';

import { post } from './lib/Request';
import App from './App';
import ActiveScreen from './ActiveScreen';
import WelcomeScreen from './WelcomeScreen';
import { setupActiveLobby } from './ActiveLobby';
import { LobbyCmd } from './Lobby';
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

const areCommandsDisabled$ = new BehaviorSubject(false);

const [state$, stateEvents$] = setupAppState(handleAppStateEvent);

state$.subscribe((state) => {
    areCommandsDisabled$.next(false);
});

type AppCmd = LobbyCmd;
const cmds$ = new Subject<AppCmd>();

cmds$.pipe(
    withLatestFrom(state$)
).subscribe(([cmd, state]) => {
    areCommandsDisabled$.next(true);

    switch (cmd.cmd) {
        case 'ExitLobby':
            if (state.activeLobby) {
                post(`/api/lobby/${state.activeLobby.id}/exit`);
            } else {
                console.error(
                    'ExitLobby command failed',
                    state.activeLobby
                );
            }
            break;

        case 'StartRound':
            if (state.activeLobby) {
                post(`/api/lobby/${state.activeLobby.id}/start_round`);
            } else {
                console.error(
                    'StartRound command failed',
                    state.activeLobby
                );
            }
            break;

        case 'StartNextQuestion':
            if (state.activeLobby && state.activeLobby.activeRound) {
                const lobbyID = state.activeLobby.id;
                const currentQuestionIndex = state.activeLobby.activeRound.currentQuestion?.i;

                post(`/api/lobby/${lobbyID}/start_question`, {
                    question_index: currentQuestionIndex !== undefined ? currentQuestionIndex + 1 : 0
                });
            } else {
                console.error(
                    'StartNextQuestion command failed',
                    state.activeLobby,
                    state.activeLobby?.activeRound
                );
            }
            break;

        case 'AnswerQuestion':
            if (state.activeLobby && state.activeLobby.activeRound && state.activeLobby.activeRound.currentQuestion) {
                post(`/api/lobby/${state.activeLobby.id}/answer_question`, {
                    question_index: state.activeLobby.activeRound.currentQuestion.i,
                    answer: cmd.data
                });
            } else {
                console.error('AnswerQuestion command failed', state.activeLobby);
            }
            break;

        case 'EndQuestion':
            if (state.activeLobby && state.activeLobby.activeRound && state.activeLobby.activeRound.currentQuestion) {
                if (state.activeLobby.isHost) {
                    post(`/api/lobby/${state.activeLobby.id}/end_question`, {
                        question_index: state.activeLobby.activeRound.currentQuestion.i,
                    });
                }

                state.activeLobby.activeRound.currentQuestion.hasEnded = true;
                stateEvents$.next({
                    code: 'CURRENT_QUESTION_UPDATED',
                    data: state.activeLobby.activeRound.currentQuestion
                });
            } else {
                console.error('AnswerQuestion command failed', state.activeLobby);
            }
            break;

        default:
            const checkExhaustive: never = cmd;
            console.error('Unhandled Command', checkExhaustive);
    }
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
