import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandButtonProps } from './CommandButton';
import WelcomeScreen from './WelcomeScreen';

let DummyCommandButton: React.FunctionComponent<CommandButtonProps>;
let mockCreateLobby: jest.MockedFunction<() => void>;
let mockJoinLobby: jest.MockedFunction<(joinCode: string, presenter?: boolean) => void>;

beforeEach(() => {
    DummyCommandButton = ({ children, ...props }) => <button data-x {...props}>{children}</button>;
    mockCreateLobby = jest.fn();
    mockJoinLobby = jest.fn();
});

function ExampleWelcomeScreen() {
    return WelcomeScreen(DummyCommandButton, mockCreateLobby, mockJoinLobby);
}

test('host lobby button calls create lobby and disables buttons when clicked', () => {
    render(<ExampleWelcomeScreen />);
    const buttonElement = screen.getByText('Host Lobby');
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveAttribute('data-x');

    userEvent.click(buttonElement);

    expect(mockCreateLobby).toBeCalled();
});

test('join lobby form calls join lobby passing lobby code', () => {
    render(<ExampleWelcomeScreen />);
    const inputElement = screen.getByLabelText(/Join Code/i);
    const buttonElement = screen.getByText(/Join Lobby/i);

    expect(buttonElement).toHaveAttribute('data-x');

    userEvent.type(inputElement, 'FOO');
    userEvent.click(buttonElement);

    expect(mockJoinLobby).toBeCalledWith('FOO');
});

test('join lobby form passes presenter flag when presenter button clicked', () => {
    render(<ExampleWelcomeScreen />);
    const inputElement = screen.getByLabelText(/Join Code/i);
    const buttonElement = screen.getByText(/Presenter/i);

    expect(buttonElement).toHaveAttribute('data-x');

    userEvent.type(inputElement, 'FOO');
    userEvent.click(buttonElement);

    expect(mockJoinLobby).toBeCalledWith('FOO', true);
});
