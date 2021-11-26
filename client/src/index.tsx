import React from 'react';
import ReactDOM from 'react-dom';
import * as Rx from 'rxjs';
import { map } from 'rxjs/operators';
import { bind } from '@react-rxjs/core'
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// handshake and create promise which can be passed to app
const handshake$ = Rx.from(
  fetch('/api/handshake', {
    method: 'POST'
  })
  .then(x => x.json())
);

const userId$ = handshake$.pipe(
  map(x => x['user_id'])
);

const [useUserId] = bind(userId$);

ReactDOM.render(
  <React.StrictMode>
    <App useUserId={useUserId} />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
