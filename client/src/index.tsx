import React from 'react';
import ReactDOM from 'react-dom';
import { Subject } from 'rxjs';
import { filter, sample } from 'rxjs/operators';
import { bind } from '@react-rxjs/core';
import './index.css';
import App from './App';
import WelcomeScreen from './WelcomeScreen';
import ActiveLobby, { LobbyUpdateFn } from './ActiveLobby';
import Lobby, { PlainLobby } from './Lobby';
import LobbyScreen, { LobbyScreenProps } from './LobbyScreen';
import reportWebVitals from './reportWebVitals';

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
    });

}

const activeLobby = new ActiveLobby(subscribeToLobbyUpdates);
const [useActiveLobby] = bind(activeLobby.value$, null);

function createLobbyFromLobbyData(lobbyData: any): PlainLobby {
    return {
        id: lobbyData['id'] as string,
        joinCode: lobbyData['join_code'],
        users: lobbyData['users']
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

const exitLobbyInput$ = new Subject();
activeLobby.value$.pipe(
    sample(exitLobbyInput$),
    filter((v): v is Lobby => !!v)
).subscribe((lobby) => {
    handshake
        .then(() => fetch(`/api/lobby/${lobby.id}/exit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }))
        .then(response => {
            activeLobby.setValue(null);
        });
});

const MainWelcomeScreen = () => WelcomeScreen(createLobby, joinLobby);
const ActiveLobbyScreen = (props: LobbyScreenProps) => LobbyScreen(() => exitLobbyInput$.next(null), props);

const TvQuizPartyApp = () => App(useActiveLobby, MainWelcomeScreen, ActiveLobbyScreen);

// handshake and create promise which can be passed to app
// const handshake$ = Rx.from(
//   fetch('/api/handshake', {
//     method: 'POST'
//   })
//   .then(x => x.json())
// );

// const userId$ = handshake$.pipe(
//   map(x => x['user_id'])
// );

// const [useUserId] = bind(userId$);

ReactDOM.render(
    <React.StrictMode>
        <TvQuizPartyApp />
    </React.StrictMode>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
