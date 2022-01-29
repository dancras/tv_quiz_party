import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DummyCommandButton } from '../Component/CommandButton';
import { LobbyCmd } from '../Model/Lobby';
import WelcomeScreen from './WelcomeScreen';

let mockSendCmd: jest.MockedFunction<(cmd: LobbyCmd) => void>;

beforeEach(() => {
    mockSendCmd = jest.fn();
});

function ExampleWelcomeScreen() {
    return WelcomeScreen(DummyCommandButton, mockSendCmd);
}

test('host lobby button calls create lobby and disables buttons when clicked', () => {
    render(<ExampleWelcomeScreen />);
    const buttonElement = screen.getByText('Host Lobby');
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveAttribute('data-command-button');

    userEvent.click(buttonElement);

    expect(mockSendCmd).toBeCalledWith({
        cmd: 'CreateLobby'
    });
});

test('join lobby form calls join lobby passing lobby code', () => {
    render(<ExampleWelcomeScreen />);
    const inputElement = screen.getByLabelText(/Join Code/i);
    const buttonElement = screen.getByText(/Join Lobby/i);

    expect(buttonElement).toHaveAttribute('data-command-button');

    userEvent.type(inputElement, 'FOO');
    userEvent.click(buttonElement);

    expect(mockSendCmd).toBeCalledWith({
        cmd: 'JoinLobby',
        joinCode: 'FOO',
        isPresenter: false
    });
});

test('join lobby form passes presenter flag when presenter button clicked', () => {
    render(<ExampleWelcomeScreen />);
    const inputElement = screen.getByLabelText(/Join Code/i);
    const buttonElement = screen.getByText(/Presenter/i);

    expect(buttonElement).toHaveAttribute('data-command-button');

    userEvent.type(inputElement, 'FOO');
    userEvent.click(buttonElement);

    expect(mockSendCmd).toBeCalledWith({
        cmd: 'JoinLobby',
        joinCode: 'FOO',
        isPresenter: true
    });
});
