import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, takeWhile } from 'rxjs/operators';

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

        function createCurrentQuestion(data: PlainCurrentQuestionMetadata): CurrentQuestion {
            return Object.assign({}, data, initialData.questions[data.i], {
                hasEnded$: latestData.pipe(
                    map(x => x.currentQuestion),
                    filter((x): x is PlainCurrentQuestionMetadata => !!x),
                    takeWhile(y => y.i === data.i),
                    map(x => x.hasEnded)
                )
            });
        }

        this.currentQuestion$ = latestData.pipe(
            map(x => x.currentQuestion ? createCurrentQuestion(x.currentQuestion) : null),
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
