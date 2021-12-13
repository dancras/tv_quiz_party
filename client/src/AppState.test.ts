import { firstValueFrom } from 'rxjs';
import { AppStateEvent, AppStateHandler, initState, setupAppState } from './AppState';

test('state is updated by the handler function', () => {
    const handler: jest.MockedFunction<AppStateHandler> = jest.fn();
    const [$state, $stateEvent] = setupAppState(handler);

    const expectedState = initState();
    expectedState.userID = 'foo';

    const expectedStateEvent: AppStateEvent = {
        code: 'USER_ID_SET',
        data: 'bar'
    };

    handler.mockReturnValue(expectedState);

    $stateEvent.next(expectedStateEvent);

    expect(handler).toBeCalledWith([expectedStateEvent, initState()], expect.anything());

    return firstValueFrom($state).then((state) => {
        expect(state).toEqual(expectedState);
    });
});
