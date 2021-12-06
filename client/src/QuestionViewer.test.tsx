import { render, screen } from '@testing-library/react';
import { MockProxy, mock } from 'jest-mock-extended';
import { act } from 'react-dom/test-utils';

import QuestionViewer, { AnimateProvider, QuestionViewerProps, TimeProvider } from './QuestionViewer';

let mockWindow: MockProxy<AnimateProvider>;
let MockDate: MockProxy<TimeProvider>;

beforeEach(() => {
    mockWindow = mock<AnimateProvider>();
    MockDate = mock<TimeProvider>();
});

function ExampleQuestionViewer(props: QuestionViewerProps) {
    return QuestionViewer(mockWindow, MockDate, props);
}

test('it shows a countdown before question startTime is reached', () => {
    MockDate.now.mockReturnValue(5000);

    const question = {
        i: 0,
        startTime: 10000,
        hasEnded: true,
        videoID: '',
        questionStartTime: 0,
        questionDisplayTime: 0,
        answerLockTime: 0,
        answerRevealTime: 0,
        endTime: 0,
        answerText1: '',
        answerText2: '',
        answerText3: '',
        correctAnswer: ''
    };
    render(<ExampleQuestionViewer question={question} />);

    expect(screen.getByText('5')).toBeInTheDocument();

    MockDate.now.mockReturnValue(5001);
    act(() => {
        mockWindow.requestAnimationFrame.mock.calls[0][0](0);
    });
    expect(screen.getByText('4')).toBeInTheDocument();

    MockDate.now.mockReturnValue(5999);
    act(() => {
        mockWindow.requestAnimationFrame.mock.calls[1][0](0);
    });
    expect(screen.getByText('4')).toBeInTheDocument();

    MockDate.now.mockReturnValue(10001);
    act(() => {
        mockWindow.requestAnimationFrame.mock.calls[1][0](0);
    });
    expect(screen.getByText('0')).toBeInTheDocument();
});
