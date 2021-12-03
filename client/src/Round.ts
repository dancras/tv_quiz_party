import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export type PlainRound = {
    questions: Question[],
    currentQuestion: CurrentQuestion | null
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

type CurrentQuestion = {
    i: number,
    startTime: number,
    hasEnded: boolean
}

export interface RoundConstructor {
    new (initialData: PlainRound, latestData: Observable<PlainRound>): Round;
}

export class Round {
    questions: Question[];
    currentQuestion$: Observable<CurrentQuestion | null>;

    constructor(initialData: PlainRound, latestData: Observable<PlainRound>) {
        this.questions = initialData.questions;
        this.currentQuestion$ = latestData.pipe(
            map(x => x.currentQuestion),
            shareReplay(1)
        );
    }
};

export default Round;
