import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mock, MockProxy } from 'jest-mock-extended';

import App from './App';
import Lobby from './Model/Lobby';
import { CommandButtonProps } from './Component/CommandButton';
import { BehaviorSubject } from 'rxjs';


let DummyCommandButton: React.FunctionComponent<CommandButtonProps>;
let activeLobby$: BehaviorSubject<Lobby | null>;
let DummyActiveScreen: React.FunctionComponent;

function ExampleApp() {
    return App(
        DummyCommandButton,
        activeLobby$,
        DummyActiveScreen
    );
}

beforeEach(() => {
    DummyCommandButton = ({ children, ...props }) => <button data-x {...props}>{children}</button>;
    activeLobby$ = new BehaviorSubject<Lobby | null>(null);
    DummyActiveScreen = () => <div>Screen</div>;
});

test('displays contents of ActiveScreen', () => {
    render(<ExampleApp />);

    expect(screen.getByText('Screen')).toBeInTheDocument();
});

test('exit lobby button shown when there is an active lobby', () => {
    const mockLobby: MockProxy<Lobby> = mock<Lobby>();
    activeLobby$.next(mockLobby);

    render(<ExampleApp />);

    const buttonElement = screen.getByText(/Exit Lobby/i);
    userEvent.click(buttonElement);
    expect(buttonElement).toHaveAttribute('data-x');

    expect(mockLobby.exit).toBeCalled();
});
