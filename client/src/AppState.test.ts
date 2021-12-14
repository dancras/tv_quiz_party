import { firstValueFrom } from 'rxjs';
import { AppState, AppStateEvent, AppStateHandler, setupAppState } from './AppState';
import { createPlainLobby } from './Lobby.test';

test('state is updated by the handler function', () => {
    const handler: jest.MockedFunction<AppStateHandler> = jest.fn();
    const [$state, $stateEvent] = setupAppState('user', null, handler);

    const initialState: AppState = {
        userID: 'user',
        activeLobby: null
    };

    const expectedLobby = createPlainLobby();

    const updatedState: AppState = {
        userID: 'user',
        activeLobby: expectedLobby
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
