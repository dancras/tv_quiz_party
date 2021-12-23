import { act, render, screen } from '@testing-library/react';
import { mock } from 'jest-mock-extended';
import { BehaviorSubject } from 'rxjs';
import { QuestionTimingsHook } from '../../Hook/QuestionTimingsHook';
import { mockHook } from '../../Lib/Test';
import CurrentQuestion from '../../Model/CurrentQuestion';
import { createCurrentQuestion } from '../../Model/CurrentQuestion.test';
import { Profile } from '../../Model/Profile';
import { createTimings } from '../../Model/QuestionTimer.test';
import { Leaderboard } from '../../Model/Round';
import { createLeaderboardItem } from '../../Model/Round.test';
import LeaderboardDisplay, { LeaderboardDisplayProps } from './LeaderboardDisplay';

let useQuestionTimings: jest.MockedFunction<QuestionTimingsHook<CurrentQuestion>>;

function ExampleLeaderboardDisplay(props: LeaderboardDisplayProps) {
    return LeaderboardDisplay(useQuestionTimings, props);
}

function createUsersForLeaderboard(leaderboard: Leaderboard): Record<string, Profile> {
    return Object.fromEntries(Object.entries(leaderboard).map(([k, v]) => [k, {
        userID: k,
        displayName: 'Name ' + k,
        imageFilename: k + '.png'
    }]));
}

test('previous answers are revealed when current question is locked', () => {
    const leaderboard = {
        'first-user': createLeaderboardItem({
            previousAnswer: 'User 1 Answer'
        }),
        'second-user': createLeaderboardItem({
            previousAnswer: 'User 2 Answer'
        })
    };

    const currentQuestion = createCurrentQuestion();
    const hasEndedOnServer$ = new BehaviorSubject(false);
    currentQuestion.hasEndedOnServer$ = hasEndedOnServer$;

    useQuestionTimings = mockHook<QuestionTimingsHook<CurrentQuestion>>(createTimings(3));

    render(<ExampleLeaderboardDisplay currentQuestion={currentQuestion} leaderboard={leaderboard} users={createUsersForLeaderboard(leaderboard)} />);

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
        'first-user': createLeaderboardItem({
            previousAnswer: 'Correct Answer'
        }),
        'second-user': createLeaderboardItem({
            previousAnswer: 'Incorrect Answer'
        })
    };

    const currentQuestion = mock<CurrentQuestion>();
    currentQuestion.hasEndedOnServer$ = new BehaviorSubject(true);
    currentQuestion.correctAnswer = 'Correct Answer';

    useQuestionTimings = mockHook<QuestionTimingsHook<CurrentQuestion>>(createTimings(3));

    render(<ExampleLeaderboardDisplay currentQuestion={currentQuestion} leaderboard={leaderboard} users={createUsersForLeaderboard(leaderboard)} />);

    expect(screen.getByText('Correct Answer').classList).not.toContain('correct');
    expect(screen.getByText('Correct Answer').classList).not.toContain('incorrect');
    expect(screen.getByText('Incorrect Answer').classList).not.toContain('correct');
    expect(screen.getByText('Incorrect Answer').classList).not.toContain('incorrect');

    act(() => {
        useQuestionTimings.mockReturnValue(createTimings(4));
    });

    expect(screen.getByText('Correct Answer').classList).toContain('correct');
    expect(screen.getByText('Correct Answer').classList).not.toContain('incorrect');
    expect(screen.getByText('Incorrect Answer').classList).toContain('incorrect');
    expect(screen.getByText('Incorrect Answer').classList).not.toContain('correct');
});

test('leaderboard position and score updates are ignored until revealAnswer timing passes', () => {
    const leaderboard = {
        'first-user': createLeaderboardItem({
            position: 111,
            score: 222
        })
    };

    const users = createUsersForLeaderboard(leaderboard);

    const currentQuestion = mock<CurrentQuestion>();
    currentQuestion.hasEndedOnServer$ = new BehaviorSubject(true);

    useQuestionTimings = mockHook<QuestionTimingsHook<CurrentQuestion>>(createTimings(3));

    const { rerender } = render(<ExampleLeaderboardDisplay currentQuestion={currentQuestion} leaderboard={leaderboard} users={users} />);

    expect(screen.getByText('111')).toBeInTheDocument();
    expect(screen.getByText('222')).toBeInTheDocument();

    const leaderboardUpdate = {
        'first-user': createLeaderboardItem({
            position: 333,
            score: 444
        })
    };

    rerender(<ExampleLeaderboardDisplay currentQuestion={currentQuestion} leaderboard={leaderboardUpdate} users={users} />);

    expect(screen.getByText('111')).toBeInTheDocument();
    expect(screen.getByText('222')).toBeInTheDocument();
    expect(screen.queryByText('333')).not.toBeInTheDocument();
    expect(screen.queryByText('444')).not.toBeInTheDocument();

    act(() => {
        useQuestionTimings.mockReturnValue(createTimings(4));
    });

    expect(screen.queryByText('111')).not.toBeInTheDocument();
    expect(screen.queryByText('222')).not.toBeInTheDocument();
    expect(screen.getByText('333')).toBeInTheDocument();
    expect(screen.getByText('444')).toBeInTheDocument();
});


test('previousAnswer updates are available when answering is locked', () => {
    const leaderboard = {
        'first-user': createLeaderboardItem({
        })
    };

    const users = createUsersForLeaderboard(leaderboard);

    const currentQuestion = mock<CurrentQuestion>();
    currentQuestion.hasEndedOnServer$ = new BehaviorSubject(true);

    useQuestionTimings = mockHook<QuestionTimingsHook<CurrentQuestion>>(createTimings(3));

    const { rerender } = render(<ExampleLeaderboardDisplay currentQuestion={currentQuestion} leaderboard={leaderboard} users={users} />);

    const leaderboardUpdate = {
        'first-user': createLeaderboardItem({
            previousAnswer: 'foo'
        })
    };

    rerender(<ExampleLeaderboardDisplay currentQuestion={currentQuestion} leaderboard={leaderboardUpdate} users={users} />);

    expect(screen.getByText('foo')).toBeInTheDocument();
});
