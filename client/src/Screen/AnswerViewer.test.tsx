import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockProxy, mock } from 'jest-mock-extended';

import AnswerViewer, { AnswerViewerProps } from './AnswerViewer';

import { createCurrentQuestion } from '../Model/Round.test';
import Round from '../Model/Round';
import { CommandButtonProps } from '../Component/CommandButton';
import { QuestionTimings } from '../Model/QuestionTimer';
import { createTimings } from '../Model/QuestionTimer.test';
import { BehaviorSubject } from 'rxjs';
import { act } from 'react-dom/test-utils';

let DummyCommandButton: React.FunctionComponent<CommandButtonProps>;
let mockRound: MockProxy<Round>;
let currentQuestionTimings$: BehaviorSubject<QuestionTimings>;

function ExampleAnswerViewer(props: AnswerViewerProps) {
    return AnswerViewer(DummyCommandButton, currentQuestionTimings$, props);
}

beforeEach(() => {
    DummyCommandButton = ({ children, ...props }) => <button data-x {...props}>{children}</button>;
    mockRound = mock<Round>();
    currentQuestionTimings$ = new BehaviorSubject(createTimings(0));
});

test('it displays answers at questionDisplayTime', () => {

    const question = createCurrentQuestion({
        answerText1: 'Answer 1',
        answerText2: 'Answer 2',
        answerText3: 'Answer 3',
    });

    currentQuestionTimings$.next(createTimings(1));

    render(<ExampleAnswerViewer round={mockRound} question={question} />);

    expect(screen.queryByText('Answer 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Answer 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Answer 3')).not.toBeInTheDocument();

    act(() => {
        currentQuestionTimings$.next(createTimings(2));
    });

    expect(screen.getByText('Answer 1')).toHaveAttribute('data-x');
    expect(screen.getByText('Answer 2')).toHaveAttribute('data-x');
    expect(screen.getByText('Answer 3')).toHaveAttribute('data-x');
});

test('it indicates selected answer', () => {
    const question = createCurrentQuestion({
        answerText1: 'Answer 1',
        answerText2: 'Answer 2',
        answerText3: 'Answer 3',
    });

    currentQuestionTimings$.next(createTimings(2));

    render(<ExampleAnswerViewer round={mockRound} question={question} />);

    const answerElement = screen.getByText('Answer 1');

    userEvent.click(answerElement);

    expect(answerElement.parentElement?.classList).toContain('has-selected');
    expect(answerElement.classList).toContain('selected');
});

test('it disables answering at answerLockTime', () => {
    const question = createCurrentQuestion({
        answerText1: 'Answer 1',
        answerText2: 'Answer 2',
        answerText3: 'Answer 3',
    });

    currentQuestionTimings$.next(createTimings(3));

    render(<ExampleAnswerViewer round={mockRound} question={question} />);

    const answerElement = screen.getByText('Answer 1');
    userEvent.click(answerElement);

    expect(mockRound.answerQuestion).not.toHaveBeenCalled();
});

test('it calls endQuestion at answerLockTime if question has not ended', () => {
    const question = createCurrentQuestion({
        hasEnded: false
    });

    currentQuestionTimings$.next(createTimings(2));

    render(<ExampleAnswerViewer round={mockRound} question={question} />);

    expect(mockRound.endQuestion).not.toHaveBeenCalled();

    act(() => {
        currentQuestionTimings$.next(createTimings(3));
    });

    expect(mockRound.endQuestion).toHaveBeenCalled();
});

test('it does not call endQuestion if question has ended', () => {
    const question = createCurrentQuestion({
        hasEnded: true
    });

    currentQuestionTimings$.next(createTimings(3));

    render(<ExampleAnswerViewer round={mockRound} question={question} />);

    expect(mockRound.endQuestion).not.toHaveBeenCalled();
});

test('it reveals answer at answerRevealTime', () => {
    const question = createCurrentQuestion({
        answerText1: 'Answer 1',
        answerText2: 'Answer 2',
        answerText3: 'Answer 3',
        correctAnswer: '3'
    });

    currentQuestionTimings$.next(createTimings(2));
    render(<ExampleAnswerViewer round={mockRound} question={question} />);

    const correctAnswerElement = screen.getByText('Answer 3');
    userEvent.click(correctAnswerElement);

    act(() => {
        currentQuestionTimings$.next(createTimings(4));
    });

    expect(screen.getByText('Answer 1').classList).toContain('incorrect-answer');
    expect(screen.getByText('Answer 2').classList).toContain('incorrect-answer');
    expect(screen.getByText('Answer 3').classList).toContain('correct-answer');

    expect(correctAnswerElement.parentElement?.classList).toContain('correct');
});
