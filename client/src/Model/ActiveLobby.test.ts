import { mock } from 'jest-mock-extended';
import { firstValueFrom, from, lastValueFrom, of } from 'rxjs';
import { setupActiveLobby } from './ActiveLobby';
import { createPlainCurrentQuestionMetadata, createQuestion } from './CurrentQuestion.test';
import CurrentQuestionLifecycle from './CurrentQuestionLifecycle';
import Lobby, { LobbyCmd } from './Lobby';

import { createPlainLobby } from './Lobby.test';
import { createPlainRound } from './Round.test';

test('null values are passed through from latest', () => {
    const latest = of(null);
    const activeLobby$ = setupActiveLobby(mock<CurrentQuestionLifecycle>(), jest.fn(), latest);

    const subscribeSpy = jest.fn();
    activeLobby$.subscribe(subscribeSpy);

    expect(subscribeSpy).toBeCalledWith(null);
});

test('created Lobby instances have correct initial data', () => {
    const plainLobby = createPlainLobby({
        id: 'lobby-id',
        joinCode: 'lobby-join-code'
    });
    const latest = of(plainLobby);
    const activeLobby$ = setupActiveLobby(mock<CurrentQuestionLifecycle>(), jest.fn(), latest);

    const subscribeSpy = jest.fn();
    activeLobby$.subscribe(subscribeSpy);

    expect(subscribeSpy).toBeCalledWith(expect.objectContaining({
        id: plainLobby.id,
        joinCode: plainLobby.joinCode
    }));
});

test('no new Lobby instance is emit if the id has not changed', () => {
    const plainLobby = createPlainLobby({
        id: 'lobby-id',
        users: [],
    });
    const plainLobby_update = createPlainLobby({
        id: 'lobby-id',
        users: [],
    });
    const latest = from([
        plainLobby,
        plainLobby_update
    ]);
    const activeLobby$ = setupActiveLobby(mock<CurrentQuestionLifecycle>(), jest.fn(), latest);

    const subscribeSpy = jest.fn();
    activeLobby$.subscribe(subscribeSpy);

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
});

test('created Lobby instances have correct latest data', () => {
    const plainLobby = createPlainLobby({
        id: 'lobby-id',
        users: ['user-1'],
    });
    const latest = of(plainLobby);
    const activeLobby$ = setupActiveLobby(mock<CurrentQuestionLifecycle>(), jest.fn(), latest);

    return firstValueFrom(activeLobby$)
        .then((lobby) => lobby ? firstValueFrom(lobby.users$) : [])
        .then((users) => {
            expect(users).toEqual(plainLobby.users);
        });
});

test('adjacent lobby data does not leak into previous Lobby instances', () => {
    const plainLobby1 = createPlainLobby({
        id: 'lobby-id-1',
        users: ['lobby-1-user'],
    });
    const plainLobby2 = createPlainLobby({
        id: 'lobby-id-2',
        users: [''],
    });
    const plainLobby2_update = createPlainLobby({
        id: 'lobby-id-2',
        users: ['lobby-2-user'],
    });
    const plainLobby3 = createPlainLobby({
        id: 'lobby-id-3',
        users: ['lobby-3-user'],
    });
    const latest = from([
        plainLobby1,
        plainLobby2,
        plainLobby2_update,
        plainLobby3
    ]);
    const activeLobby$ = setupActiveLobby(mock<CurrentQuestionLifecycle>(), jest.fn(), latest);

    const subscribeSpy = jest.fn();
    activeLobby$.subscribe(subscribeSpy);

    const lobby2: Lobby = subscribeSpy.mock.calls[1][0];

    return lastValueFrom(lobby2.users$).then(users => {
        expect(users).toEqual(['lobby-2-user']);
    });
});

test('created Lobby instances are passed command bus', () => {
    const plainLobby = createPlainLobby();
    const sendCmdSpy = jest.fn();
    const latest = of(plainLobby);
    const activeLobby$ = setupActiveLobby(mock<CurrentQuestionLifecycle>(), sendCmdSpy, latest);

    return firstValueFrom(activeLobby$).then(lobby => {
        lobby?.exit();
        expect(sendCmdSpy).toBeCalledWith({ cmd: 'ExitLobby' } as LobbyCmd);
    });
});

test('created CurrentQuestion instances are passed to CurrentQuestionLifecycle', () => {
    const mockLifecycle = mock<CurrentQuestionLifecycle>();
    const plainLobby = createPlainLobby({
        activeRound: createPlainRound({
            questions: [createQuestion()],
            currentQuestion: createPlainCurrentQuestionMetadata({
                i: 0
            })
        })
    });

    const activeLobby$ = setupActiveLobby(mockLifecycle, jest.fn(), of(plainLobby));

    return firstValueFrom(activeLobby$).then(lobby => {
        return lobby ? firstValueFrom(lobby.activeRound$) : null;
    }).then(round => {
        return round ? firstValueFrom(round.currentQuestion$) : null;
    }).then(question => {
        expect(mockLifecycle.setupCurrentQuestion).toHaveBeenCalledWith(question);
    });
});

test('multiple subscriptions receive the same Lobby instance', () => {
    const plainLobby = createPlainLobby();
    const activeLobby$ = setupActiveLobby(mock<CurrentQuestionLifecycle>(), jest.fn(), of(plainLobby));

    const subscriber1 = jest.fn();
    const subscriber2 = jest.fn();

    activeLobby$.subscribe(subscriber1);
    activeLobby$.subscribe(subscriber2);

    expect(subscriber1.mock.calls[0][0]).toBe(subscriber2.mock.calls[0][0]);
});
