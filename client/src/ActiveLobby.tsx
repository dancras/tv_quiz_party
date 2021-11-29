import { Observable } from 'rxjs';
import { createSignal } from '@react-rxjs/utils';

import Lobby, { PlainLobby } from './Lobby';

export default class ActiveLobby {
    value$: Observable<Lobby | null>;

    constructor() {
        const [activeLobby$, setActiveLobby] = createSignal<Lobby | null>();

        this.value$ = activeLobby$;
        this._setValue = setActiveLobby;
    }

    setValue(value: PlainLobby | null) {
        this._setValue(value && new Lobby(value));
    }

    private _setValue(value: Lobby | null) {
    }
}
