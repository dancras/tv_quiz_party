import { Observable, Subject } from 'rxjs';

import Lobby, { PlainLobby } from './Lobby';

export type LobbyUpdateFn = (lobby: PlainLobby) => void

export default class ActiveLobby {
    value$: Observable<Lobby | null>;
    private _value$: Subject<Lobby | null>;

    constructor(subscribeToLobbyUpdates: (id: string, handler: LobbyUpdateFn) => void) {
        const activeLobby$ = new Subject<Lobby | null>();

        activeLobby$.subscribe((lobby) => {
            if (lobby) {
                subscribeToLobbyUpdates(lobby.id, (lobbyUpdate) => {
                    lobby.update(lobbyUpdate);
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

    error(err: any) {
        this._value$.error(err);
    }
}
