import { BehaviorSubject, from, of } from 'rxjs';
import Lobby, { LobbyCmd, PlainLobby } from './Lobby';
import { createPlainRound } from './Round.test';

export function createPlainLobby(fieldsUnderTest?: Partial<PlainLobby>): PlainLobby {
    return Object.assign({
        id: '',
        hostID: '',
        joinCode: '',
        users: [],
        activeRound: null,
        isHost: false,
        isPresenter: false
    }, fieldsUnderTest);
}

test('it exposes fields from initialData', () => {
    const lobby = new Lobby(
        jest.fn(),
        jest.fn(),
        createPlainLobby({
            id: 'lobby-id',
            joinCode: 'lobby-join-code',
            isHost: true,
            isPresenter: false
        }),
        of(createPlainLobby())
    );

    expect(lobby.id).toEqual('lobby-id');
    expect(lobby.joinCode).toEqual('lobby-join-code');
    expect(lobby.isHost).toEqual(true);
    expect(lobby.isPresenter).toEqual(false);
});

test('startRound sends correct command', () => {
    const sendCmd = jest.fn();
    const lobby = new Lobby(
        jest.fn(),
        sendCmd,
        createPlainLobby(),
        of(createPlainLobby())
    );

    lobby.startRound();

    expect(sendCmd).toBeCalledWith({ cmd: 'StartRound' } as LobbyCmd);
});

test('exit sends correct command', () => {
    const sendCmd = jest.fn();
    const lobby = new Lobby(
        jest.fn(),
        sendCmd,
        createPlainLobby(),
        of(createPlainLobby())
    );

    lobby.exit();

    expect(sendCmd).toBeCalledWith({ cmd: 'ExitLobby' } as LobbyCmd);
});

test('users$ is derived from latestData', () => {
    const lobby = new Lobby(
        jest.fn(),
        jest.fn(),
        createPlainLobby(),
        from([
            createPlainLobby({
                users: []
            }),
            createPlainLobby({
                users: ['lobby-user-1'],
            })
        ])
    );

    // Consume all the values to test that only the latest
    lobby.users$.subscribe(() => {});

    const subscribeSpy = jest.fn();
    lobby.users$.subscribe(subscribeSpy);

    expect(subscribeSpy).toHaveBeenNthCalledWith(1, ['lobby-user-1']);
});

test('activeRound$ uses latestData to construct Round', () => {
    const expectedRound = {};

    const expectedPlainRound = createPlainRound();

    const roundFactory = jest.fn();
    const lobby = new Lobby(
        roundFactory,
        jest.fn(),
        createPlainLobby(),
        of(createPlainLobby({
            activeRound: expectedPlainRound
        }))
    );

    roundFactory.mockReturnValue(expectedRound);

    const subscribeSpy = jest.fn();
    lobby.activeRound$.subscribe(subscribeSpy);
    expect(subscribeSpy).toHaveBeenCalledWith(expectedRound);

    const constructorSubscribeSpy = jest.fn();
    roundFactory.mock.calls[0][2].subscribe(constructorSubscribeSpy);

    expect(roundFactory.mock.calls[0][1]).toBe(expectedPlainRound);
    expect(constructorSubscribeSpy).toHaveBeenCalledWith(expectedPlainRound);
});

test('activeRound$ does not create a new round for every update', () => {
    const latestData$ = new BehaviorSubject(createPlainLobby({
        activeRound: createPlainRound()
    }));

    const roundFactory = jest.fn();

    const lobby = new Lobby(
        roundFactory,
        jest.fn(),
        createPlainLobby(),
        latestData$
    );

    lobby.activeRound$.subscribe(jest.fn());

    latestData$.next(createPlainLobby({
        activeRound: createPlainRound()
    }));

    expect(roundFactory).toHaveBeenCalledTimes(1);
});

test('activeRound$ does not leak details between rounds', () => {
    const latestData$ = new BehaviorSubject(createPlainLobby({
        activeRound: createPlainRound({
            isHost: false
        })
    }));

    const roundFactory = jest.fn();

    const lobby = new Lobby(
        roundFactory,
        jest.fn(),
        createPlainLobby(),
        latestData$
    );

    lobby.activeRound$.subscribe(jest.fn());

    const actualLatestData$ = roundFactory.mock.calls[0][2];

    const subscribeSpy = jest.fn();

    actualLatestData$.subscribe(subscribeSpy);

    latestData$.next(createPlainLobby({
        activeRound: null
    }));

    latestData$.next(createPlainLobby({
        activeRound: createPlainRound({
            isHost: true
        })
    }));

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    expect(subscribeSpy.mock.calls[0][0].isHost).toEqual(false);

    const nextLatestData$ = roundFactory.mock.calls[1][2];
    const nextSpy = jest.fn();

    nextLatestData$.subscribe(nextSpy);

    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(nextSpy.mock.calls[0][0].isHost).toEqual(true);
});
