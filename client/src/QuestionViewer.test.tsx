import { render, screen } from '@testing-library/react';
import { MockProxy, mock } from 'jest-mock-extended';
import { act } from 'react-dom/test-utils';

import { Animator, createTestDirector } from './lib/Animator';
import { Timer } from './lib/Timer';

import QuestionViewer, { QuestionViewerProps } from './QuestionViewer';
import { CurrentQuestionMetadata, Question } from './Round';

type MockPlayer = {
    playVideo: jest.MockedFunction<() => void>,
    seekTo: jest.MockedFunction<(seconds: number, allowSeekAhead: boolean) => void>
}

let MockYouTube: any;
let mockPlayer: MockPlayer;
let mockAnimator: MockProxy<Animator>;
let mockTimer: MockProxy<Timer>;

function createQuestion(fieldsUnderTest?: Partial<CurrentQuestionMetadata & Question>): CurrentQuestionMetadata & Question {
    return Object.assign({
        i: 0,
        startTime: 0,
        hasEnded: false,
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
    }, fieldsUnderTest);
}

beforeEach(() => {
    MockYouTube = jest.fn();
    MockYouTube.mockReturnValue(<div>YouTube</div>);
    mockPlayer = {
        playVideo: jest.fn(),
        seekTo: jest.fn()
    };
    mockAnimator = mock<Animator>();
    mockTimer = mock<Timer>();
});

function ExampleQuestionViewer(props: QuestionViewerProps) {
    return QuestionViewer(MockYouTube, mockAnimator, mockTimer, props);
}

test('it renders Countdown component to question startTime', () => {
    const animate = createTestDirector(mockAnimator);

    mockTimer.now.mockReturnValue(5000);

    const question = createQuestion({
        startTime: 10000,
    });
    render(<ExampleQuestionViewer question={question} />);

    act(() => {
        animate();
    });

    expect(screen.getByText('5')).toBeInTheDocument();
});

test('it sends correct options to the video', () => {
    const question = createQuestion({
        startTime: 10000,
        questionStartTime: 2000,
        endTime: 4000,
        videoID: 'foo-id'
    });
    render(<ExampleQuestionViewer question={question} />);

    const { videoId, opts } = MockYouTube.mock.calls[0][0];

    expect(videoId).toEqual('foo-id');

    expect(opts?.playerVars).toEqual(expect.objectContaining({
        start: 2000,
        end: 4000
    }));
});

test('it plays the video when it is ready and the startTime is reached', () => {
    const animate = createTestDirector(mockAnimator);

    const question = createQuestion({
        startTime: 10000,
        questionStartTime: 2000,
        endTime: 4000,
        videoID: 'foo-id'
    });
    render(<ExampleQuestionViewer question={question} />);

    const { onReady } = MockYouTube.mock.calls[0][0];

    onReady && onReady({
        target: mockPlayer
    });

    mockTimer.now.mockReturnValue(9999);
    act(() => {
        animate();
    });

    expect(mockPlayer.playVideo).not.toHaveBeenCalled();

    mockTimer.now.mockReturnValue(10000);
    act(() => {
        animate();
    });

    expect(mockPlayer.playVideo).toHaveBeenCalled();
});

test('it seeks forward if video is ready after startTime', () => {
    const animate = createTestDirector(mockAnimator);

    const question = createQuestion({
        startTime: 10000,
        questionStartTime: 20,
        endTime: 40,
        videoID: 'foo-id'
    });
    render(<ExampleQuestionViewer question={question} />);

    const { onReady } = MockYouTube.mock.calls[0][0];

    onReady && onReady({
        target: mockPlayer
    });

    mockTimer.now.mockReturnValue(15000);
    act(() => {
        animate();
    });

    expect(mockPlayer.seekTo).toHaveBeenCalledWith(25, true);
});

test('it does not play video if elapsed time passes end time', () => {
    const animate = createTestDirector(mockAnimator);

    const question = createQuestion({
        startTime: 10000,
        questionStartTime: 20,
        endTime: 30,
        videoID: 'foo-id'
    });
    render(<ExampleQuestionViewer question={question} />);

    const { onReady } = MockYouTube.mock.calls[0][0];

    onReady && onReady({
        target: mockPlayer
    });

    mockTimer.now.mockReturnValue(20000);
    act(() => {
        animate();
    });

    expect(mockPlayer.seekTo).not.toHaveBeenCalled();
    expect(mockPlayer.playVideo).not.toHaveBeenCalled();
});
