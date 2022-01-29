import React from 'react';

import { render, screen } from '@testing-library/react';
import { mock } from 'jest-mock-extended';

import ActiveScreen from './ActiveScreen';
import Lobby from '../Model/Lobby';
import Round from '../Model/Round';
import { LobbyScreenProps } from './LobbyScreen';
import { PresenterRoundScreenProps } from './PresenterRoundScreen';
import { PlayerRoundScreenProps } from './PlayerRoundScreen';
import { BehaviorSubject } from 'rxjs';

let activeLobby$: BehaviorSubject<Lobby | null>;
let isCommandPending$: BehaviorSubject<boolean>;
let DummyWelcomeScreen: React.FunctionComponent;
let DummyLobbyScreen: React.FunctionComponent<LobbyScreenProps>;
let DummyPresenterRoundScreen: React.FunctionComponent<PresenterRoundScreenProps>;
let DummyPlayerRoundScreen: React.FunctionComponent<PlayerRoundScreenProps>;
let DummyProfileScreen: React.FunctionComponent;

function ExampleActiveScreen() {
    return ActiveScreen(
        activeLobby$,
        isCommandPending$,
        DummyWelcomeScreen,
        DummyLobbyScreen,
        DummyPresenterRoundScreen,
        DummyPlayerRoundScreen,
        DummyProfileScreen
    );
}

beforeEach(() => {
    activeLobby$ = new BehaviorSubject<Lobby | null>(null);
    isCommandPending$ = new BehaviorSubject<boolean>(false);
    DummyWelcomeScreen = () => <div>Welcome</div>;
    DummyLobbyScreen = () => <div>Lobby</div>;
    DummyPresenterRoundScreen = () => <div>Presenter</div>;
    DummyPlayerRoundScreen = () => <div>Player</div>;
    DummyProfileScreen = () => <div>Profile</div>;
});

test('it displays welcome screen when there is no active lobby', () => {
    render(<ExampleActiveScreen />);

    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.queryByText('Lobby')).not.toBeInTheDocument();
    expect(screen.queryByText('Round')).not.toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
});

test('it displays lobby screen when there is an active lobby', () => {
    const lobby = mock<Lobby>();
    lobby.activeRound$ = new BehaviorSubject(null);

    activeLobby$.next(lobby);

    render(<ExampleActiveScreen />);

    expect(screen.getByText('Lobby')).toBeInTheDocument();
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
    expect(screen.queryByText('Round')).not.toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
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
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
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
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
});

test('it displays profile screen when command is pending', () => {
    isCommandPending$.next(true);

    render(<ExampleActiveScreen />);

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.queryByText('Player')).not.toBeInTheDocument();
    expect(screen.queryByText('Presenter')).not.toBeInTheDocument();
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
    expect(screen.queryByText('Lobby')).not.toBeInTheDocument();
});
