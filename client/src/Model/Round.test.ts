import { BehaviorSubject, firstValueFrom, from, of } from 'rxjs';

import Round, {
    CurrentQuestion,
    PlainCurrentQuestion,
    PlainCurrentQuestionMetadata,
    PlainRound,
    Question,
    RoundCmd
} from './Round';

const EMPTY_PLAIN_ROUND: PlainRound = {
    questions: [],
    currentQuestion: null,
    isHost: false
};

let sendCommand: jest.MockedFunction<(cmd: RoundCmd) => void>;

function createQuestion(fieldsUnderTest?: Partial<Question>): Question {
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

function createPlainCurrentQuestionMetadata(fieldsUnderTest?: Partial<PlainCurrentQuestionMetadata>): PlainCurrentQuestionMetadata {
    return Object.assign({
        i: 0,
        startTime: 0,
        hasEnded: false,
    }, fieldsUnderTest);
}

function createPlainCurrentQuestion(fieldsUnderTest?: Partial<PlainCurrentQuestionMetadata>): PlainCurrentQuestion {
    return Object.assign(
        createQuestion(),
        createPlainCurrentQuestionMetadata(),
        fieldsUnderTest
    );
}

export function createCurrentQuestion(fieldsUnderTest?: Partial<PlainCurrentQuestion>): CurrentQuestion {
    return Object.assign(
        createQuestion(),
        createPlainCurrentQuestionMetadata(),
        {
            hasEnded$: of(fieldsUnderTest?.hasEnded || false),
        },
        fieldsUnderTest
    );
}

beforeEach(() => {
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

    const round = new Round(sendCommand, initialData, latestData);

    expect(round.questions).toEqual(initialData.questions);
});

test('startNextQuestion sends correct command', () => {
    const round = new Round(sendCommand, EMPTY_PLAIN_ROUND, of(EMPTY_PLAIN_ROUND));

    round.startNextQuestion();

    expect(sendCommand).toBeCalledWith({ cmd: 'StartNextQuestion' } as RoundCmd);
});

test('currentQuestion$ combines CurrentQuestionMetadata and Question', () => {
    const initialData = {
        questions: [{
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
        }],
        currentQuestion: null,
        isHost: false
    };
    const expectedQuestion = {
        i: 0,
        startTime: 10,
        hasEnded: true
    };
    const latestData = of({
        // Question data is fixed so we don't use latestData
        questions: [],
        currentQuestion: expectedQuestion,
        isHost: false
    });
    const round = new Round(sendCommand, initialData, latestData);

    return firstValueFrom(round.currentQuestion$).then((actualQuestion) => {
        expect(actualQuestion).toEqual(expect.objectContaining({
            i: 0,
            videoID: 'example-video',
            startTime: 10,
            questionStartTime: 1,
            questionDisplayTime: 2,
            answerLockTime: 3,
            answerRevealTime: 4,
            endTime: 5,
            answerText1: '',
            answerText2: '',
            answerText3: '',
            correctAnswer: ''
        }));

        return actualQuestion && firstValueFrom(actualQuestion.hasEnded$);
    }).then((actualHasEnded) => {
        expect(actualHasEnded).toEqual(true);
    });
});

test('currentQuestion$ sends latest to new subscribers', () => {
    const initialData = {
        questions: [{
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
        }],
        currentQuestion: null,
        isHost: false
    };
    const expectedQuestion = {
        i: 0,
        startTime: 10,
        hasEnded: true
    };
    const latestData = from([
        {
            questions: [],
            currentQuestion: null,
            isHost: false
        },
        {
            questions: [],
            currentQuestion: expectedQuestion,
            isHost: false
        }
    ]);
    const round = new Round(sendCommand, initialData, latestData);

    round.currentQuestion$.subscribe(() => {
        // Consume all the values before testing another subscription
    });

    return firstValueFrom(round.currentQuestion$).then((actualQuestion) => {
        expect(actualQuestion?.i).toEqual(expectedQuestion.i);
        expect(actualQuestion?.videoID).toEqual('example-video');
    });
});

test('currentQuestion$ does not send update if question index is the same', () => {
    const initialData = {
        questions: [createQuestion()],
        currentQuestion: null,
        isHost: false
    };
    const latestData = from([
        {
            questions: [],
            currentQuestion: createPlainCurrentQuestion({
                i: 0,
                hasEnded: false
            }),
            isHost: false
        },
        {
            questions: [],
            currentQuestion: createPlainCurrentQuestion({
                i: 0,
                hasEnded: true
            }),
            isHost: false
        }
    ]);
    const round = new Round(sendCommand, initialData, latestData);

    const subscribeSpy = jest.fn();

    round.currentQuestion$.subscribe(subscribeSpy);

    expect(subscribeSpy).toBeCalledTimes(1);
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

    const round = new Round(sendCommand, initialData, latestData);

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

    const round = new Round(sendCommand, initialData, latestData);

    const subscribeSpy = jest.fn();

    round.canStartNextQuestion$.subscribe(subscribeSpy);

    expect(subscribeSpy).toBeCalledWith(false);
});

test('hasEnded does not leak details between questions', () => {
    const initialData = {
        questions: [],
        currentQuestion: null,
        isHost: false
    };
    const latestData = new BehaviorSubject({
        questions: [],
        currentQuestion: createPlainCurrentQuestionMetadata({
            i: 0,
            hasEnded: true
        }),
        isHost: false
    });

    const round = new Round(sendCommand, initialData, latestData);

    const subscribeSpy = jest.fn();

    return firstValueFrom(round.currentQuestion$).then(currentQuestion => {

        expect(currentQuestion).not.toEqual(null);
        if (currentQuestion) {
            currentQuestion.hasEnded$.subscribe(subscribeSpy);
            latestData.next({
                questions: [],
                currentQuestion: createPlainCurrentQuestionMetadata({
                    i: 1,
                    hasEnded: false
                }),
                isHost: false
            });
        }

        expect(subscribeSpy).toHaveBeenCalledWith(true);
        expect(subscribeSpy).toHaveBeenCalledTimes(1);

    });
});
