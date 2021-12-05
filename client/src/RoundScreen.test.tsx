import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mock } from 'jest-mock-extended';

import Round, { CurrentQuestionMetadata, Question } from './Round';
import RoundScreen, { RoundScreenProps } from './RoundScreen';
import { QuestionViewerProps } from './QuestionViewer';

let DummyQuestionViewer: React.FunctionComponent<QuestionViewerProps>;
let useCurrentQuestion: jest.MockedFunction<() => CurrentQuestionMetadata & Question | null>;
let useCanStartNextQuestion: jest.MockedFunction<() => boolean>;

function ExampleRoundScreen(
    props : RoundScreenProps
) {
    return RoundScreen(
        DummyQuestionViewer,
        useCurrentQuestion,
        useCanStartNextQuestion,
        props
    );
}

beforeEach(() => {
    DummyQuestionViewer = () => <div>QuestionViewer</div>;

    useCurrentQuestion = jest.fn();
    useCurrentQuestion.mockReturnValue(null);

    useCanStartNextQuestion = jest.fn();
    useCanStartNextQuestion.mockReturnValue(true);
});

test('start question button calls start question function', () => {
    const mockRound = mock<Round>();
    render(<ExampleRoundScreen round={mockRound} />);

    const buttonElement = screen.getByText(/Start Question/i);
    userEvent.click(buttonElement);

    expect(mockRound.startNextQuestion).toBeCalled();
    expect(buttonElement).toBeDisabled();
});

test('start question button not shown when canStartNextQuestion is false', () => {
    const mockRound = mock<Round>();
    useCanStartNextQuestion.mockReturnValue(false);

    render(<ExampleRoundScreen round={mockRound} />);

    const buttonElement = screen.queryByText(/Start Question/i);
    expect(buttonElement).not.toBeInTheDocument();
});

test('QuestionViewer is shown for current question data', () => {
    const mockRound = mock<Round>();
    useCurrentQuestion.mockReturnValue({
        i: 0,
        hasEnded: true,
        videoID: '',
        startTime: 0,
        questionDisplayTime: 0,
        answerLockTime: 0,
        answerRevealTime: 0,
        endTime: 0,
        answerText1: '',
        answerText2: '',
        answerText3: '',
        correctAnswer: ''
    });

    render(<ExampleRoundScreen round={mockRound} />);

    expect(screen.getByText('QuestionViewer')).toBeInTheDocument();
});
