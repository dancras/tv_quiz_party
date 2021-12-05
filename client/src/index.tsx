import React from 'react';
import ReactDOM from 'react-dom';
import { bind, Subscribe } from '@react-rxjs/core';
import { of, Subject, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { ErrorBoundary } from 'react-error-boundary';
import './index.css';
import App from './App';
import ActiveScreen from './ActiveScreen';
import WelcomeScreen from './WelcomeScreen';
import { setupActiveLobby } from './ActiveLobby';
import { PlainLobby } from './Lobby';
import { CurrentQuestionMetadata, PlainRound, Question, RoundCmd } from './Round';
import LobbyScreen, { LobbyScreenProps } from './LobbyScreen';
import reportWebVitals from './reportWebVitals';
import RoundScreen, { RoundScreenProps } from './RoundScreen';
import QuestionViewer from './QuestionViewer';

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
                    data: createCurrentQuestionMetadata(message.data)
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
    activeLobby: PlainLobby | null
};
type AppStateEvent =
    { code: 'ACTIVE_LOBBY_UPDATED', data: PlainLobby | null } |
    { code: 'ACTIVE_ROUND_UPDATED', data: PlainRound } |
    { code: 'CURRENT_QUESTION_UPDATED', data: CurrentQuestionMetadata };

const stateEvents$ = new Subject<AppStateEvent>();
const state$ = new BehaviorSubject<AppState>({
    activeLobby: null
});

stateEvents$.pipe(
    withLatestFrom(state$),
    map(([stateEvent, state]) => {
        switch (stateEvent.code) {
            case 'ACTIVE_LOBBY_UPDATED':
                state.activeLobby = stateEvent.data;
                return state;
            case 'ACTIVE_ROUND_UPDATED':
                if (state.activeLobby) {
                    state.activeLobby.activeRound = stateEvent.data;
                }
                return state;
            case 'CURRENT_QUESTION_UPDATED':
                if (state.activeLobby && state.activeLobby.activeRound) {
                    state.activeLobby.activeRound.currentQuestion = stateEvent.data;
                }
                return state;
        }
    })
).subscribe(state$.next.bind(state$));

type AppCmd = RoundCmd;
const cmds$ = new Subject<AppCmd>();

cmds$.pipe(
    withLatestFrom(state$)
).subscribe(([cmd, state]) => {
    switch (cmd.cmd) {
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
                        question_index: currentQuestionIndex ? currentQuestionIndex + 1 : 0
                    })
                });
            } else {
                console.error(
                    'StartNextQuestion command failed',
                    state.activeLobby,
                    state.activeLobby?.activeRound
                );
            }
    }
});


const activeLobby$ = setupActiveLobby(
    cmds$.next.bind(cmds$),
    function (lobbyID: string) {
        fetch(`/api/lobby/${lobbyID}/exit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    },
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
        joinCode: lobbyData['join_code'],
        users: lobbyData['users'],
        activeRound: lobbyData['round'] && createRoundFromRoundData(lobbyData['round'])
    };
}

function createRoundFromRoundData(roundData: any): PlainRound {
    return {
        questions: roundData['questions'].map(createQuestionFromQuestionData),
        currentQuestion: roundData['current_question'] ? createCurrentQuestionMetadata(roundData['current_question']) : null
    };
}

function createCurrentQuestionMetadata(currentQuestionData: any): CurrentQuestionMetadata {
    return {
        i: currentQuestionData['i'],
        startTime: currentQuestionData['start_time'],
        hasEnded: currentQuestionData['has_ended']
    };
}

function createQuestionFromQuestionData(questionData: any): Question {
    return {
        videoID: questionData['video_id'] as string,
        startTime: questionData['start_time'] as number,
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

const handshake = fetch('/api/handshake', {
    method: 'POST'
})
    .then(x => x.json())
    .then((handshakeData) => {
        const lobbyData = handshakeData['active_lobby'];

        stateEvents$.next({
            code: 'ACTIVE_LOBBY_UPDATED',
            data: lobbyData ? createLobbyFromLobbyData(lobbyData) : null
        });
    });

function createLobby() {
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

function joinLobby(joinCode: string) {
    handshake
        .then(() => fetch('/api/join_lobby', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                join_code: joinCode
            })
        }))
        .then(response => response.json())
        .then((lobbyData) => {
            stateEvents$.next({
                code: 'ACTIVE_LOBBY_UPDATED',
                data: createLobbyFromLobbyData(lobbyData)
            });
        });
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

// TODO implement this on Round
const canStartNextQuestion$ = of(true);
const [useCanStartNextQuestion] = bind(canStartNextQuestion$, false);

const MainWelcomeScreen = () => WelcomeScreen(createLobby, joinLobby);

const ActiveLobbyScreen = (props: LobbyScreenProps) => LobbyScreen(useActiveLobbyUsers, props);

const ActiveRoundScreen = (props: RoundScreenProps) => RoundScreen(
    QuestionViewer,
    useCurrentQuestion,
    useCanStartNextQuestion,
    props
);

const MainActiveScreen = () => ActiveScreen(
    useActiveLobby,
    useActiveRound,
    MainWelcomeScreen,
    ActiveLobbyScreen,
    ActiveRoundScreen,
);

const TvQuizPartyApp = () => App(useActiveLobby, MainActiveScreen);

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
