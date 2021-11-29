import { Observable } from 'rxjs';
import { createSignal } from '@react-rxjs/utils';

import Lobby, { PlainLobby } from './Lobby';

export type LobbyUpdateFn = (lobby: PlainLobby) => void

export default class ActiveLobby {
    value$: Observable<Lobby | null>;

    constructor(subscribeToLobbyUpdates: (id: string, handler: LobbyUpdateFn) => void) {
        const [activeLobby$, setActiveLobby] = createSignal<Lobby | null>();

        activeLobby$.subscribe((lobby) => {
            if (lobby) {
                subscribeToLobbyUpdates(lobby.id, (lobbyUpdate) => {
                    lobby.update(lobbyUpdate);
                });
            }
        });

        this.value$ = activeLobby$;
        this._setValue = setActiveLobby;
    }

    setValue(value: PlainLobby | null) {
        this._setValue(value && new Lobby(value));
    }

    private _setValue(value: Lobby | null) {
    }
}
