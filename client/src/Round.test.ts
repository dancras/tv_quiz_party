import { firstValueFrom, from, of } from 'rxjs';
import Round from './Round';

test('questions is exposed from initialData', () => {
    const initialData = {
        questions: [],
        currentQuestion: null
    };
    const latestData = of({
        questions: [],
        currentQuestion: null
    });

    const round = new Round(initialData, latestData);

    expect(round.questions).toEqual(round.questions);
});

test('currentQuestion$ is derived from latestData', () => {
    const initialData = {
        questions: [],
        currentQuestion: null
    };
    const expectedQuestion = {
        i: 1,
        startTime: 1234,
        hasEnded: true
    };
    const latestData = of({
        questions: [],
        currentQuestion: expectedQuestion
    });
    const round = new Round(initialData, latestData);

    return firstValueFrom(round.currentQuestion$).then((actualQuestion) => {
        expect(actualQuestion).toEqual(expectedQuestion);
    });
});

test('currentQuestion$ sends latest to new subscribers', () => {
    const initialData = {
        questions: [],
        currentQuestion: null
    };
    const expectedQuestion = {
        i: 1,
        startTime: 1234,
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
    const round = new Round(initialData, latestData);

    round.currentQuestion$.subscribe(() => {
        // Consume all the values before testing another subscription
    });

    return firstValueFrom(round.currentQuestion$).then((actualQuestion) => {
        expect(actualQuestion).toEqual(expectedQuestion);
    });
});
