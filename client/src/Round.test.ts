import { firstValueFrom, from, of } from 'rxjs';

import Round, { PlainRound, RoundCmd } from './Round';

const EMPTY_PLAIN_ROUND: PlainRound = {
    questions: [],
    currentQuestion: null
};

let sendCommand: jest.MockedFunction<(cmd: RoundCmd) => void>;

beforeEach(() => {
    sendCommand = jest.fn();
});

test('questions is exposed from initialData', () => {
    const initialData = {
        questions: [],
        currentQuestion: null
    };
    const latestData = of({
        questions: [],
        currentQuestion: null
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
        currentQuestion: null
    };
    const expectedQuestion = {
        i: 0,
        startTime: 10,
        hasEnded: true
    };
    const latestData = of({
        // Question data is fixed so we don't use latestData
        questions: [],
        currentQuestion: expectedQuestion
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
        currentQuestion: null
    };
    const expectedQuestion = {
        i: 0,
        startTime: 10,
        hasEnded: true
    };
    const latestData = from([
        {
            questions: [],
            currentQuestion: null
        },
        {
            questions: [],
            currentQuestion: expectedQuestion
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
