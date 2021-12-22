import { render, screen } from '@testing-library/react';
import { mock, MockProxy } from 'jest-mock-extended';
import { BehaviorSubject } from 'rxjs';
import CurrentQuestion from '../Model/CurrentQuestion';
import { createCurrentQuestion } from '../Model/CurrentQuestion.test';
import Lobby from '../Model/Lobby';
import Round, { Leaderboard } from '../Model/Round';
import PresenterRoundScreen, { PresenterRoundScreenProps } from './PresenterRoundScreen';
import { LeaderboardDisplayProps } from './PresenterRoundScreen/LeaderboardDisplay';
import { QuestionViewerProps } from './QuestionViewer';

let DummyLeaderboardDisplay: React.FunctionComponent<LeaderboardDisplayProps>;
let DummyQuestionViewer: React.FunctionComponent<QuestionViewerProps>;
let currentQuestion$: BehaviorSubject<CurrentQuestion | null>;
let mockLobby: MockProxy<Lobby>;

function ExamplePresenterRoundScreen(
    props : PresenterRoundScreenProps
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
    mockLobby = mock<Lobby>();
    mockLobby.users$ = new BehaviorSubject({});
});

test('QuestionViewer is shown for current question data', () => {
    const mockRound = mock<Round>();
    mockRound.currentQuestion$ = currentQuestion$;
    mockRound.leaderboard$ = new BehaviorSubject(mock<Leaderboard>());

    currentQuestion$.next(createCurrentQuestion());

    render(<ExamplePresenterRoundScreen lobby={mockLobby} round={mockRound} />);

    expect(screen.getByText('QuestionViewer')).toBeInTheDocument();
});

test('LeaderboardDisplay is shown for current question data', () => {
    const mockRound = mock<Round>();
    mockRound.currentQuestion$ = currentQuestion$;
    mockRound.leaderboard$ = new BehaviorSubject(mock<Leaderboard>());

    currentQuestion$.next(createCurrentQuestion());

    render(<ExamplePresenterRoundScreen lobby={mockLobby} round={mockRound} />);

    expect(screen.getByText('LeaderboardDisplay')).toBeInTheDocument();
});
