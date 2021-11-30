import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WelcomeScreen from './WelcomeScreen';

test('host lobby button calls create lobby and disables buttons when clicked', () => {
    const mockCreateLobby = jest.fn();
    const mockJoinLobby = jest.fn();
    const MockedWelcomeScreen = () => WelcomeScreen(mockCreateLobby, mockJoinLobby);

    render(<MockedWelcomeScreen />);
    const buttonElement = screen.getByText(/Host Lobby/i);
    expect(buttonElement).toBeInTheDocument();

    userEvent.click(buttonElement);
    expect(mockCreateLobby).toBeCalled();
    expect(buttonElement).toBeDisabled();
});

test('join lobby form calls join lobby passing lobby code', () => {
    const mockJoinLobby = jest.fn();
    const MockedWelcomeScreen = () => WelcomeScreen(jest.fn(), mockJoinLobby);

    render(<MockedWelcomeScreen />);
    const inputElement = screen.getByLabelText(/Join Code/i);
    const buttonElement = screen.getByText(/Join Lobby/i);

    userEvent.type(inputElement, 'FOO');
    userEvent.click(buttonElement);

    expect(mockJoinLobby).toBeCalledWith('FOO');
    expect(buttonElement).toBeDisabled();
});
