import { render, screen } from '@testing-library/react';
import LobbyScreen from './LobbyScreen';

test('join code is displayed', () => {
    const lobby = {
        joinCode: 'foo',
        users: []
    };
    const ExampleLobbyScreen = () => LobbyScreen({ lobby });
    render(<ExampleLobbyScreen />);

    const joinCodeElement = screen.getByText('foo');
    expect(joinCodeElement).toBeInTheDocument();
});

test('users are displayed', () => {
    const lobby = {
        joinCode: 'foo',
        users: ['user1', 'user2']
    };

    const ExampleLobbyScreen = () => LobbyScreen({ lobby });
    render(<ExampleLobbyScreen />);

    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
});
