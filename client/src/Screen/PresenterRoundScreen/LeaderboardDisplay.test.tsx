import { act, render, screen } from '@testing-library/react';
import { mock } from 'jest-mock-extended';
import { BehaviorSubject } from 'rxjs';
import { QuestionTimingsHook } from '../../Hook/QuestionTimingsHook';
import { mockHook } from '../../Lib/Test';
import CurrentQuestion from '../../Model/CurrentQuestion';
import { createCurrentQuestion } from '../../Model/CurrentQuestion.test';
import { createTimings } from '../../Model/QuestionTimer.test';
import LeaderboardDisplay, { LeaderboardDisplayProps } from './LeaderboardDisplay';

let useQuestionTimings: jest.MockedFunction<QuestionTimingsHook<CurrentQuestion>>;

function ExampleLeaderboardDisplay(props: LeaderboardDisplayProps) {
    return LeaderboardDisplay(useQuestionTimings, props);
}

test('previous answers are revealed when current question is locked', () => {
    const leaderboard = {
        'first-user': {
            previousAnswer: 'User 1 Answer'
        },
        'second-user': {
            previousAnswer: 'User 2 Answer'
        }
    };

    const currentQuestion = createCurrentQuestion();
    const hasEndedOnServer$ = new BehaviorSubject(false);
    currentQuestion.hasEndedOnServer$ = hasEndedOnServer$;

    useQuestionTimings = mockHook<QuestionTimingsHook<CurrentQuestion>>(createTimings(3));

    render(<ExampleLeaderboardDisplay currentQuestion={currentQuestion} leaderboard={leaderboard} />);

    expect(screen.queryByText('User 1 Answer')).not.toBeInTheDocument();
    expect(screen.queryByText('User 2 Answer')).not.toBeInTheDocument();

    act(() => {
        hasEndedOnServer$.next(true);
    });

    expect(screen.getByText('User 1 Answer')).toBeInTheDocument();
    expect(screen.getByText('User 2 Answer')).toBeInTheDocument();
});

test('classes are added to previous answers when revealAnswer timing passes', () => {
    const leaderboard = {
        'first-user': {
            previousAnswer: 'Answer'
        },
        'second-user': {
            previousAnswer: 'Not Answer'
        }
    };

    const currentQuestion = mock<CurrentQuestion>();
    currentQuestion.hasEndedOnServer$ = new BehaviorSubject(true);
    currentQuestion.correctAnswer = 'Answer';

    useQuestionTimings = mockHook<QuestionTimingsHook<CurrentQuestion>>(createTimings(3));

    render(<ExampleLeaderboardDisplay currentQuestion={currentQuestion} leaderboard={leaderboard} />);

    expect(screen.getByText('Answer').classList).not.toContain('correct');
    expect(screen.getByText('Answer').classList).not.toContain('incorrect');
    expect(screen.getByText('Not Answer').classList).not.toContain('correct');
    expect(screen.getByText('Not Answer').classList).not.toContain('incorrect');

    act(() => {
        useQuestionTimings.mockReturnValue(createTimings(4));
    });

    expect(screen.getByText('Answer').classList).toContain('correct');
    expect(screen.getByText('Answer').classList).not.toContain('incorrect');
    expect(screen.getByText('Not Answer').classList).toContain('incorrect');
    expect(screen.getByText('Not Answer').classList).not.toContain('correct');
});
