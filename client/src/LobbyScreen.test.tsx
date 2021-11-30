import { BehaviorSubject } from 'rxjs';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LobbyScreen from './LobbyScreen';
import Lobby from './Lobby';
import { MockProxy, mock } from 'jest-mock-extended';

let mockLobby: MockProxy<Lobby>;

beforeEach(() => {
    mockLobby = mock<Lobby>();
    mockLobby.joinCode = 'join-code';
    mockLobby.users$ = new BehaviorSubject([]);
});

test('join code is displayed', () => {
    mockLobby.joinCode = 'foo';

    render(<LobbyScreen lobby={mockLobby} />);

    const joinCodeElement = screen.getByText('foo');
    expect(joinCodeElement).toBeInTheDocument();
});

test('users are displayed', () => {
    mockLobby.users$ = new BehaviorSubject(['user1', 'user2']);

    render(<LobbyScreen lobby={mockLobby} />);

    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
});

test('exit lobby button calls exit lobby', () => {
    render(<LobbyScreen lobby={mockLobby} />);

    const buttonElement = screen.getByText(/Exit Lobby/i);
    userEvent.click(buttonElement);

    expect(mockLobby.exit).toBeCalled();
    expect(buttonElement).toBeDisabled();
});

test('start button calls start round function when clicked', () => {
    render(<LobbyScreen lobby={mockLobby} />);

    const buttonElement = screen.getByText(/Start Round/i);
    userEvent.click(buttonElement);

    expect(mockLobby.startRound).toBeCalled();
    expect(buttonElement).toBeDisabled();
});
