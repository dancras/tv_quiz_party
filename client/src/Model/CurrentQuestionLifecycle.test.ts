import { mock } from 'jest-mock-extended';
import { BehaviorSubject, Observable } from 'rxjs';
import CurrentQuestion from './CurrentQuestion';
import CurrentQuestionLifecycle from './CurrentQuestionLifecycle';
import { QuestionTimings } from './QuestionTimer';
import { createTimings } from './QuestionTimer.test';

let mockSetupQuestionTimer: jest.MockedFunction<(question: CurrentQuestion) => Observable<QuestionTimings>>;

beforeEach(() => {
    mockSetupQuestionTimer = jest.fn();
});

function defer() {
    return new Promise(resolve => {
        setTimeout(resolve, 0);
    });
}

test('it locks the current question when lockAnswers timing is reached', () => {
    const question = mock<CurrentQuestion>();
    const lifecycle = new CurrentQuestionLifecycle(mockSetupQuestionTimer);
    const timings$ = new BehaviorSubject(createTimings(2));

    mockSetupQuestionTimer.mockReturnValue(timings$);
    question.hasEndedOnServer$ = new BehaviorSubject(false);

    lifecycle.setupCurrentQuestion(question);

    return defer().then(() => {
        expect(question.lockQuestion).not.toHaveBeenCalled();

        timings$.next(createTimings(3));

        return defer();
    }).then(() => {
        expect(question.lockQuestion).toHaveBeenCalled();
    });
});

test('it does not lock the current question if it has already ended on server', () => {
    const question = mock<CurrentQuestion>();
    const lifecycle = new CurrentQuestionLifecycle(mockSetupQuestionTimer);
    const timings$ = new BehaviorSubject(createTimings(3));

    mockSetupQuestionTimer.mockReturnValue(timings$);
    question.hasEndedOnServer$ = new BehaviorSubject(true);

    lifecycle.setupCurrentQuestion(question);

    return defer().then(() => {
        expect(question.lockQuestion).not.toHaveBeenCalled();
    });
});

test('it ends the current question when the hasEnded timing is reached', () => {
    const question = mock<CurrentQuestion>();
    const lifecycle = new CurrentQuestionLifecycle(mockSetupQuestionTimer);
    const timings$ = new BehaviorSubject(createTimings(4));

    mockSetupQuestionTimer.mockReturnValue(timings$);
    question.hasEndedOnServer$ = new BehaviorSubject(true);

    lifecycle.setupCurrentQuestion(question);

    return defer().then(() => {
        expect(question.endQuestion).not.toHaveBeenCalled();

        timings$.next(createTimings(5));

        return defer();
    }).then(() => {
        expect(question.endQuestion).toHaveBeenCalled();
    });

});

test('it ignores any further updates when the next question is setup', () => {
    const question = mock<CurrentQuestion>();
    const nextQuestion = mock<CurrentQuestion>();
    const lifecycle = new CurrentQuestionLifecycle(mockSetupQuestionTimer);
    const timings$ = new BehaviorSubject(createTimings(4));

    question.hasEndedOnServer$ = new BehaviorSubject(false);

    mockSetupQuestionTimer.mockReturnValueOnce(timings$);
    lifecycle.setupCurrentQuestion(question);

    mockSetupQuestionTimer.mockReturnValueOnce(new BehaviorSubject(createTimings(5)));
    lifecycle.setupCurrentQuestion(nextQuestion);

    timings$.next(createTimings(5));

    expect(question.endQuestion).not.toHaveBeenCalled();
});
