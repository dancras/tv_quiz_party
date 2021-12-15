import { mock, MockProxy } from 'jest-mock-extended';
import { firstValueFrom } from 'rxjs';
import { Animator, createTestDirector } from '../Lib/Animator';
import { Timer } from '../Lib/Timer';
import { QuestionTimings, setupQuestionTimer } from './QuestionTimer';
import { createCurrentQuestion } from './Round.test';

let mockAnimator: MockProxy<Animator>;
let mockTimer: MockProxy<Timer>;

beforeEach(() => {
    mockAnimator = mock<Animator>();
    mockTimer = mock<Timer>();
});

export function createTimings(step: number): QuestionTimings {
    return {
        hasStarted: step >= 1,
        displayAnswers: step >= 2,
        lockAnswers: step >= 3,
        revealAnswer: step >= 4,
        hasEnded: step >= 5
    };
}

function seconds(seconds: number) {
    return seconds * 1000;
}

function createQuestionWithTimes() {
    return createCurrentQuestion({
        startTime: 10000,
        questionStartTime: 10,
        questionDisplayTime: 20,
        answerLockTime: 30,
        answerRevealTime: 40,
        endTime: 50
    });
}

test('all properties are false before question has started', () => {
    const animate = createTestDirector(mockAnimator);

    const question = createQuestionWithTimes();

    const questionTimings$ = setupQuestionTimer(mockAnimator, mockTimer, question);

    mockTimer.now.mockReturnValue(question.startTime - 1);
    animate();

    return firstValueFrom(questionTimings$).then(timings => {
        expect(timings).toEqual(createTimings(0));
    });
});

test('hasStarted is true when we pass startTime', () => {
    const animate = createTestDirector(mockAnimator);

    const question = createQuestionWithTimes();

    const questionTimings$ = setupQuestionTimer(mockAnimator, mockTimer, question);

    mockTimer.now.mockReturnValue(question.startTime);
    animate();

    return firstValueFrom(questionTimings$).then(timings => {
        expect(timings).toEqual(createTimings(1));
    });
});

test('displayAnswers is true when we pass questionDisplayTime', () => {
    const animate = createTestDirector(mockAnimator);

    const question = createQuestionWithTimes();

    const questionTimings$ = setupQuestionTimer(mockAnimator, mockTimer, question);

    mockTimer.now.mockReturnValue(question.startTime + seconds(question.questionDisplayTime - question.questionStartTime));
    animate();

    return firstValueFrom(questionTimings$).then(timings => {
        expect(timings).toEqual(createTimings(2));
    });
});

test('lockAnswers is true when we pass answerLockTime', () => {
    const animate = createTestDirector(mockAnimator);

    const question = createQuestionWithTimes();

    const questionTimings$ = setupQuestionTimer(mockAnimator, mockTimer, question);

    mockTimer.now.mockReturnValue(question.startTime + seconds(question.answerLockTime - question.questionStartTime));
    animate();

    return firstValueFrom(questionTimings$).then(timings => {
        expect(timings).toEqual(createTimings(3));
    });
});

test('revealAnswer is true when we pass answerRevealTime', () => {
    const animate = createTestDirector(mockAnimator);

    const question = createQuestionWithTimes();

    const questionTimings$ = setupQuestionTimer(mockAnimator, mockTimer, question);

    mockTimer.now.mockReturnValue(question.startTime + seconds(question.answerRevealTime - question.questionStartTime));
    animate();

    return firstValueFrom(questionTimings$).then(timings => {
        expect(timings).toEqual(createTimings(4));
    });
});

test('hasEnded is true when we pass endTime', () => {
    const animate = createTestDirector(mockAnimator);

    const question = createQuestionWithTimes();

    const questionTimings$ = setupQuestionTimer(mockAnimator, mockTimer, question);

    mockTimer.now.mockReturnValue(question.startTime + seconds(question.endTime - question.questionStartTime));
    animate();

    return firstValueFrom(questionTimings$).then(timings => {
        expect(timings).toEqual(createTimings(5));
    });
});

test('updates are notified in successive animation frames', () => {
    const animate = createTestDirector(mockAnimator);
    const question = createQuestionWithTimes();

    mockTimer.now.mockReturnValue(question.startTime - 1);

    const questionTimings$ = setupQuestionTimer(mockAnimator, mockTimer, question);

    const timingsSpy = jest.fn();
    questionTimings$.subscribe(timingsSpy);

    expect(timingsSpy).toHaveBeenCalledWith(expect.objectContaining({
        hasStarted: false
    }));

    timingsSpy.mockClear();
    mockTimer.now.mockReturnValue(question.startTime);
    animate();

    expect(timingsSpy).toHaveBeenCalledWith(expect.objectContaining({
        hasStarted: true
    }));

    timingsSpy.mockClear();
    mockTimer.now.mockReturnValue(question.startTime + 1);
    animate();

    expect(timingsSpy).not.toHaveBeenCalled();
});

test('subscriptions to the same timings are shared', () => {
    const question = createQuestionWithTimes();

    mockTimer.now.mockReturnValue(question.startTime - 1);

    const questionTimings$ = setupQuestionTimer(mockAnimator, mockTimer, question);

    questionTimings$.subscribe(jest.fn());
    questionTimings$.subscribe(jest.fn());

    expect(mockAnimator.requestAnimationFrame).toHaveBeenCalledTimes(1);
});

test('animation is cancelled when last subscriber is removed', () => {
    const question = createQuestionWithTimes();

    mockTimer.now.mockReturnValue(question.startTime - 1);

    const questionTimings$ = setupQuestionTimer(mockAnimator, mockTimer, question);

    mockAnimator.requestAnimationFrame.mockReturnValue(4);

    const subscription = questionTimings$.subscribe(jest.fn());
    subscription.unsubscribe();

    expect(mockAnimator.cancelAnimationFrame).toHaveBeenCalledWith(4);
});
