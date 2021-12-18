import { asyncScheduler, Observable, observeOn, Subscription, withLatestFrom } from 'rxjs';
import CurrentQuestion from './CurrentQuestion';
import { QuestionTimings } from './QuestionTimer';

class CurrentQuestionLifecycle {

    private _setupQuestionTimer: (question: CurrentQuestion) => Observable<QuestionTimings>;
    private _subscription: Subscription | null;

    constructor(
        setupQuestionTimer: (question: CurrentQuestion) => Observable<QuestionTimings>
    ) {
        this._setupQuestionTimer = setupQuestionTimer;
        this._subscription = null;
    }

    setupCurrentQuestion(question: CurrentQuestion) {
        this._subscription?.unsubscribe();

        const timings$ = this._setupQuestionTimer(question);

        this._subscription = timings$.pipe(
            withLatestFrom(question.hasEndedOnServer$),

            // This subscription causes stateful side effects and so we need to schedule it
            // for a future frame so that it does not happen during a render loop
            observeOn(asyncScheduler)
        ).subscribe(([timings, hasEndedOnServer]) => {
            if (timings.lockAnswers && !hasEndedOnServer) {
                question.lockQuestion();
            }

            if (timings.hasEnded) {
                question.endQuestion();
            }
        });
    }
}

export default CurrentQuestionLifecycle;
