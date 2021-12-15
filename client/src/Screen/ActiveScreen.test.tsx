import React from 'react';

import { render, screen } from '@testing-library/react';
import { mock } from 'jest-mock-extended';

import ActiveScreen from './ActiveScreen';
import Lobby from '../Model/Lobby';
import Round from '../Model/Round';
import { LobbyScreenProps } from './LobbyScreen';
import { RoundScreenProps } from './PresenterRoundScreen';
import { BehaviorSubject } from 'rxjs';

let activeLobby$: BehaviorSubject<Lobby | null>;
let DummyWelcomeScreen: React.FunctionComponent;
let DummyLobbyScreen: React.FunctionComponent<LobbyScreenProps>;
let DummyPresenterRoundScreen: React.FunctionComponent<RoundScreenProps>;
let DummyPlayerRoundScreen: React.FunctionComponent<RoundScreenProps>;

function ExampleActiveScreen() {
    return ActiveScreen(
        activeLobby$,
        DummyWelcomeScreen,
        DummyLobbyScreen,
        DummyPresenterRoundScreen,
        DummyPlayerRoundScreen
    );
}

beforeEach(() => {
    activeLobby$ = new BehaviorSubject<Lobby | null>(null);
    DummyWelcomeScreen = () => <div>Welcome</div>;
    DummyLobbyScreen = () => <div>Lobby</div>;
    DummyPresenterRoundScreen = () => <div>Presenter</div>;
    DummyPlayerRoundScreen = () => <div>Player</div>;
});

test('it displays welcome screen when there is no active lobby', () => {
    render(<ExampleActiveScreen />);

    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.queryByText('Lobby')).not.toBeInTheDocument();
    expect(screen.queryByText('Round')).not.toBeInTheDocument();
});

test('it displays lobby screen when there is an active lobby', () => {
    const lobby = mock<Lobby>();
    lobby.activeRound$ = new BehaviorSubject(null);

    activeLobby$.next(lobby);

    render(<ExampleActiveScreen />);

    expect(screen.getByText('Lobby')).toBeInTheDocument();
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
    expect(screen.queryByText('Round')).not.toBeInTheDocument();
});

test('it displays presenter round screen when there is an active presenter round', () => {
    const lobby = mock<Lobby>();
    lobby.isPresenter = true;
    lobby.activeRound$ = new BehaviorSubject(mock<Round>());

    activeLobby$.next(lobby);

    render(<ExampleActiveScreen />);

    expect(screen.getByText('Presenter')).toBeInTheDocument();
    expect(screen.queryByText('Player')).not.toBeInTheDocument();
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
    expect(screen.queryByText('Lobby')).not.toBeInTheDocument();
});

test('it displays player round screen when there is an active player round', () => {
    const lobby = mock<Lobby>();
    lobby.isPresenter = false;
    lobby.activeRound$ = new BehaviorSubject(mock<Round>());

    activeLobby$.next(lobby);

    render(<ExampleActiveScreen />);

    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.queryByText('Presenter')).not.toBeInTheDocument();
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
    expect(screen.queryByText('Lobby')).not.toBeInTheDocument();
});
