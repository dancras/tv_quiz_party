import { render, screen } from '@testing-library/react';
import LobbyScreen from './LobbyScreen';

test('join code is displayed', () => {
    const mockUseLobby = () => {
        return {
            joinCode: 'foo',
            users: []
        }
    };
    const MockedLobbyScreen = () => LobbyScreen(mockUseLobby);
    render(<MockedLobbyScreen />);

    const joinCodeElement = screen.getByText('foo');
    expect(joinCodeElement).toBeInTheDocument();
});

test('users are displayed', () => {
    const mockUseLobby = () => {
        return {
            joinCode: 'foo',
            users: ['user1', 'user2']
        }
    };
    const MockedLobbyScreen = () => LobbyScreen(mockUseLobby);
    render(<MockedLobbyScreen />);

    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
});
