import Lobby from './Lobby';

test('it exposes id and joinCode from initial data', () => {
    const lobby = new Lobby(() => {}, {
        id: 'lobby-id',
        joinCode: 'lobby-join-code',
        users: [],
        activeRound: null
    });

    expect(lobby.id).toEqual('lobby-id');
    expect(lobby.joinCode).toEqual('lobby-join-code');
});

test('it exposes users as a subscribable value', () => {
    const lobby = new Lobby(() => {}, {
        id: 'lobby-id',
        joinCode: 'lobby-join-code',
        users: [],
        activeRound: null
    });

    const subscribeSpy = jest.fn();
    lobby.users$.subscribe(subscribeSpy);

    expect(subscribeSpy).toHaveBeenCalledWith([]);

    lobby.update({
        id: 'lobby-id',
        joinCode: 'lobby-join-code',
        users: ['lobby-user-1'],
        activeRound: null
    });

    expect(subscribeSpy).toHaveBeenCalledWith(['lobby-user-1']);
});
