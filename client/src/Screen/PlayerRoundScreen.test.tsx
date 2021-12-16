import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mock, MockProxy } from 'jest-mock-extended';
import { of } from 'rxjs';
import { CommandButtonProps } from '../Component/CommandButton';
import { CountdownProps } from '../Component/Countdown';
import { QuestionTimingsHook } from '../Hook/QuestionTimingsHook';
import { mockHook } from '../Lib/Test';
import { createTimings } from '../Model/QuestionTimer.test';
import Round, { CurrentQuestion } from '../Model/Round';
import { createCurrentQuestion } from '../Model/Round.test';
import { AnswerViewerProps } from './AnswerViewer';
import PlayerRoundScreen from './PlayerRoundScreen';
import { RoundScreenProps } from './PresenterRoundScreen';

let DummyCommandButton: React.FunctionComponent<CommandButtonProps>;
let MockAnswerViewer: jest.MockedFunction<React.FunctionComponent<AnswerViewerProps>>;
let MockCountdown: jest.MockedFunction<React.FunctionComponent<CountdownProps>>;
let useQuestionTimings: jest.MockedFunction<QuestionTimingsHook<CurrentQuestion | undefined>>;
let mockRound: MockProxy<Round>;

function ExamplePlayerRoundScreen(
    props : RoundScreenProps
) {
    return PlayerRoundScreen(
        DummyCommandButton,
        MockAnswerViewer,
        MockCountdown,
        useQuestionTimings,
        props
    );
}

beforeEach(() => {
    DummyCommandButton = ({ children, ...props }) => <button data-x {...props}>{children}</button>;
    MockAnswerViewer = jest.fn();
    MockAnswerViewer.mockReturnValue(<div>AnswerViewer</div>);
    MockCountdown = jest.fn();
    MockCountdown.mockReturnValue(<div>Countdown</div>);
    useQuestionTimings = mockHook<QuestionTimingsHook<CurrentQuestion | undefined>>(createTimings(5));
    mockRound = mock<Round>();
    mockRound.canStartNextQuestion$ = of(false);
    mockRound.currentQuestion$ = of(createCurrentQuestion());
});

test('question timings are setup with currentQuestion', () => {
    const expectedQuestion = createCurrentQuestion();
    mockRound.currentQuestion$ = of(expectedQuestion);

    render(<ExamplePlayerRoundScreen round={mockRound} />);

    expect(useQuestionTimings).toHaveBeenCalledWith(expectedQuestion);
});

test('start question button calls start question function', () => {
    mockRound.canStartNextQuestion$ = of(true);

    render(<ExamplePlayerRoundScreen round={mockRound} />);

    const buttonElement = screen.getByText(/Start Question/i);
    userEvent.click(buttonElement);
    expect(buttonElement).toHaveAttribute('data-x');

    expect(mockRound.startNextQuestion).toBeCalled();
});

test('start question button not shown when canStartNextQuestion is false', () => {
    mockRound.canStartNextQuestion$ = of(false);

    render(<ExamplePlayerRoundScreen round={mockRound} />);

    const buttonElement = screen.queryByText(/Start Question/i);
    expect(buttonElement).not.toBeInTheDocument();
});


test('start question button not shown when question is not ended', () => {
    mockRound.canStartNextQuestion$ = of(true);
    useQuestionTimings.mockReturnValue(createTimings(4));

    render(<ExamplePlayerRoundScreen round={mockRound} />);

    const buttonElement = screen.queryByText(/Start Question/i);
    expect(buttonElement).not.toBeInTheDocument();
});

test('Countdown component is shown when there is a current question', () => {
    mockRound.currentQuestion$ = of(createCurrentQuestion({
        startTime: 1000
    }));

    render(<ExamplePlayerRoundScreen round={mockRound} />);

    const countdownElement = screen.queryByText(/Countdown/i);
    expect(countdownElement).toBeInTheDocument();

    expect(MockCountdown).toBeCalledWith({ endsAt: 1000 }, expect.anything());
});

test('AnswerViewer component is shown when there is a current question', () => {
    const expectedQuestion = createCurrentQuestion({
        startTime: 1000
    });
    mockRound.currentQuestion$ = of(expectedQuestion);

    render(<ExamplePlayerRoundScreen round={mockRound} />);

    expect(screen.getByText('AnswerViewer')).toBeInTheDocument();

    expect(MockAnswerViewer).toBeCalledWith({ round: mockRound, question: expectedQuestion }, expect.anything());
});
