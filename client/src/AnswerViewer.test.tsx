import { act } from 'react-dom/test-utils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockProxy, mock } from 'jest-mock-extended';

import { Animator, createTestDirector } from './lib/Animator';
import { Timer } from './lib/Timer';

import AnswerViewer, { AnswerViewerProps } from './AnswerViewer';

import { createCurrentQuestion } from './Round.test';
import Round from './Round';

let mockAnimator: MockProxy<Animator>;
let mockTimer: MockProxy<Timer>;
let mockRound: MockProxy<Round>;

function ExampleAnswerViewer(props: AnswerViewerProps) {
    return AnswerViewer(mockAnimator, mockTimer, props);
}

beforeEach(() => {
    mockAnimator = mock<Animator>();
    mockTimer = mock<Timer>();
    mockRound = mock<Round>();
});

test('it displays answers at questionDisplayTime', () => {
    const animate = createTestDirector(mockAnimator);

    const question = createCurrentQuestion({
        startTime: 10000,
        questionStartTime: 10,
        questionDisplayTime: 20,
        answerLockTime: 30,
        answerText1: 'Answer 1',
        answerText2: 'Answer 2',
        answerText3: 'Answer 3',
    });

    mockTimer.now.mockReturnValue(19999);

    render(<ExampleAnswerViewer round={mockRound} question={question} />);

    expect(screen.queryByText('Answer 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Answer 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Answer 3')).not.toBeInTheDocument();

    mockTimer.now.mockReturnValue(20000);
    act(() => {
        animate();
    });

    expect(screen.getByText('Answer 1')).toBeInTheDocument();
    expect(screen.getByText('Answer 2')).toBeInTheDocument();
    expect(screen.getByText('Answer 3')).toBeInTheDocument();
});

test('it calls answerQuestion once on round when an answer is clicked', () => {
    const question = createCurrentQuestion({
        startTime: 10000,
        questionStartTime: 10,
        questionDisplayTime: 20,
        answerLockTime: 30,
        answerText1: 'Answer 1',
        answerText2: 'Answer 2',
        answerText3: 'Answer 3',
    });

    mockTimer.now.mockReturnValue(20000);

    render(<ExampleAnswerViewer round={mockRound} question={question} />);

    const answerElement = screen.getByText('Answer 1');
    const otherAnswerElement = screen.getByText('Answer 2');
    userEvent.click(answerElement);

    expect(mockRound.answerQuestion).toBeCalledWith('1');

    userEvent.click(answerElement);
    userEvent.click(otherAnswerElement);

    expect(mockRound.answerQuestion).toHaveBeenCalledTimes(1);
});

test('it indicates selected answer', () => {
    const question = createCurrentQuestion({
        startTime: 10000,
        questionStartTime: 10,
        questionDisplayTime: 20,
        answerLockTime: 30,
        answerText1: 'Answer 1',
        answerText2: 'Answer 2',
        answerText3: 'Answer 3',
    });

    mockTimer.now.mockReturnValue(20000);

    render(<ExampleAnswerViewer round={mockRound} question={question} />);

    const answerElement = screen.getByText('Answer 1');

    userEvent.click(answerElement);

    expect(answerElement.parentElement?.classList).toContain('has-selected');
    expect(answerElement.classList).toContain('selected');
});

test('it disables answering at answerLockTime', () => {
    const animate = createTestDirector(mockAnimator);
    const question = createCurrentQuestion({
        startTime: 10000,
        questionStartTime: 10,
        questionDisplayTime: 20,
        answerLockTime: 30,
        answerText1: 'Answer 1',
        answerText2: 'Answer 2',
        answerText3: 'Answer 3',
    });

    render(<ExampleAnswerViewer round={mockRound} question={question} />);

    mockTimer.now.mockReturnValue(30000);
    act(() => {
        animate();
    });

    const answerElement = screen.getByText('Answer 1');
    userEvent.click(answerElement);

    expect(mockRound.answerQuestion).not.toHaveBeenCalled();
});

test('it reveals answer at answerRevealTime', () => {
    const animate = createTestDirector(mockAnimator);
    const question = createCurrentQuestion({
        startTime: 10000,
        questionStartTime: 10,
        questionDisplayTime: 20,
        answerLockTime: 30,
        answerRevealTime: 40,
        answerText1: 'Answer 1',
        answerText2: 'Answer 2',
        answerText3: 'Answer 3',
        correctAnswer: '3'
    });

    mockTimer.now.mockReturnValue(20000);

    render(<ExampleAnswerViewer round={mockRound} question={question} />);

    const correctAnswerElement = screen.getByText('Answer 3');
    userEvent.click(correctAnswerElement);

    mockTimer.now.mockReturnValue(40000);
    act(() => {
        animate();
    });

    expect(screen.getByText('Answer 1').classList).toContain('incorrect-answer');
    expect(screen.getByText('Answer 2').classList).toContain('incorrect-answer');
    expect(screen.getByText('Answer 3').classList).toContain('correct-answer');

    expect(correctAnswerElement.parentElement?.classList).toContain('correct');
});
