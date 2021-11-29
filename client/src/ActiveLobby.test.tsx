import ActiveLobby from './ActiveLobby';
import Lobby from './Lobby';

test('it exposes signal and setter pair', () => {
    const updateSubscriber = jest.fn();
    const activeLobby = new ActiveLobby(updateSubscriber);
    const plainLobby = {
        id: 'lobby-id',
        joinCode: 'lobby-join-code',
        users: []
    };

    const subscribeSpy = jest.fn();
    activeLobby.value$.subscribe(subscribeSpy);

    activeLobby.setValue(plainLobby);

    expect(subscribeSpy).toBeCalledWith(expect.any(Lobby));
    expect(subscribeSpy).toBeCalledWith(expect.objectContaining({
        id: 'lobby-id'
    }));

    activeLobby.setValue(null);

    expect(subscribeSpy).toBeCalledWith(null);
});

test('it subscribes to server updates for the currently active lobby', () => {
    const updateSubscriber = jest.fn();
    const activeLobby = new ActiveLobby(updateSubscriber);

    const valueSubscriber = jest.fn();
    activeLobby.value$.subscribe(valueSubscriber);

    const plainLobby = {
        id: 'lobby-id',
        joinCode: 'lobby-join-code',
        users: []
    };
    activeLobby.setValue(plainLobby);

    const [lobby]: [Lobby] = valueSubscriber.mock.calls[0];
    const usersSubscriber = jest.fn();
    lobby.users$.subscribe(usersSubscriber);

    const [updateID, updateFn] = updateSubscriber.mock.calls[0];
    updateFn({
        id: 'lobby-id',
        joinCode: 'lobby-join-code',
        users: ['lobby-user-1']
    });

    expect(updateID).toEqual('lobby-id');
    expect(valueSubscriber).toHaveBeenCalledTimes(1);
    expect(usersSubscriber).toHaveBeenCalledWith(['lobby-user-1']);
});
