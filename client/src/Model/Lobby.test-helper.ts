import { PlainLobby } from './Lobby';

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
