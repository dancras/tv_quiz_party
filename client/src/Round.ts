import { Observable } from 'rxjs';
import { distinctUntilChanged, map, shareReplay } from 'rxjs/operators';

export type RoundCmd =
    { cmd: 'StartNextQuestion' } |
    { cmd: 'AnswerQuestion', data: string } |
    { cmd: 'EndQuestion' };

export type PlainRound = {
    questions: Question[],
    currentQuestion: PlainCurrentQuestionMetadata | null,
    isHost: boolean
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

export type PlainCurrentQuestionMetadata = {
    i: number,
    startTime: Milliseconds,
    hasEnded: boolean
}

export type PlainCurrentQuestion = PlainCurrentQuestionMetadata & Question;

export type CurrentQuestionMetadata = {
    i: number,
    startTime: Milliseconds,
    hasEnded$: Observable<boolean>
}

export type CurrentQuestion = CurrentQuestionMetadata & Question;

export class Round {
    private _sendCmd: (cmd: RoundCmd) => void;
    questions: Question[];
    currentQuestion$: Observable<(CurrentQuestion | null)>;
    canStartNextQuestion$: Observable<boolean>;

    constructor(
        sendCmd: (cmd: RoundCmd) => void,
        initialData: PlainRound,
        latestData: Observable<PlainRound>
    ) {
        this._sendCmd = sendCmd;
        this.questions = initialData.questions;

        const hasCurrentQuestionEnded$ = latestData.pipe(
            map(x => x.currentQuestion ? x.currentQuestion.hasEnded : true)
        );
        this.currentQuestion$ = latestData.pipe(
            map(x => x.currentQuestion ?
                Object.assign({}, x.currentQuestion, initialData.questions[x.currentQuestion.i], {
                    hasEnded$: hasCurrentQuestionEnded$
                }) :
                null
            ),
            distinctUntilChanged((previous, next) => previous?.i === next?.i),
            shareReplay(1)
        );

        this.canStartNextQuestion$ = latestData.pipe(
            map(x => initialData.isHost && (!x.currentQuestion || x.currentQuestion.hasEnded))
        );
    }

    startNextQuestion() {
        this._sendCmd({ cmd: 'StartNextQuestion' });
    }

    answerQuestion(answer: string) {
        this._sendCmd({ cmd: 'AnswerQuestion', data: answer });
    }

    endQuestion() {
        this._sendCmd({ cmd: 'EndQuestion' });
    }
};

export default Round;
