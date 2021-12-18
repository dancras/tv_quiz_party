import { render, screen } from '@testing-library/react';
import { mock } from 'jest-mock-extended';
import { BehaviorSubject } from 'rxjs';
import CurrentQuestion from '../Model/CurrentQuestion';
import { createCurrentQuestion } from '../Model/CurrentQuestion.test';
import Round, { Leaderboard } from '../Model/Round';
import PresenterRoundScreen, { RoundScreenProps } from './PresenterRoundScreen';
import { LeaderboardDisplayProps } from './PresenterRoundScreen/LeaderboardDisplay';
import { QuestionViewerProps } from './QuestionViewer';

let DummyLeaderboardDisplay: React.FunctionComponent<LeaderboardDisplayProps>;
let DummyQuestionViewer: React.FunctionComponent<QuestionViewerProps>;
let currentQuestion$: BehaviorSubject<CurrentQuestion | null>;

function ExamplePresenterRoundScreen(
    props : RoundScreenProps
) {
    return PresenterRoundScreen(
        DummyLeaderboardDisplay,
        DummyQuestionViewer,
        props
    );
}

beforeEach(() => {
    DummyLeaderboardDisplay = () => <div>LeaderboardDisplay</div>;
    DummyQuestionViewer = () => <div>QuestionViewer</div>;
    currentQuestion$ = new BehaviorSubject<CurrentQuestion | null>(null);
});

test('QuestionViewer is shown for current question data', () => {
    const mockRound = mock<Round>();
    mockRound.currentQuestion$ = currentQuestion$;
    mockRound.leaderboard$ = new BehaviorSubject(mock<Leaderboard>());

    currentQuestion$.next(createCurrentQuestion());

    render(<ExamplePresenterRoundScreen round={mockRound} />);

    expect(screen.getByText('QuestionViewer')).toBeInTheDocument();
});

test('LeaderboardDisplay is shown for current question data', () => {
    const mockRound = mock<Round>();
    mockRound.currentQuestion$ = currentQuestion$;
    mockRound.leaderboard$ = new BehaviorSubject(mock<Leaderboard>());

    currentQuestion$.next(createCurrentQuestion());

    render(<ExamplePresenterRoundScreen round={mockRound} />);

    expect(screen.getByText('LeaderboardDisplay')).toBeInTheDocument();
});
