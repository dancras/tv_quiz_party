import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export type RoundCmd =
    { cmd: 'StartNextQuestion' }

export type PlainRound = {
    questions: Question[],
    currentQuestion: CurrentQuestionMetadata | null
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

export type CurrentQuestionMetadata = {
    i: number,
    startTime: number,
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
                Object.assign({}, x.currentQuestion, initialData.questions[x.currentQuestion.i], {
                    startTime: x.currentQuestion.startTime + initialData.questions[x.currentQuestion.i].startTime,
                    questionDisplayTime: x.currentQuestion.startTime + initialData.questions[x.currentQuestion.i].questionDisplayTime,
                    answerLockTime: x.currentQuestion.startTime + initialData.questions[x.currentQuestion.i].answerLockTime,
                    answerRevealTime: x.currentQuestion.startTime + initialData.questions[x.currentQuestion.i].answerRevealTime,
                    endTime: x.currentQuestion.startTime + initialData.questions[x.currentQuestion.i].endTime
                }) :
                null
            ),
            shareReplay(1)
        );
    }

    startNextQuestion() {
        this._sendCmd({ cmd: 'StartNextQuestion' });
    }
};

export default Round;
