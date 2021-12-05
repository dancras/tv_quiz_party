import { from, of } from 'rxjs';
import Lobby from './Lobby';

test('it exposes id and joinCode from initialData', () => {
    const lobby = new Lobby(
        jest.fn(),
        jest.fn(),
        () => {},
        {
            id: 'lobby-id',
            joinCode: 'lobby-join-code',
            users: [],
            activeRound: null
        },
        of({
            id: 'lobby-id',
            joinCode: 'lobby-join-code',
            users: [],
            activeRound: null
        })
    );

    expect(lobby.id).toEqual('lobby-id');
    expect(lobby.joinCode).toEqual('lobby-join-code');
});

test('users$ is derived from latestData', () => {
    const lobby = new Lobby(
        jest.fn(),
        jest.fn(),
        () => {},
        {
            id: 'lobby-id',
            joinCode: 'lobby-join-code',
            users: [],
            activeRound: null
        },
        from([
            {
                id: 'lobby-id',
                joinCode: 'lobby-join-code',
                users: [],
                activeRound: null
            },
            {
                id: 'lobby-id',
                joinCode: 'lobby-join-code',
                users: ['lobby-user-1'],
                activeRound: null
            }
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

    const expectedPlainRound = {
        questions: [],
        currentQuestion: null
    };

    const RoundConstructor = jest.fn();
    const lobby = new Lobby(
        RoundConstructor,
        jest.fn(),
        () => {},
        {
            id: 'lobby-id',
            joinCode: 'lobby-join-code',
            users: [],
            activeRound: null
        },
        of({
            id: 'lobby-id',
            joinCode: 'lobby-join-code',
            users: [],
            activeRound: expectedPlainRound
        })
    );

    RoundConstructor.mockReturnValue(expectedRound);

    const subscribeSpy = jest.fn();
    lobby.activeRound$.subscribe(subscribeSpy);
    expect(subscribeSpy).toHaveBeenCalledWith(expectedRound);

    const constructorSubscribeSpy = jest.fn();
    RoundConstructor.mock.calls[0][2].subscribe(constructorSubscribeSpy);

    expect(RoundConstructor.mock.calls[0][1]).toBe(expectedPlainRound);
    expect(constructorSubscribeSpy).toHaveBeenCalledWith(expectedPlainRound);
});
