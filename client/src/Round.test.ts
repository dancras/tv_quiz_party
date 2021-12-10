import { BehaviorSubject, firstValueFrom, from, of } from 'rxjs';

import Round, { CurrentQuestionMetadata, PlainRound, Question, RoundCmd } from './Round';

const EMPTY_PLAIN_ROUND: PlainRound = {
    questions: [],
    currentQuestion: null,
    isHost: false
};

let sendCommand: jest.MockedFunction<(cmd: RoundCmd) => void>;

export function createCurrentQuestion(fieldsUnderTest?: Partial<CurrentQuestionMetadata & Question>): CurrentQuestionMetadata & Question {
    return Object.assign({
        i: 0,
        startTime: 0,
        hasEnded: false,
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
        expect(actualQuestion).toEqual({
            i: 0,
            hasEnded: true,
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
        });
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
        currentQuestion: createCurrentQuestion({
            hasEnded: false
        }),
        isHost: true
    });

    expect(subscribeSpy).toBeCalledWith(false);
    subscribeSpy.mockClear();

    latestData.next({
        questions: [],
        currentQuestion: createCurrentQuestion({
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
