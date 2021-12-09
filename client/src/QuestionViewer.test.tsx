import { render, screen } from '@testing-library/react';
import { MockProxy, mock } from 'jest-mock-extended';
import { act } from 'react-dom/test-utils';
import { CountdownProps } from './Countdown';

import { Animator, createTestDirector } from './lib/Animator';
import { Timer } from './lib/Timer';

import QuestionViewer, { QuestionViewerProps } from './QuestionViewer';

import { createCurrentQuestion } from './Round.test';

type MockPlayer = {
    playVideo: jest.MockedFunction<() => void>,
    seekTo: jest.MockedFunction<(seconds: number, allowSeekAhead: boolean) => void>
}

let MockCountdown: jest.MockedFunction<React.FunctionComponent<CountdownProps>>;
let MockYouTube: any;
let mockPlayer: MockPlayer;
let mockAnimator: MockProxy<Animator>;
let mockTimer: MockProxy<Timer>;

beforeEach(() => {
    MockCountdown = jest.fn();
    MockCountdown.mockReturnValue(<div>Countdown</div>);
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
    return QuestionViewer(MockCountdown, MockYouTube, mockAnimator, mockTimer, props);
}

test('it shows Countdown component', () => {
    const question = createCurrentQuestion({
        startTime: 1000,
    });
    render(<ExampleQuestionViewer question={question} />);

    const countdownElement = screen.getByText(/Countdown/i);
    expect(countdownElement).toBeInTheDocument();

    expect(MockCountdown).toBeCalledWith({ endsAt: 1000 }, expect.anything());
});

test('it sends correct options to the video', () => {
    const question = createCurrentQuestion({
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

    const question = createCurrentQuestion({
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

    const question = createCurrentQuestion({
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

    const question = createCurrentQuestion({
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
