import { mock } from 'jest-mock-extended';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import CurrentQuestion, { CurrentQuestionFactory } from './CurrentQuestion';
import { createQuestion, createPlainCurrentQuestion, createPlainCurrentQuestionMetadata } from './CurrentQuestion.test';
import Round, { PlainRound, RoundCmd } from './Round';

const EMPTY_PLAIN_ROUND: PlainRound = {
    questions: [],
    currentQuestion: null,
    isHost: false
};

let currentQuestionFactory: jest.MockedFunction<CurrentQuestionFactory>;
let sendCommand: jest.MockedFunction<(cmd: RoundCmd) => void>;

export function createPlainRound(fieldsUnderTest?: Partial<PlainRound>): PlainRound {
    return Object.assign(
        {
            questions: [],
            currentQuestion: null,
            isHost: false
        },
        fieldsUnderTest
    );
}

beforeEach(() => {
    currentQuestionFactory = jest.fn();
    sendCommand = jest.fn();
});

test('questions is exposed from initialData', () => {
    const initialData = {
        questions: [],
        currentQuestion: null,
        isHost: false
    };
    const latestData = of({
        questions: [],
        currentQuestion: null,
        isHost: false
    });

    const round = new Round(currentQuestionFactory, sendCommand, initialData, latestData);

    expect(round.questions).toEqual(initialData.questions);
});

test('startNextQuestion sends correct command', () => {
    const round = new Round(currentQuestionFactory, sendCommand, EMPTY_PLAIN_ROUND, of(EMPTY_PLAIN_ROUND));

    round.startNextQuestion();

    expect(sendCommand).toBeCalledWith({ cmd: 'StartNextQuestion' } as RoundCmd);
});

test('currentQuestion$ uses currentQuestionFactory to create CurrentQuestion', () => {
    const expectedQuestionsData = [{
        videoID: 'example-video',
        questionStartTime: 1,
        questionDisplayTime: 2,
        answerLockTime: 3,
        answerRevealTime: 4,
        endTime: 5,
        answerText1: '',
        answerText2: '',
        answerText3: '',
        correctAnswer: ''
    }];
    const expectedInitialMetaData = {
        i: 0,
        startTime: 10,
        hasEnded: true
    };
    const initialData = {
        questions: expectedQuestionsData,
        currentQuestion: null,
        isHost: false
    };
    const latestData = of({
        // Question data is fixed so we don't use latestData
        questions: [],
        currentQuestion: expectedInitialMetaData,
        isHost: false
    });
    const round = new Round(currentQuestionFactory, sendCommand, initialData, latestData);

    const mockCurrentQuestion = mock<CurrentQuestion>();
    currentQuestionFactory.mockReturnValue(mockCurrentQuestion);

    return firstValueFrom(round.currentQuestion$).then((actualQuestion) => {
        expect(actualQuestion).toEqual(mockCurrentQuestion);

        expect(currentQuestionFactory).toHaveBeenCalledWith(
            sendCommand,
            expectedQuestionsData,
            expectedInitialMetaData,
            expect.anything()
        );
    });
});

test('currentQuestion$ passes relevant latest data to currentQuestionFactory', () => {
    const initialData = createPlainRound({
        questions: [createQuestion(), createQuestion()]
    });

    const latestData$ = new BehaviorSubject(createPlainRound({
        currentQuestion: createPlainCurrentQuestionMetadata({
            i: 0,
            hasEnded: false
        })
    }));

    const round = new Round(currentQuestionFactory, sendCommand, initialData, latestData$);

    round.currentQuestion$.subscribe(() => {
        // Make the stream 'hot' so that currentQuestionFactory will be called
    });

    const factoryData$ = currentQuestionFactory.mock.calls[0][3];
    const factoryDataSpy = jest.fn();
    factoryData$.subscribe(factoryDataSpy);

    latestData$.next(createPlainRound({
        currentQuestion: createPlainCurrentQuestionMetadata({
            i: 0,
            hasEnded: true
        })
    }));

    expect(factoryDataSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({
        i: 0,
        hasEnded: false
    }));
    expect(factoryDataSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({
        i: 0,
        hasEnded: true
    }));
    expect(factoryDataSpy).toHaveBeenCalledTimes(2);
});

