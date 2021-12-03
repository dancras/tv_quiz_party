import { firstValueFrom, from, lastValueFrom, of } from 'rxjs';
import { setupActiveLobby } from './ActiveLobby';
import Lobby from './Lobby';

test('null values are passed through from latest', () => {
    const latest = of(null);
    const activeLobby$ = setupActiveLobby(jest.fn(), latest);

    const subscribeSpy = jest.fn();
    activeLobby$.subscribe(subscribeSpy);

    expect(subscribeSpy).toBeCalledWith(null);
});

test('created Lobby instances have correct initial data', () => {
    const plainLobby = {
        id: 'lobby-id',
        joinCode: 'lobby-join-code',
        users: [],
        activeRound: null
    };
    const latest = of(plainLobby);
    const activeLobby$ = setupActiveLobby(jest.fn(), latest);

    const subscribeSpy = jest.fn();
    activeLobby$.subscribe(subscribeSpy);

    expect(subscribeSpy).toBeCalledWith(expect.objectContaining({
        id: plainLobby.id,
        joinCode: plainLobby.joinCode
    }));
});

test('no new Lobby instance is emit if the id has not changed', () => {
    const plainLobby = {
        id: 'lobby-id',
        joinCode: 'lobby-join-code',
        users: [],
        activeRound: null
    };
    const plainLobby_update = {
        id: 'lobby-id',
        joinCode: 'lobby-join-code',
        users: ['user-1'],
        activeRound: null
    };
    const latest = from([
        plainLobby,
        plainLobby_update
    ]);
    const activeLobby$ = setupActiveLobby(jest.fn(), latest);

    const subscribeSpy = jest.fn();
    activeLobby$.subscribe(subscribeSpy);

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
});

test('created Lobby instances have correct latest data', () => {
    const plainLobby = {
        id: 'lobby-id',
        joinCode: 'lobby-join-code',
        users: ['user-1'],
        activeRound: null
    };
    const latest = of(plainLobby);
    const activeLobby$ = setupActiveLobby(jest.fn(), latest);

    return firstValueFrom(activeLobby$)
        .then((lobby) => lobby ? firstValueFrom(lobby.users$) : [])
        .then((users) => {
            expect(users).toEqual(plainLobby.users);
        });
});

test('adjacent lobby data does not leak into previous Lobby instances', () => {
    const plainLobby1 = {
        id: 'lobby-id-1',
        joinCode: 'lobby-join-code',
        users: ['lobby-1-user'],
        activeRound: null
    };
    const plainLobby2 = {
        id: 'lobby-id-2',
        joinCode: 'lobby-join-code',
        users: [''],
        activeRound: null
    };
    const plainLobby2_update = {
        id: 'lobby-id-2',
        joinCode: 'lobby-join-code',
        users: ['lobby-2-user'],
        activeRound: null
    };
    const plainLobby3 = {
        id: 'lobby-id-3',
        joinCode: 'lobby-join-code',
        users: ['lobby-3-user'],
        activeRound: null
    };
    const latest = from([
        plainLobby1,
        plainLobby2,
        plainLobby2_update,
        plainLobby3
    ]);
    const activeLobby$ = setupActiveLobby(jest.fn(), latest);

    const subscribeSpy = jest.fn();
    activeLobby$.subscribe(subscribeSpy);

    const lobby2: Lobby = subscribeSpy.mock.calls[1][0];

    return lastValueFrom(lobby2.users$).then(users => {
        expect(users).toEqual(['lobby-2-user']);
    });
});

test('created Lobby instances are passed an exit handler to make a request', () => {
    const plainLobby = {
        id: 'lobby-id',
        joinCode: 'lobby-join-code',
        users: [],
        activeRound: null
    };
    const sendExitRequestSpy = jest.fn();
    const latest = of(plainLobby);
    const activeLobby$ = setupActiveLobby(sendExitRequestSpy, latest);

    const subscribeSpy = jest.fn();
    activeLobby$.subscribe(subscribeSpy);

    return firstValueFrom(activeLobby$).then(lobby => {
        lobby?.exit();
        expect(sendExitRequestSpy).toBeCalledWith(plainLobby.id);
    });
});
