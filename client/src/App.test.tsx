import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mock, MockProxy } from 'jest-mock-extended';

import App from './App';
import Lobby from './Model/Lobby';
import { DummyCommandButton } from './Component/CommandButton';
import { BehaviorSubject } from 'rxjs';

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

    const buttonElement = screen.getByTestId('app-button-exit-lobby');
    userEvent.click(buttonElement);
    expect(buttonElement).toHaveAttribute('data-command-button');

    expect(mockLobby.exit).toBeCalled();
});
