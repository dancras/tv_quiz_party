import { BehaviorSubject } from 'rxjs';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockProxy, mock } from 'jest-mock-extended';

import LobbyScreen, { LobbyScreenProps } from './LobbyScreen';
import Lobby from '../Model/Lobby';
import { CommandButtonProps } from '../Component/CommandButton';

let DummyCommandButton: React.FunctionComponent<CommandButtonProps>;
let useUsers: jest.MockedFunction<() => string[]>;
let mockLobby: MockProxy<Lobby>;

function ExampleLobbyScreen(props: LobbyScreenProps) {
    return LobbyScreen(DummyCommandButton, useUsers, props);
}

beforeEach(() => {
    DummyCommandButton = ({ children, ...props }) => <button data-x {...props}>{children}</button>;
    useUsers = jest.fn();
    useUsers.mockReturnValue([]);
    mockLobby = mock<Lobby>();
    mockLobby.joinCode = 'join-code';
});

test('join code is displayed', () => {
    mockLobby.joinCode = 'foo';

    render(<ExampleLobbyScreen lobby={mockLobby} />);

    const joinCodeElement = screen.getByText('foo');
    expect(joinCodeElement).toBeInTheDocument();
});

test('users are displayed', () => {
    useUsers.mockReturnValue(['user1', 'user2']);
    mockLobby.users$ = new BehaviorSubject(['user1', 'user2']);

    render(<ExampleLobbyScreen lobby={mockLobby} />);

    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
});

test('start button calls start round function when clicked', () => {
    mockLobby.isHost = true;
    render(<ExampleLobbyScreen lobby={mockLobby} />);

    const buttonElement = screen.getByText(/Start Round/i);
    userEvent.click(buttonElement);
    expect(buttonElement).toHaveAttribute('data-x');

    expect(mockLobby.startRound).toBeCalled();
});

test('start button is only shown to lobby host', () => {
    mockLobby.isHost = false;
    render(<ExampleLobbyScreen lobby={mockLobby} />);

    const buttonElement = screen.queryByText(/Start Round/i);

    expect(buttonElement).not.toBeInTheDocument();
});
