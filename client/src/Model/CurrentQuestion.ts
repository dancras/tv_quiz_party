import { distinctUntilChanged, map, Observable } from 'rxjs';
import { ConstructorFunction } from '../Lib/Types';

export type CurrentQuestionCmd =
    { cmd: 'AnswerQuestion', data: string } |
    { cmd: 'LockQuestion' } |
    { cmd: 'EndQuestion' } |
    { cmd: 'EndFinalQuestion' };

export type Seconds = number;
export type MillisecondsEpoch = number;

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
    startTime: MillisecondsEpoch,
    hasEnded: boolean
}

export type PlainCurrentQuestion = PlainCurrentQuestionMetadata & Question;

export type CurrentQuestionMetadata = {
    i: number,
    startTime: MillisecondsEpoch,
    hasEnded$: Observable<boolean>
}

export type CurrentQuestionFactory = ConstructorFunction<typeof CurrentQuestion>;

class CurrentQuestion {
    private _sendCmd: (cmd: CurrentQuestionCmd) => void;
    i: number;
    timestampToStartVideo: MillisecondsEpoch;
    hasEndedOnServer$: Observable<boolean>;
    videoID: string;
    videoStartPosition: Seconds;
    videoShowingAnswerOptionsPosition: Seconds;
    videoAnsweringLockedPosition: Seconds;
    videoAnswerRevealedPostion: Seconds;
    videoEndPosition: Seconds;
    answerOptions: string[];
    correctAnswer: string;
    correctAnswerIndex: number;
    isFinalQuestion: boolean;

    constructor(
        sendCmd: (cmd: CurrentQuestionCmd) => void,
        allQuestionsData: Question[],
        initialMetaData: PlainCurrentQuestionMetadata,
        latestMetaData$: Observable<PlainCurrentQuestionMetadata>
    ) {
        const questionData = allQuestionsData[initialMetaData.i];
        this.i = initialMetaData.i;
        this.timestampToStartVideo = initialMetaData.startTime;
        this.videoID = questionData.videoID;
        this.videoStartPosition = questionData.questionStartTime;
        this.videoShowingAnswerOptionsPosition = questionData.questionDisplayTime;
        this.videoAnsweringLockedPosition = questionData.answerLockTime;
        this.videoAnswerRevealedPostion = questionData.answerRevealTime;
        this.videoEndPosition = questionData.endTime;
        this.answerOptions = [
            questionData.answerText1,
            questionData.answerText2,
            questionData.answerText3
        ];
        this.correctAnswer = questionData.correctAnswer;
        this.correctAnswerIndex = ['1', '2', '3'].indexOf(questionData.correctAnswer);
        this.hasEndedOnServer$ = latestMetaData$.pipe(
            map(x => x.hasEnded),
            distinctUntilChanged()
        );
        this.isFinalQuestion = allQuestionsData.length === this.i + 1;

        this._sendCmd = sendCmd;
    }

    answerQuestion(answerIndex: number) {
        this._sendCmd({ cmd: 'AnswerQuestion', data: (answerIndex + 1).toString() });
    }

    lockQuestion() {
        this._sendCmd({ cmd: 'LockQuestion' });
    }

    endQuestion() {
        this._sendCmd({ cmd: 'EndQuestion' });

        if (this.isFinalQuestion) {
            this._sendCmd({ cmd: 'EndFinalQuestion' });
        }
    }
}

export default CurrentQuestion;
