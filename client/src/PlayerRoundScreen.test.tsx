import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mock } from 'jest-mock-extended';

import Round, { CurrentQuestionMetadata, Question } from './Round';
import { RoundScreenProps } from './PresenterRoundScreen';
import PlayerRoundScreen from './PlayerRoundScreen';
import { CountdownProps } from './Countdown';

import { createCurrentQuestion } from './Round.test';
import { AnswerViewerProps } from './AnswerViewer';

let MockAnswerViewer: jest.MockedFunction<React.FunctionComponent<AnswerViewerProps>>;
let MockCountdown: jest.MockedFunction<React.FunctionComponent<CountdownProps>>;
let useCurrentQuestion: jest.MockedFunction<() => CurrentQuestionMetadata & Question | null>;
let useCanStartNextQuestion: jest.MockedFunction<() => boolean>;

function ExamplePlayerRoundScreen(
    props : RoundScreenProps
) {
    return PlayerRoundScreen(
        MockAnswerViewer,
        MockCountdown,
        useCurrentQuestion,
        useCanStartNextQuestion,
        props
    );
}

beforeEach(() => {
    MockAnswerViewer = jest.fn();
    MockAnswerViewer.mockReturnValue(<div>AnswerViewer</div>);
    MockCountdown = jest.fn();
    MockCountdown.mockReturnValue(<div>Countdown</div>);
    useCurrentQuestion = jest.fn();
    useCurrentQuestion.mockReturnValue(null);

    useCanStartNextQuestion = jest.fn();
    useCanStartNextQuestion.mockReturnValue(true);
});

test('start question button calls start question function', () => {
    const mockRound = mock<Round>();
    render(<ExamplePlayerRoundScreen round={mockRound} />);

    const buttonElement = screen.getByText(/Start Question/i);
    userEvent.click(buttonElement);

    expect(mockRound.startNextQuestion).toBeCalled();
    expect(buttonElement).toBeDisabled();
});

test('start question button not shown when canStartNextQuestion is false', () => {
    const mockRound = mock<Round>();
    useCanStartNextQuestion.mockReturnValue(false);

    render(<ExamplePlayerRoundScreen round={mockRound} />);

    const buttonElement = screen.queryByText(/Start Question/i);
    expect(buttonElement).not.toBeInTheDocument();
});

test('Countdown component is shown when there is a current question', () => {
    const mockRound = mock<Round>();
    useCurrentQuestion.mockReturnValue(createCurrentQuestion({
        startTime: 1000
    }));

    render(<ExamplePlayerRoundScreen round={mockRound} />);

    const countdownElement = screen.queryByText(/Countdown/i);
    expect(countdownElement).toBeInTheDocument();

    expect(MockCountdown).toBeCalledWith({ endsAt: 1000 }, expect.anything());
});

test('AnswerViewer component is shown when there is a current question', () => {
    const expectedRound = mock<Round>();
    const expectedQuestion = createCurrentQuestion({
        startTime: 1000
    });
    useCurrentQuestion.mockReturnValue(expectedQuestion);

    render(<ExamplePlayerRoundScreen round={expectedRound} />);

    expect(screen.getByText('AnswerViewer')).toBeInTheDocument();

    expect(MockAnswerViewer).toBeCalledWith({ round: expectedRound, question: expectedQuestion }, expect.anything());
});
