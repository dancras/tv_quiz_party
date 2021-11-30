import { BehaviorSubject, Observable } from 'rxjs';

export type PlainLobby = {
    id: string,
    joinCode: string,
    users: string[]
};

class Lobby {
    id: string;
    joinCode: string;
    users$: Observable<string[]>;
    private _users$: BehaviorSubject<string[]>;
    private _exitHandler: () => void;

    constructor(exitHandler: () => void, initial: PlainLobby) {
        this.id = initial.id;
        this.joinCode = initial.joinCode;
        this.users$ = this._users$ = new BehaviorSubject(initial.users);
        this._exitHandler = exitHandler;
    }

    update(next: PlainLobby) {
        this._users$.next(next.users);
    }

    exit() {
        this._exitHandler();
    }

    startRound() {
    }
}

export default Lobby;
