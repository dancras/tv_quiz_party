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

    constructor(initial: PlainLobby) {
        this.id = initial.id;
        this.joinCode = initial.joinCode;
        this.users$ = this._users$ = new BehaviorSubject(initial.users);
    }

    update(next: PlainLobby) {
        this._users$.next(next.users);
    }
}

export default Lobby;
