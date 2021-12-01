import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mock, MockProxy } from 'jest-mock-extended';

import App from './App';
import Lobby from './Lobby';


let useActiveLobby: jest.MockedFunction<() => Lobby | null>;
let DummyActiveScreen: React.FunctionComponent;

function ExampleApp() {
    return App(
        useActiveLobby,
        DummyActiveScreen
    );
}

beforeEach(() => {
    useActiveLobby = jest.fn();
    DummyActiveScreen = () => <div>Screen</div>;
});

test('displays contents of ActiveScreen', () => {
    render(<ExampleApp />);

    expect(screen.getByText('Screen')).toBeInTheDocument();
});

test('exit lobby button shown when there is an active lobby', () => {
    const mockLobby: MockProxy<Lobby> = mock<Lobby>();
    useActiveLobby.mockReturnValue(mockLobby);

    render(<ExampleApp />);

    const buttonElement = screen.getByText(/Exit Lobby/i);
    userEvent.click(buttonElement);

    expect(mockLobby.exit).toBeCalled();
    expect(buttonElement).toBeDisabled();
});
