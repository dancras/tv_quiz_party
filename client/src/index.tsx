import React from 'react';
import ReactDOM from 'react-dom';
import { bind, Subscribe } from '@react-rxjs/core';
import { of, Subject, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { ErrorBoundary } from 'react-error-boundary';
import './index.css';

import YouTube from 'react-youtube';

import App from './App';
import ActiveScreen from './ActiveScreen';
import WelcomeScreen from './WelcomeScreen';
import { setupActiveLobby } from './ActiveLobby';
import { PlainLobby, LobbyCmd } from './Lobby';
import { PlainCurrentQuestionMetadata, PlainRound, Question } from './Round';
import LobbyScreen, { LobbyScreenProps } from './LobbyScreen';
import reportWebVitals from './reportWebVitals';
import PresenterRoundScreen, { RoundScreenProps } from './PresenterRoundScreen';
import PlayerRoundScreen from './PlayerRoundScreen';
import QuestionViewer, { QuestionViewerProps } from './QuestionViewer';
import Countdown, { CountdownProps } from './Countdown';
import { Timer } from './lib/Timer';
import AnswerViewer, { AnswerViewerProps } from './AnswerViewer';
import CommandButton, { CommandButtonProps } from './CommandButton';

function setupLobbyWebSocket(id: string) {
    const url = new URL(`/api/lobby/${id}/ws`, window.location.href);
    url.protocol = url.protocol.replace('http', 'ws');

    const socket = new WebSocket(url.href);

    socket.addEventListener('open', (event) => {
        console.debug('Socket is open', event);
    });

    socket.addEventListener('message', (event) => {
        console.debug('Socket message', event);
        const message = JSON.parse(event.data) as ServerMessage;

        switch (message.code) {
            case 'USER_JOINED':
            case 'USER_EXITED':
                stateEvents$.next({
                    code: 'ACTIVE_LOBBY_UPDATED',
                    data: createLobbyFromLobbyData(message.data.lobby)
                });
                break;
            case 'LOBBY_CLOSED':
                stateEvents$.next({
                    code: 'ACTIVE_LOBBY_UPDATED',
                    data: null
                });
                break;
            case 'ROUND_STARTED':
                stateEvents$.next({
                    code: 'ACTIVE_ROUND_UPDATED',
                    data: createRoundFromRoundData(message.data)
                });
                break;
            case 'QUESTION_STARTED':
                stateEvents$.next({
                    code: 'CURRENT_QUESTION_UPDATED',
                    data: createPlainCurrentQuestionMetadata(message.data)
                });
                break;
        }
    });

    return socket;
}

type ServerMessage =
    { code: 'USER_JOINED', data: any } |
    { code: 'USER_EXITED', data: any } |
    { code: 'LOBBY_CLOSED', data: null } |
    { code: 'ROUND_STARTED', data: any } |
    { code: 'QUESTION_STARTED', data: any };

type AppState = {
    userID: string,
    activeLobby: PlainLobby | null
};
type AppStateEvent =
    { code: 'USER_ID_SET', data: string } |
    { code: 'ACTIVE_LOBBY_UPDATED', data: PlainLobby | null } |
    { code: 'ACTIVE_ROUND_UPDATED', data: PlainRound } |
    { code: 'CURRENT_QUESTION_UPDATED', data: PlainCurrentQuestionMetadata };

const areCommandsDisabled$ = new BehaviorSubject(false);

const stateEvents$ = new Subject<AppStateEvent>();
const state$ = new BehaviorSubject<AppState>({
    userID: '',
    activeLobby: null
});

stateEvents$.pipe(
    withLatestFrom(state$),
    map(([stateEvent, state]) => {
        switch (stateEvent.code) {
            case 'USER_ID_SET':
                state.userID = stateEvent.data;
                return state;
            case 'ACTIVE_LOBBY_UPDATED':
                state.activeLobby = stateEvent.data;

                if (state.activeLobby) {
                    state.activeLobby.isHost = state.userID === state.activeLobby.hostID;
                }

                if (state.activeLobby?.activeRound) {
                    state.activeLobby.activeRound.isHost = state.userID === state.activeLobby.hostID;
                }

                return state;
            case 'ACTIVE_ROUND_UPDATED':
                if (state.activeLobby) {
                    state.activeLobby.activeRound = stateEvent.data;
                    state.activeLobby.activeRound.isHost = state.userID === state.activeLobby.hostID;
                }
                return state;
            case 'CURRENT_QUESTION_UPDATED':
                if (state.activeLobby && state.activeLobby.activeRound) {
                    state.activeLobby.activeRound.currentQuestion = stateEvent.data;
                }
                return state;
        }
    })
).subscribe((nextState) => {
    state$.next(nextState);
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
                fetch(`/api/lobby/${state.activeLobby.id}/exit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                console.error(
                    'ExitLobby command failed',
                    state.activeLobby
                );
            }
            break;

        case 'StartRound':
            if (state.activeLobby) {
                fetch(`/api/lobby/${state.activeLobby.id}/start_round`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
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

                fetch(`/api/lobby/${lobbyID}/start_question`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        question_index: currentQuestionIndex !== undefined ? currentQuestionIndex + 1 : 0
                    })
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
                fetch(`/api/lobby/${state.activeLobby.id}/answer_question`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        question_index: state.activeLobby.activeRound.currentQuestion.i,
                        answer: cmd.data
                    })
                });
            } else {
                console.error('AnswerQuestion command failed', state.activeLobby);
            }
            break;

        case 'EndQuestion':
            if (state.activeLobby && state.activeLobby.activeRound && state.activeLobby.activeRound.currentQuestion) {
                if (state.activeLobby.isHost) {
                    fetch(`/api/lobby/${state.activeLobby.id}/end_question`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            question_index: state.activeLobby.activeRound.currentQuestion.i,
                        })
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
        const socket = setupLobbyWebSocket(activeLobby.id);
        closeSocket = socket.close.bind(socket);
    }
});

function createLobbyFromLobbyData(lobbyData: any): PlainLobby {
    return {
        id: lobbyData['id'] as string,
        hostID: lobbyData['host_id'] as string,
        joinCode: lobbyData['join_code'] as string,
        users: lobbyData['users'],
        activeRound: lobbyData['round'] && createRoundFromRoundData(lobbyData['round']),
        isHost: false,
        isPresenter: false
    };
}

function createRoundFromRoundData(roundData: any): PlainRound {
    return {
        questions: roundData['questions'].map(createQuestionFromQuestionData),
        currentQuestion: roundData['current_question'] ? createPlainCurrentQuestionMetadata(roundData['current_question']) : null,
        isHost: false
    };
}

function createPlainCurrentQuestionMetadata(currentQuestionData: any): PlainCurrentQuestionMetadata {
    return {
        i: currentQuestionData['i'],
        startTime: currentQuestionData['start_time'] * 1000,
        hasEnded: currentQuestionData['has_ended']
    };
}

function createQuestionFromQuestionData(questionData: any): Question {
    return {
        videoID: questionData['video_id'] as string,
        questionStartTime: questionData['start_time'] as number,
        questionDisplayTime: questionData['question_display_time'] as number,
        answerLockTime: questionData['answer_lock_time'] as number,
        answerRevealTime: questionData['answer_reveal_time'] as number,
        endTime: questionData['end_time'] as number,
        answerText1: questionData['answer_text_1'] as string,
        answerText2: questionData['answer_text_2'] as string,
        answerText3: questionData['answer_text_3'] as string,
        correctAnswer: questionData['correct_answer'] as string,
    };
}

let timeOffset = 0;
const timer: Timer = {
    now() {
        return Date.now() + timeOffset;
    }
};

const handshakeSendTime = Date.now();
const handshake = fetch('/api/handshake', {
    method: 'POST'
})
    .then(x => x.json())
    .then((handshakeData) => {
        const handshakeReceivedTime = Date.now();
        const serverTime = handshakeData['utc_time'] * 1000;
        const sendTime = serverTime - handshakeSendTime;
        const receiveTime = handshakeReceivedTime - serverTime;
        timeOffset = sendTime - ((sendTime + receiveTime) / 2);

        const lobbyData = handshakeData['active_lobby'];

        stateEvents$.next({
            code: 'USER_ID_SET',
            data: handshakeData['user_id']
        });

        stateEvents$.next({
            code: 'ACTIVE_LOBBY_UPDATED',
            data: lobbyData ? createLobbyFromLobbyData(lobbyData) : null
        });
    });

function createLobby() {

    areCommandsDisabled$.next(true);

    handshake
        .then(() => fetch('/api/create_lobby', {
            method: 'POST'
        }))
        .then(response => response.json())
        .then((lobbyData) => {
            stateEvents$.next({
                code: 'ACTIVE_LOBBY_UPDATED',
                data: createLobbyFromLobbyData(lobbyData)
            });
        });
}

function joinLobby(joinCode: string, presenter?: boolean) {

    areCommandsDisabled$.next(true);

    if (presenter) {
        fetch(`/api/get_lobby/${joinCode}`)
            .then(response => response.json())
            .then((lobbyData) => {
                const lobby = createLobbyFromLobbyData(lobbyData);
                lobby.isPresenter = true;

                stateEvents$.next({
                    code: 'ACTIVE_LOBBY_UPDATED',
                    data: lobby
                });
            });
    } else {
        fetch('/api/join_lobby', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    join_code: joinCode
                })
            })
            .then(response => response.json())
            .then((lobbyData) => {
                stateEvents$.next({
                    code: 'ACTIVE_LOBBY_UPDATED',
                    data: createLobbyFromLobbyData(lobbyData)
                });
            })
            .catch(() => {
                areCommandsDisabled$.next(false);
            });
    }
}

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

const MainWelcomeScreen = () => WelcomeScreen(ComposedCommandButton, createLobby, joinLobby);

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
