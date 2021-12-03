import { Observable } from 'rxjs';
import { filter, map, shareReplay } from 'rxjs/operators';

import Round, { PlainRound, RoundConstructor } from './Round';

export type PlainLobby = {
    id: string,
    joinCode: string,
    users: string[],
    activeRound: PlainRound | null
};

export class Lobby {
    id: string;
    joinCode: string;
    users$: Observable<string[]>;
    activeRound$: Observable<Round | null>;
    private _exitHandler: () => void;

    constructor(LobbyRound: RoundConstructor, exitHandler: () => void, initial: PlainLobby, latest: Observable<PlainLobby>) {
        this.id = initial.id;
        this.joinCode = initial.joinCode;
        this.users$ = latest.pipe(
            map(x => x.users),
            shareReplay(1)
        );
        const latestPlainRound = latest.pipe(
            map(x => x.activeRound),
            filter((x): x is PlainRound => !!x)
        );
        this.activeRound$ = latest.pipe(
            map(x => x.activeRound ? new LobbyRound(x.activeRound, latestPlainRound) : null)
        );
        this._exitHandler = exitHandler;
    }

    exit() {
        this._exitHandler();
    }

    startRound() {
        fetch(`/api/lobby/${this.id}/start_round`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

export default Lobby;
