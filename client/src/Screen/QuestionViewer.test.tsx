import { render, screen } from '@testing-library/react';
import { mock, MockProxy } from 'jest-mock-extended';
import { act } from 'react-dom/test-utils';
import { CountdownProps } from '../Component/Countdown';
import { QuestionTimingsHook } from '../Hook/QuestionTimingsHook';
import { mockHook } from '../Lib/Test';
import { Timer } from '../Lib/Timer';
import CurrentQuestion from '../Model/CurrentQuestion';
import { createCurrentQuestion } from '../Model/CurrentQuestion.test';
import { createTimings } from '../Model/QuestionTimer.test';
import QuestionViewer, { QuestionViewerProps } from './QuestionViewer';

type MockPlayer = {
    playVideo: jest.MockedFunction<() => void>,
    seekTo: jest.MockedFunction<(seconds: number, allowSeekAhead: boolean) => void>,
    getPlayerState: jest.MockedFunction<() => number>
}

let MockCountdown: jest.MockedFunction<React.FunctionComponent<CountdownProps>>;
let MockYouTube: any;
let mockPlayer: MockPlayer;
let useQuestionTimings: jest.MockedFunction<QuestionTimingsHook<CurrentQuestion>>;
let mockTimer: MockProxy<Timer>;

beforeEach(() => {
    MockCountdown = jest.fn();
    MockCountdown.mockReturnValue(<div>Countdown</div>);
    MockYouTube = jest.fn();
    MockYouTube.mockReturnValue(<div>YouTube</div>);
    mockPlayer = {
        playVideo: jest.fn(),
        seekTo: jest.fn(),
        getPlayerState: jest.fn()
    };
    useQuestionTimings = mockHook<QuestionTimingsHook<CurrentQuestion>>(createTimings(0));
    mockTimer = mock<Timer>();
});

function ExampleQuestionViewer(props: QuestionViewerProps) {
    return QuestionViewer(MockCountdown, MockYouTube, useQuestionTimings, mockTimer, props);
}

test('question timings are setup with currentQuestion', () => {
    const expectedQuestion = createCurrentQuestion();

    render(<ExampleQuestionViewer question={expectedQuestion} />);

    expect(useQuestionTimings).toHaveBeenCalledWith(expectedQuestion);
});

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

test('it plays the video when player is ready and question has started', () => {
    const question = createCurrentQuestion();

    render(<ExampleQuestionViewer question={question} />);

    const { onReady } = MockYouTube.mock.calls[0][0];

    mockPlayer.getPlayerState.mockReturnValue(5);

    act(() => {
        onReady && onReady({
            target: mockPlayer
        });
    });

    expect(mockPlayer.playVideo).not.toHaveBeenCalled();

    act(() => {
        useQuestionTimings.mockReturnValue(createTimings(1));
    });

    expect(mockPlayer.playVideo).toHaveBeenCalled();
});

test('it does not play if video state is not 5 video cued', () => {
    const question = createCurrentQuestion({
        startTime: 10000,
        questionStartTime: 20,
        endTime: 30,
        videoID: 'foo-id'
    });
    render(<ExampleQuestionViewer question={question} />);

    const { onReady } = MockYouTube.mock.calls[0][0];

    mockPlayer.getPlayerState.mockReturnValue(0);

    act(() => {
        onReady && onReady({
            target: mockPlayer
        });

        useQuestionTimings.mockReturnValue(createTimings(1));
    });

    expect(mockPlayer.seekTo).not.toHaveBeenCalled();
    expect(mockPlayer.playVideo).not.toHaveBeenCalled();
});

test('it seeks forward if player is ready after question has started', () => {
    const question = createCurrentQuestion({
        startTime: 10000,
        questionStartTime: 20,
        endTime: 40
    });

    render(<ExampleQuestionViewer question={question} />);

    const { onReady } = MockYouTube.mock.calls[0][0];

    mockPlayer.getPlayerState.mockReturnValue(5);
    mockTimer.now.mockReturnValue(15000);

    act(() => {
        onReady && onReady({
            target: mockPlayer
        });

        useQuestionTimings.mockReturnValue(createTimings(1));
    });

    expect(mockPlayer.seekTo).toHaveBeenCalledWith(25, true);
});

test('it does not play video if question has ended', () => {
    const question = createCurrentQuestion({
        startTime: 10000,
        questionStartTime: 20,
        endTime: 30,
        videoID: 'foo-id'
    });
    render(<ExampleQuestionViewer question={question} />);

    const { onReady } = MockYouTube.mock.calls[0][0];

    mockPlayer.getPlayerState.mockReturnValue(5);

    act(() => {
        onReady && onReady({
            target: mockPlayer
        });

        useQuestionTimings.mockReturnValue(createTimings(5));
    });

    expect(mockPlayer.seekTo).not.toHaveBeenCalled();
    expect(mockPlayer.playVideo).not.toHaveBeenCalled();
});
