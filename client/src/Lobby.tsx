import { BehaviorSubject, Observable } from 'rxjs';

export type PlainLobby = {
    id: string,
    joinCode: string,
    users: string[],
    activeRound: PlainRound | null
};

export type PlainRound = {
    questions: Question[]
};

export type Question = {
    videoID: string,
    startTime: number,
    questionDisplayTime: number,
    answerLockTime: number,
    answerRevealTime: number,
    endTime: number,
    answerText1: string,
    answerText2: string,
    answerText3: string,
    correctAnswer: string
};

export class Round {
    questions: Question[];

    constructor(initial: PlainRound) {
        this.questions = initial.questions;
    }
};

class Lobby {
    id: string;
    joinCode: string;
    users$: Observable<string[]>;
    private _users$: BehaviorSubject<string[]>;
    activeRound$: BehaviorSubject<Round | null>;
    private _exitHandler: () => void;

    constructor(exitHandler: () => void, initial: PlainLobby) {
        this.id = initial.id;
        this.joinCode = initial.joinCode;
        this.users$ = this._users$ = new BehaviorSubject(initial.users);
        this.activeRound$ = new BehaviorSubject(initial.activeRound ? new Round(initial.activeRound) : null);
        this._exitHandler = exitHandler;
    }

    update(next: PlainLobby) {
        this._users$.next(next.users);
        this.activeRound$.next(next.activeRound ? new Round(next.activeRound) : null);
    }

    updateRound(next: PlainRound | null) {
        this.activeRound$.next(next ? new Round(next) : null);
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
