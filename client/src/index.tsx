import React from 'react';
import ReactDOM from 'react-dom';
// import * as Rx from 'rxjs';
// import { map } from 'rxjs/operators';
import { bind } from '@react-rxjs/core'
import { createSignal } from "@react-rxjs/utils"
import './index.css';
import App from './App';
import WelcomeScreen from './WelcomeScreen';
import LobbyScreen, { Lobby } from './LobbyScreen';
import reportWebVitals from './reportWebVitals';

const [activeLobby$, setActiveLobby] = createSignal<Lobby | null>();
const [useActiveLobby] = bind(activeLobby$, null);

const handshake = fetch('/api/handshake', {
    method: 'POST'
  })
  .then(x => x.json())
  .then((handshakeData) => {
    const lobbyData = handshakeData['active_lobby'];
    if (lobbyData) {
      setActiveLobby({
        joinCode: lobbyData['join_code'],
        users: lobbyData['users']
      });
    }
  })

function createLobby() {
  handshake
    .then(() => fetch('/api/create_lobby', {
      method: 'POST'
    }))
    .then(response => response.json())
    .then((lobbyData) => {
      setActiveLobby({
        joinCode: lobbyData['join_code'],
        users: lobbyData['users']
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
      setActiveLobby({
        joinCode: lobbyData['join_code'],
        users: lobbyData['users']
      });
    });
}

const MainWelcomeScreen = () => WelcomeScreen(createLobby, joinLobby);

const TvQuizPartyApp = () => App(useActiveLobby, MainWelcomeScreen, LobbyScreen);

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
