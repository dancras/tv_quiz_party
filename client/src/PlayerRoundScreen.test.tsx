import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mock } from 'jest-mock-extended';

import { CommandButtonProps } from './CommandButton';
import Round, { CurrentQuestion } from './Model/Round';
import { RoundScreenProps } from './PresenterRoundScreen';
import PlayerRoundScreen from './PlayerRoundScreen';
import { CountdownProps } from './Countdown';

import { createCurrentQuestion } from './Model/Round.test';
import { AnswerViewerProps } from './AnswerViewer';

let DummyCommandButton: React.FunctionComponent<CommandButtonProps>;
let MockAnswerViewer: jest.MockedFunction<React.FunctionComponent<AnswerViewerProps>>;
let MockCountdown: jest.MockedFunction<React.FunctionComponent<CountdownProps>>;
let useCurrentQuestion: jest.MockedFunction<() => CurrentQuestion | null>;
let useCanStartNextQuestion: jest.MockedFunction<() => boolean>;

function ExamplePlayerRoundScreen(
    props : RoundScreenProps
) {
    return PlayerRoundScreen(
        DummyCommandButton,
        MockAnswerViewer,
        MockCountdown,
        useCurrentQuestion,
        useCanStartNextQuestion,
        props
    );
}

beforeEach(() => {
    DummyCommandButton = ({ children, ...props }) => <button data-x {...props}>{children}</button>;
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
    expect(buttonElement).toHaveAttribute('data-x');

    expect(mockRound.startNextQuestion).toBeCalled();
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