test('currentQuestion$ is not updated for latest data with the same question index', () => {
    const initialData = createPlainRound({
        questions: [createQuestion()]
    });

    const latestData$ = new BehaviorSubject(createPlainRound({
        currentQuestion: createPlainCurrentQuestionMetadata({
            i: 0,
            hasEnded: false
        })
    }));

    const round = new Round(currentQuestionFactory, sendCommand, initialData, latestData$);

    const currentQuestionSpy = jest.fn();
    round.currentQuestion$.subscribe(currentQuestionSpy);

    latestData$.next(createPlainRound({
        currentQuestion: createPlainCurrentQuestionMetadata({
            i: 0,
            hasEnded: true
        })
    }));

    expect(currentQuestionFactory).toHaveBeenCalledTimes(1);
    expect(currentQuestionSpy).toHaveBeenCalledTimes(1);
});

test('currentQuestion$ does not leak data between questions', () => {
    const initialData = createPlainRound({
        questions: [createQuestion(), createQuestion()]
    });

    const latestData$ = new BehaviorSubject(createPlainRound({
        currentQuestion: createPlainCurrentQuestionMetadata({
            i: 0,
            hasEnded: false
        })
    }));

    const round = new Round(currentQuestionFactory, sendCommand, initialData, latestData$);

    round.currentQuestion$.subscribe(() => {
        // Make the stream 'hot' so that currentQuestionFactory will be called
    });

    const firstQuestionLatestData$ = currentQuestionFactory.mock.calls[0][3];
    const firstQuestionSpy = jest.fn();
    firstQuestionLatestData$.subscribe(firstQuestionSpy);

    latestData$.next(createPlainRound({
        currentQuestion: createPlainCurrentQuestionMetadata({
            i: 1,
            hasEnded: false
        })
    }));

    const secondQuestionLatestData$ = currentQuestionFactory.mock.calls[1][3];
    const secondQuestionSpy = jest.fn();
    secondQuestionLatestData$.subscribe(secondQuestionSpy);

    expect(firstQuestionSpy).toHaveBeenCalledTimes(1);

    expect(secondQuestionSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({
        i: 1,
        hasEnded: false
    }));
    expect(secondQuestionSpy).toHaveBeenCalledTimes(1);
});

test('canStartNextQuestion$ is true for host with null or ended currentQuestion', () => {

    const initialData = {
        questions: [],
        currentQuestion: null,
        isHost: true
    };
    const latestData = new BehaviorSubject<PlainRound>({
        questions: [],
        currentQuestion: null,
        isHost: true
    });

    const round = new Round(currentQuestionFactory, sendCommand, initialData, latestData);

    const subscribeSpy = jest.fn();

    round.canStartNextQuestion$.subscribe(subscribeSpy);

    expect(subscribeSpy).toBeCalledWith(true);
    subscribeSpy.mockClear();

    latestData.next({
        questions: [],
        currentQuestion: createPlainCurrentQuestion({
            hasEnded: false
        }),
        isHost: true
    });

    expect(subscribeSpy).toBeCalledWith(false);
    subscribeSpy.mockClear();

    latestData.next({
        questions: [],
        currentQuestion: createPlainCurrentQuestion({
            hasEnded: true
        }),
        isHost: true
    });

    expect(subscribeSpy).toBeCalledWith(true);
    subscribeSpy.mockClear();

});

test('canStartNextQuestion$ is false for non-host', () => {

    const initialData = {
        questions: [],
        currentQuestion: null,
        isHost: false
    };
    const latestData = of({
        questions: [],
        currentQuestion: null,
        isHost: false
    });

    const round = new Round(currentQuestionFactory, sendCommand, initialData, latestData);

    const subscribeSpy = jest.fn();

    round.canStartNextQuestion$.subscribe(subscribeSpy);

    expect(subscribeSpy).toBeCalledWith(false);
});
