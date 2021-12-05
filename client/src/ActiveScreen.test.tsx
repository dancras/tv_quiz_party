import React from 'react';

import { render, screen } from '@testing-library/react';
import { mock } from 'jest-mock-extended';

import ActiveScreen from './ActiveScreen';
import Lobby from './Lobby';
import Round from './Round';
import { LobbyScreenProps } from './LobbyScreen';
import { RoundScreenProps } from './RoundScreen';

let useActiveLobby: jest.MockedFunction<() => Lobby | null>;
let useActiveRound: jest.MockedFunction<() => Round | null>;
let DummyWelcomeScreen: React.FunctionComponent;
let DummyLobbyScreen: React.FunctionComponent<LobbyScreenProps>;
let DummyRoundScreen: React.FunctionComponent<RoundScreenProps>;

function ExampleActiveScreen() {
    return ActiveScreen(
        useActiveLobby,
        useActiveRound,
        DummyWelcomeScreen,
        DummyLobbyScreen,
        DummyRoundScreen
    );
}

beforeEach(() => {
    useActiveLobby = jest.fn();
    useActiveRound = jest.fn();
    DummyWelcomeScreen = () => <div>Welcome</div>;
    DummyLobbyScreen = () => <div>Lobby</div>;
    DummyRoundScreen = () => <div>Round</div>;
});

test('it displays welcome screen when there is no active lobby', () => {
    render(<ExampleActiveScreen />);

    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.queryByText('Lobby')).not.toBeInTheDocument();
    expect(screen.queryByText('Round')).not.toBeInTheDocument();
});

test('it displays lobby screen when there is an active lobby', () => {
    useActiveLobby.mockReturnValue(mock<Lobby>());

    render(<ExampleActiveScreen />);

    expect(screen.getByText('Lobby')).toBeInTheDocument();
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
    expect(screen.queryByText('Round')).not.toBeInTheDocument();
});

test('it displays round screen when there is an active round', () => {
    useActiveLobby.mockReturnValue(mock<Lobby>());
    useActiveRound.mockReturnValue(mock<Round>());

    render(<ExampleActiveScreen />);

    expect(screen.getByText('Round')).toBeInTheDocument();
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
    expect(screen.queryByText('Lobby')).not.toBeInTheDocument();
});
