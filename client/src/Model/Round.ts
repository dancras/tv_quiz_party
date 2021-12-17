import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, takeWhile } from 'rxjs/operators';
import { PartiallyApplied1, ConstructorFunction } from '../Lib/Types';
import CurrentQuestion, { Question, PlainCurrentQuestionMetadata, CurrentQuestionCmd, CurrentQuestionFactory } from './CurrentQuestion';

export type RoundCmd = CurrentQuestionCmd |
    { cmd: 'StartNextQuestion' };

export type PlainRound = {
    questions: Question[],
    currentQuestion: PlainCurrentQuestionMetadata | null,
    isHost: boolean
};

export type RoundFactory = PartiallyApplied1<ConstructorFunction<typeof Round>>;

export class Round {
    private _sendCmd: (cmd: RoundCmd) => void;
    questions: Question[];
    currentQuestion$: Observable<(CurrentQuestion | null)>;
    canStartNextQuestion$: Observable<boolean>;

    constructor(
        currentQuestionFactory: CurrentQuestionFactory,
        sendCmd: (cmd: RoundCmd) => void,
        initialData: PlainRound,
        latestData: Observable<PlainRound>
    ) {
        this._sendCmd = sendCmd;
        this.questions = initialData.questions;

        function createCurrentQuestion(initialMetaData: PlainCurrentQuestionMetadata): CurrentQuestion {
            return currentQuestionFactory(sendCmd, initialData.questions, initialMetaData, latestData.pipe(
                map(x => x.currentQuestion),
                filter((x): x is PlainCurrentQuestionMetadata => !!x),
                takeWhile(y => y.i === initialMetaData.i)
            ));
        }

        this.currentQuestion$ = latestData.pipe(
            map(x => x.currentQuestion),
            distinctUntilChanged((previous, next) => previous?.i === next?.i),
            map(x => x ? createCurrentQuestion(x) : null),
            shareReplay(1)
        );

        this.canStartNextQuestion$ = latestData.pipe(
            map(x => initialData.isHost && (!x.currentQuestion || x.currentQuestion.hasEnded))
        );
    }

    startNextQuestion() {
        this._sendCmd({ cmd: 'StartNextQuestion' });
    }
};

export default Round;
