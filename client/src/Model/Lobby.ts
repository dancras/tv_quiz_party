import { Observable } from 'rxjs';
import { map, shareReplay, skipWhile, takeWhile } from 'rxjs/operators';

import Round, { PlainRound, RoundCmd, RoundFactory } from './Round';

export type LobbyCmd =
    RoundCmd |
    { cmd: 'ExitLobby' } |
    { cmd: 'StartRound' };

export type PlainLobby = {
    id: string,
    hostID: string,
    joinCode: string,
    users: string[],
    activeRound: PlainRound | null,
    isHost: boolean,
    isPresenter: boolean
};

export class Lobby {
    id: string;
    joinCode: string;
    isHost: boolean;
    isPresenter: boolean;
    users$: Observable<string[]>;
    activeRound$: Observable<Round | null>;
    private _sendCmd: (cmd: LobbyCmd) => void;

    constructor(
        roundFactory: RoundFactory,
        sendCmd: (cmd: LobbyCmd) => void,
        initial: PlainLobby,
        latest: Observable<PlainLobby>
    ) {
        this._sendCmd = sendCmd;
        this.id = initial.id;
        this.joinCode = initial.joinCode;
        this.isHost = initial.isHost;
        this.isPresenter = initial.isPresenter;
        this.users$ = latest.pipe(
            map(x => x.users),
            shareReplay(1)
        );
        const latestPlainRound = latest.pipe(
            map(x => x.activeRound),
            skipWhile(x => !x),
            takeWhile((x): x is PlainRound => !!x)
        );
        this.activeRound$ = latest.pipe(
            map(x => x.activeRound ? roundFactory(sendCmd, x.activeRound, latestPlainRound) : null)
        );
    }

    exit() {
        this._sendCmd({ cmd: 'ExitLobby' });
    }

    startRound() {
        this._sendCmd({ cmd: 'StartRound' });
    }
}

export default Lobby;
