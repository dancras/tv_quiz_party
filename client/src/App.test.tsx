import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('displays welcome screen when there is no active lobby', () => {
  const useActiveLobby = () => null;
  const DummyWelcomeScreen = () => <div>Welcome</div>;
  const DummyLobbyScreen = () => <div>Lobby</div>;
  const TestApp = () => App(useActiveLobby, DummyWelcomeScreen, DummyLobbyScreen);
  render(<TestApp />);

  expect(screen.getByText('Welcome')).toBeInTheDocument();
  expect(screen.queryByText('Lobby')).not.toBeInTheDocument();
});

test('displays lobby screen when there is an active lobby', () => {
  const useActiveLobby = () => {
    return {
      joinCode: 'foo',
      users: []
    };
  };
  const DummyWelcomeScreen = () => <div>Welcome</div>;
  const DummyLobbyScreen = () => <div>Lobby</div>;
  const TestApp = () => App(useActiveLobby, DummyWelcomeScreen, DummyLobbyScreen);
  render(<TestApp />);

  expect(screen.getByText('Lobby')).toBeInTheDocument();
  expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
});
