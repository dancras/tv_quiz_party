import React from 'react';
import ReactDOM from 'react-dom';
import { bind, Subscribe } from '@react-rxjs/core';
import { of, from } from 'rxjs';
import { distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ErrorBoundary } from 'react-error-boundary';
import './index.css';
import App from './App';
import ActiveScreen from './ActiveScreen';
import WelcomeScreen from './WelcomeScreen';
import ActiveLobby, { LobbyUpdateFn } from './ActiveLobby';
import { PlainLobby, PlainRound, Question } from './Lobby';
import LobbyScreen, { LobbyScreenProps } from './LobbyScreen';
import reportWebVitals from './reportWebVitals';
import RoundScreen from './RoundScreen';

function subscribeToLobbyUpdates(id: string, handler: LobbyUpdateFn) {
    const url = new URL(`/api/lobby/${id}/ws`, window.location.href);
    url.protocol = url.protocol.replace('http', 'ws');

    const socket = new WebSocket(url.href);

    socket.addEventListener('open', (event) => {
        console.debug('Socket is open', event);
    });

    socket.addEventListener('message', (event) => {
        console.debug('Socket message', event);
        const message = JSON.parse(event.data);

        if (message.code === 'USER_JOINED') {
            handler(createLobbyFromLobbyData(message.data.lobby));
        }

        if (message.code === 'USER_EXITED') {
            handler(createLobbyFromLobbyData(message.data.lobby));
        }

        if (message.code === 'LOBBY_CLOSED') {
            activeLobby.setValue(null);
        }

        if (message.code === 'ROUND_STARTED') {
            handler(createRoundFromRoundData(message.data));
        }
    });

}

const activeLobby = new ActiveLobby(subscribeToLobbyUpdates);

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
        questions: roundData['questions'].map(createQuestionFromQuestionData)
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
        if (lobbyData) {
            activeLobby.setValue(createLobbyFromLobbyData(lobbyData));
        } else {
            activeLobby.setValue(null);
        }
    });

function createLobby() {
    handshake
        .then(() => fetch('/api/create_lobby', {
            method: 'POST'
        }))
        .then(response => response.json())
        .then((lobbyData) => {
            activeLobby.setValue(createLobbyFromLobbyData(lobbyData));
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
            activeLobby.setValue(createLobbyFromLobbyData(lobbyData));
        });
}

// activeLobby.value$ has a default of null so we need to wait for the
// handshake before reading from it so we can see loading/error state
const activeLobby$ = from(handshake).pipe(
    switchMap(() => activeLobby.value$),
);
const [useActiveLobby] = bind(activeLobby$);

const activeLobbyUsers$ = activeLobby.value$.pipe(
    switchMap(lobby => lobby ? lobby.users$ : of([])),
    distinctUntilChanged()
);
const [useActiveLobbyUsers] = bind(activeLobbyUsers$, []);

const activeRound$ = activeLobby.value$.pipe(
    switchMap(lobby => lobby ? lobby.activeRound$ : of(null)),
    distinctUntilChanged()
);
const [useActiveRound] = bind(activeRound$, null);

const MainWelcomeScreen = () => WelcomeScreen(createLobby, joinLobby);

const ActiveLobbyScreen = (props: LobbyScreenProps) => LobbyScreen(useActiveLobbyUsers, props);

const MainActiveScreen = () => ActiveScreen(
    useActiveLobby,
    useActiveRound,
    MainWelcomeScreen,
    ActiveLobbyScreen,
    RoundScreen,
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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
