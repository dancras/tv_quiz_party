import { BehaviorSubject } from 'rxjs';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockProxy, mock } from 'jest-mock-extended';

import LobbyScreen, { LobbyScreenProps } from './LobbyScreen';
import Lobby from '../Model/Lobby';
import { DummyCommandButton } from '../Component/CommandButton';

let mockLobby: MockProxy<Lobby>;

function ExampleLobbyScreen(props: LobbyScreenProps) {
    return LobbyScreen(DummyCommandButton, props);
}

beforeEach(() => {
    mockLobby = mock<Lobby>();
    mockLobby.joinCode = 'join-code';
    mockLobby.users$ = new BehaviorSubject({});
});

test('join code is displayed', () => {
    mockLobby.joinCode = 'foo';

    render(<ExampleLobbyScreen lobby={mockLobby} />);

    const joinCodeElement = screen.getByText('foo');
    expect(joinCodeElement).toBeInTheDocument();
});

test('users are displayed', () => {
    mockLobby.users$ = new BehaviorSubject({
        user1: {
            userID: 'user1',
            displayName: 'User 1',
            imageFilename: ''
        },
        user2: {
            userID: 'user2',
            displayName: 'User 2',
            imageFilename: ''
        }
    });

    render(<ExampleLobbyScreen lobby={mockLobby} />);

    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
});

test('start button calls start round function when clicked', () => {
    mockLobby.isHost = true;
    render(<ExampleLobbyScreen lobby={mockLobby} />);

    const buttonElement = screen.getByText(/Start Round/i);
    userEvent.click(buttonElement);
    expect(buttonElement).toHaveAttribute('data-command-button');

    expect(mockLobby.startRound).toBeCalled();
});

test('start button is only shown to lobby host', () => {
    mockLobby.isHost = false;
    render(<ExampleLobbyScreen lobby={mockLobby} />);

    const buttonElement = screen.queryByText(/Start Round/i);

    expect(buttonElement).not.toBeInTheDocument();
});
