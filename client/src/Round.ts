import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export type RoundCmd =
    { cmd: 'StartNextQuestion' }

export type PlainRound = {
    questions: Question[],
    currentQuestion: CurrentQuestionMetadata | null
};

export type Seconds = number;
export type Milliseconds = number;

export type Question = {
    videoID: string,
    questionStartTime: Seconds,
    questionDisplayTime: Seconds,
    answerLockTime: Seconds,
    answerRevealTime: Seconds,
    endTime: Seconds,
    answerText1: string,
    answerText2: string,
    answerText3: string,
    correctAnswer: string
};

export type CurrentQuestionMetadata = {
    i: number,
    startTime: Milliseconds,
    hasEnded: boolean
}

export class Round {
    private _sendCmd: (cmd: RoundCmd) => void;
    questions: Question[];
    currentQuestion$: Observable<(CurrentQuestionMetadata & Question | null)>;

    constructor(
        sendCmd: (cmd: RoundCmd) => void,
        initialData: PlainRound,
        latestData: Observable<PlainRound>
    ) {
        this._sendCmd = sendCmd;
        this.questions = initialData.questions;
        this.currentQuestion$ = latestData.pipe(
            map(x => x.currentQuestion ?
                Object.assign({}, x.currentQuestion, initialData.questions[x.currentQuestion.i]) :
                null
            ),
            shareReplay(1)
        );
    }

    startNextQuestion() {
        this._sendCmd({ cmd: 'StartNextQuestion' });
    }

    answerQuestion(answer: string) {
    }
};

export default Round;
