import { of, BehaviorSubject } from 'rxjs';
import CurrentQuestion, { PlainCurrentQuestion, PlainCurrentQuestionMetadata, Question } from './CurrentQuestion';

export function createQuestion(fieldsUnderTest?: Partial<Question>): Question {
    return Object.assign({
        videoID: '',
        questionStartTime: 0,
        questionDisplayTime: 0,
        answerLockTime: 0,
        answerRevealTime: 0,
        endTime: 0,
        answerText1: '',
        answerText2: '',
        answerText3: '',
        correctAnswer: ''
    }, fieldsUnderTest);
}

export function createPlainCurrentQuestionMetadata(fieldsUnderTest?: Partial<PlainCurrentQuestionMetadata>): PlainCurrentQuestionMetadata {
    return Object.assign({
        i: 0,
        startTime: 0,
        hasEnded: false,
    }, fieldsUnderTest);
}

export function createPlainCurrentQuestion(fieldsUnderTest?: Partial<PlainCurrentQuestionMetadata>): PlainCurrentQuestion {
    return Object.assign(
        createQuestion(),
        createPlainCurrentQuestionMetadata(),
        fieldsUnderTest
    );
}

export function createCurrentQuestion(fieldsUnderTest?: Partial<PlainCurrentQuestion>): CurrentQuestion {
    const plainData = Object.assign(
        createQuestion(),
        createPlainCurrentQuestionMetadata(),
        fieldsUnderTest
    );
    const questions = [];
    questions[plainData.i] = plainData;

    return new CurrentQuestion(jest.fn(), questions, plainData, new BehaviorSubject(plainData));
}

test('isFinalQuestion is true when question index is last in list', () => {
    const penultimateQuestion = new CurrentQuestion(
        jest.fn(),
        [createQuestion(), createQuestion()],
        createPlainCurrentQuestionMetadata({
            i: 0
        }),
        of(createPlainCurrentQuestionMetadata())
    );

    const finalQuestion = new CurrentQuestion(
        jest.fn(),
        [createQuestion(), createQuestion()],
        createPlainCurrentQuestionMetadata({
            i: 1
        }),
        of(createPlainCurrentQuestionMetadata())
    );

    expect(penultimateQuestion.isFinalQuestion).toEqual(false);
    expect(finalQuestion.isFinalQuestion).toEqual(true);
});

test('hasEndedOnServer$ takes latest unique value from latestMetaData$', () => {
    const latestMetaData$ = new BehaviorSubject(createPlainCurrentQuestionMetadata({
        hasEnded: false
    }));
    const currentQuestion = new CurrentQuestion(
        jest.fn(),
        [createQuestion()],
        createPlainCurrentQuestionMetadata({
            i: 0
        }),
        latestMetaData$
    );

    const subscribeSpy = jest.fn();
    currentQuestion.hasEndedOnServer$.subscribe(subscribeSpy);

    expect(subscribeSpy).toHaveBeenCalledWith(false);

    latestMetaData$.next(createPlainCurrentQuestionMetadata({
        hasEnded: false
    }));

    latestMetaData$.next(createPlainCurrentQuestionMetadata({
        hasEnded: true
    }));

    expect(subscribeSpy).toHaveBeenLastCalledWith(true);
    expect(subscribeSpy).toHaveBeenCalledTimes(2);

    latestMetaData$.next(createPlainCurrentQuestionMetadata({
        hasEnded: false
    }));

    expect(subscribeSpy).toHaveBeenLastCalledWith(false);
    expect(subscribeSpy).toHaveBeenCalledTimes(3);
});

test('endQuestion() sends EndFinalQuestion command when it is the final question', () => {
    const cmdBusSpy = jest.fn();

    const penultimateQuestion = new CurrentQuestion(
        cmdBusSpy,
        [createQuestion(), createQuestion()],
        createPlainCurrentQuestionMetadata({
            i: 0
        }),
        of(createPlainCurrentQuestionMetadata())
    );

    const finalQuestion = new CurrentQuestion(
        cmdBusSpy,
        [createQuestion(), createQuestion()],
        createPlainCurrentQuestionMetadata({
            i: 1
        }),
        of(createPlainCurrentQuestionMetadata())
    );

    penultimateQuestion.endQuestion();
    expect(cmdBusSpy).not.toHaveBeenCalledWith({
        cmd: 'EndFinalQuestion'
    });

    finalQuestion.endQuestion();
    expect(cmdBusSpy).toHaveBeenCalledWith({
        cmd: 'EndFinalQuestion'
    });

    expect(penultimateQuestion.isFinalQuestion).toEqual(false);
    expect(finalQuestion.isFinalQuestion).toEqual(true);
});
