import { Observable, BehaviorSubject } from 'rxjs';

import Lobby, { PlainLobby, PlainRound } from './Lobby';

export type LobbyUpdateFn = (lobby: PlainLobby | PlainRound) => void

export default class ActiveLobby {
    value$: Observable<Lobby | null>;
    private _value$: BehaviorSubject<Lobby | null>;

    constructor(subscribeToLobbyUpdates: (id: string, handler: LobbyUpdateFn) => void) {
        const activeLobby$ = new BehaviorSubject<Lobby | null>(null);

        activeLobby$.subscribe((lobby) => {
            if (lobby) {
                subscribeToLobbyUpdates(lobby.id, (lobbyUpdate) => {
                    if ((lobbyUpdate as PlainLobby).id) {
                        lobby.update(lobbyUpdate as PlainLobby);
                    } else {
                        lobby.updateRound(lobbyUpdate as PlainRound);
                    }
                });
            }
        });

        this.value$ = this._value$ = activeLobby$;
    }

    setValue(value: PlainLobby | null) {
        if (value) {
            const exitHandler = () => {
                fetch(`/api/lobby/${value.id}/exit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(response => {
                    this.setValue(null);
                });
            };
            this._value$.next(new Lobby(exitHandler, value));
        } else {
            this._value$.next(null);
        }
    }
}
