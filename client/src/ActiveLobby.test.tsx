import ActiveLobby from './ActiveLobby';
import Lobby from './Lobby';

test('it exposes signal and setter pair', () => {
    const activeLobby = new ActiveLobby();
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
