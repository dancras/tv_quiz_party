import { render, screen } from '@testing-library/react';
import LobbyScreen from './LobbyScreen';

test('join code is displayed', () => {
    const joinCode = 'foo';
    const useUsers = () => [];
    const ExampleLobbyScreen = () => LobbyScreen({ joinCode, useUsers });
    render(<ExampleLobbyScreen />);

    const joinCodeElement = screen.getByText('foo');
    expect(joinCodeElement).toBeInTheDocument();
});

test('users are displayed', () => {
    const joinCode = 'foo';
    const useUsers = () => ['user1', 'user2'];
    const ExampleLobbyScreen = () => LobbyScreen({ joinCode, useUsers });

    render(<ExampleLobbyScreen />);

    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
});
