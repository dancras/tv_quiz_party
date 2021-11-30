import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LobbyScreen, { LobbyScreenProps } from './LobbyScreen';

test('join code is displayed', () => {
    const mockExitLobby = jest.fn();
    const joinCode = 'foo';
    const useUsers = () => [];
    const ExampleLobbyScreen = (props: LobbyScreenProps) => LobbyScreen(mockExitLobby, props);
    render(<ExampleLobbyScreen joinCode={joinCode} useUsers={useUsers} />);

    const joinCodeElement = screen.getByText('foo');
    expect(joinCodeElement).toBeInTheDocument();
});

test('users are displayed', () => {
    const mockExitLobby = jest.fn();
    const joinCode = 'foo';
    const useUsers = () => ['user1', 'user2'];
    const ExampleLobbyScreen = (props: LobbyScreenProps) => LobbyScreen(mockExitLobby, props);

    render(<ExampleLobbyScreen joinCode={joinCode} useUsers={useUsers} />);

    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
});

test('exit lobby button calls exit lobby', () => {
    const mockExitLobby = jest.fn();
    const joinCode = 'foo';
    const useUsers = () => ['user1', 'user2'];
    const ExampleLobbyScreen = (props: LobbyScreenProps) => LobbyScreen(mockExitLobby, props);

    render(<ExampleLobbyScreen joinCode={joinCode} useUsers={useUsers} />);
    const buttonElement = screen.getByText(/Exit Lobby/i);

    userEvent.click(buttonElement);

    expect(mockExitLobby).toBeCalled();
    expect(buttonElement).toBeDisabled();
});
