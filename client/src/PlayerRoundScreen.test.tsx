import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mock } from 'jest-mock-extended';

import Round, { CurrentQuestionMetadata, Question } from './Round';
import { RoundScreenProps } from './PresenterRoundScreen';
import PlayerRoundScreen from './PlayerRoundScreen';

let useCurrentQuestion: jest.MockedFunction<() => CurrentQuestionMetadata & Question | null>;
let useCanStartNextQuestion: jest.MockedFunction<() => boolean>;

function ExamplePlayerRoundScreen(
    props : RoundScreenProps
) {
    return PlayerRoundScreen(
        useCurrentQuestion,
        useCanStartNextQuestion,
        props
    );
}

beforeEach(() => {
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
