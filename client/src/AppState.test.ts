import { firstValueFrom } from 'rxjs';
import { AppState, AppStateEvent, AppStateHandler, setupAppState } from './AppState';
import { createPlainLobby } from './Model/Lobby.test-helper';

test('state is updated by the handler function', () => {
    const handler: jest.MockedFunction<AppStateHandler> = jest.fn();
    const [$state, $stateEvent] = setupAppState('user', null, null, handler);

    const initialState: AppState = {
        userID: 'user',
        activeLobby: null,
        profile: null,
        pendingCommand: null
    };

    const expectedLobby = createPlainLobby();

    const updatedState: AppState = {
        userID: 'user',
        activeLobby: expectedLobby,
        profile: null,
        pendingCommand: null
    };

    const expectedStateEvent: AppStateEvent = {
        code: 'ACTIVE_LOBBY_UPDATED',
        data: expectedLobby
    };

    handler.mockReturnValue(updatedState);

    $stateEvent.next(expectedStateEvent);

    expect(handler).toBeCalledWith([expectedStateEvent, initialState], expect.anything());

    return firstValueFrom($state).then((state) => {
        expect(state).toEqual(updatedState);
    });
});

test('updater function uses a new state copy', () => {
    const handler: jest.MockedFunction<AppStateHandler> = jest.fn(([stateEvent, state], i) => state);
    const [, $stateEvent] = setupAppState('user', null, null, handler);

    const expectedLobby = createPlainLobby();

    const someEvent: AppStateEvent = {
        code: 'ACTIVE_LOBBY_UPDATED',
        data: expectedLobby
    };

    $stateEvent.next(someEvent);
    $stateEvent.next(someEvent);

    expect(handler.mock.calls[0][0][1]).not.toBe(handler.mock.calls[1][0][1]);

});
