import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mock } from 'jest-mock-extended';
import { act } from 'react-dom/test-utils';
import { of } from 'rxjs';
import { DummyCommandButton } from '../Component/CommandButton';
import { QuestionTimingsHook } from '../Hook/QuestionTimingsHook';
import { mockHook } from '../Lib/Test';
import CurrentQuestion from '../Model/CurrentQuestion';
import { createCurrentQuestion } from '../Model/CurrentQuestion.test';
import { createTimings } from '../Model/QuestionTimer.test';
import AnswerViewer, { AnswerViewerProps } from './AnswerViewer';

let useQuestionTimings: jest.MockedFunction<QuestionTimingsHook<CurrentQuestion>>;

function ExampleAnswerViewer(props: AnswerViewerProps) {
    return AnswerViewer(DummyCommandButton, useQuestionTimings, props);
}

beforeEach(() => {
    useQuestionTimings = mockHook<QuestionTimingsHook<CurrentQuestion>>(createTimings(0));
});

test('question timings are setup with currentQuestion', () => {
    const expectedQuestion = createCurrentQuestion();

    render(<ExampleAnswerViewer question={expectedQuestion} />);

    expect(useQuestionTimings).toHaveBeenCalledWith(expectedQuestion);
});

test('it displays answers at questionDisplayTime', () => {

    const question = createCurrentQuestion({
        answerText1: 'Answer 1',
        answerText2: 'Answer 2',
        answerText3: 'Answer 3',
    });

    useQuestionTimings.mockReturnValue(createTimings(1));

    render(<ExampleAnswerViewer question={question} />);

    expect(screen.queryByText('Answer 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Answer 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Answer 3')).not.toBeInTheDocument();

    act(() => {
        useQuestionTimings.mockReturnValue(createTimings(2));
    });

    expect(screen.getByText('Answer 1')).toHaveAttribute('data-command-button');
    expect(screen.getByText('Answer 2')).toHaveAttribute('data-command-button');
    expect(screen.getByText('Answer 3')).toHaveAttribute('data-command-button');
});

test('it indicates selected answer', () => {
    const question = createCurrentQuestion({
        answerText1: 'Answer 1',
        answerText2: 'Answer 2',
        answerText3: 'Answer 3',
    });

    useQuestionTimings.mockReturnValue(createTimings(2));

    render(<ExampleAnswerViewer question={question} />);

    const answerElement = screen.getByText('Answer 1');

    userEvent.click(answerElement);

    expect(answerElement.parentElement?.classList).toContain('has-selected');
    expect(answerElement.classList).toContain('selected');
});

test('it calls answerQuestion with clicked answerIndex', () => {
    const mockQuestion = mock<CurrentQuestion>();
    mockQuestion.hasEndedOnServer$ = of(false);
    mockQuestion.answerOptions = ['Answer 1', 'Answer 2'];

    useQuestionTimings.mockReturnValue(createTimings(2));

    render(<ExampleAnswerViewer question={mockQuestion} />);

    const answerElement = screen.getByText('Answer 2');
    userEvent.click(answerElement);

    expect(mockQuestion.answerQuestion).toHaveBeenCalledWith(1);
});

test('it disables answering at answerLockTime', () => {
    const mockQuestion = mock<CurrentQuestion>();
    mockQuestion.hasEndedOnServer$ = of(false);
    mockQuestion.answerOptions = ['Answer 1'];

    useQuestionTimings.mockReturnValue(createTimings(3));

    render(<ExampleAnswerViewer question={mockQuestion} />);

    const answerElement = screen.getByText('Answer 1');
    userEvent.click(answerElement);

    expect(mockQuestion.answerQuestion).not.toHaveBeenCalled();
});

test('it reveals answer at answerRevealTime', () => {
    const question = createCurrentQuestion({
        answerText1: 'Answer 1',
        answerText2: 'Answer 2',
        answerText3: 'Answer 3',
        correctAnswer: '3'
    });

    useQuestionTimings.mockReturnValue(createTimings(2));
    render(<ExampleAnswerViewer question={question} />);

    const correctAnswerElement = screen.getByText('Answer 3');
    userEvent.click(correctAnswerElement);

    act(() => {
        useQuestionTimings.mockReturnValue(createTimings(4));
    });

    expect(screen.getByText('Answer 1').classList).toContain('incorrect-answer');
    expect(screen.getByText('Answer 2').classList).toContain('incorrect-answer');
    expect(screen.getByText('Answer 3').classList).toContain('correct-answer');

    expect(correctAnswerElement.parentElement?.classList).toContain('correct');
});
