import { render, screen } from '@testing-library/react';
import { MockProxy, mock } from 'jest-mock-extended';
import { act } from 'react-dom/test-utils';

import { Animator, createTestDirector } from './lib/Animator';

import QuestionViewer, { QuestionViewerProps, TimeProvider } from './QuestionViewer';
import { CurrentQuestionMetadata, Question } from './Round';

type MockPlayer = {
    playVideo: jest.MockedFunction<() => void>
}

let MockYouTube: any;
let mockPlayer: MockPlayer;
let mockWindow: MockProxy<Animator>;
let MockDate: MockProxy<TimeProvider>;

function createQuestion(fieldsUnderTest: Partial<CurrentQuestionMetadata & Question>): CurrentQuestionMetadata & Question {
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
        playVideo: jest.fn()
    };
    mockWindow = mock<Animator>();
    MockDate = mock<TimeProvider>();
});

function ExampleQuestionViewer(props: QuestionViewerProps) {
    return QuestionViewer(MockYouTube, mockWindow, MockDate, props);
}

test('it shows a countdown before question startTime is reached', () => {
    const animate = createTestDirector(mockWindow);

    MockDate.now.mockReturnValue(5000);

    const question = createQuestion({
        startTime: 10000,
    });
    render(<ExampleQuestionViewer question={question} />);

    expect(screen.getByText('5')).toBeInTheDocument();

    MockDate.now.mockReturnValue(5001);
    act(() => {
        animate();
    });
    expect(screen.getByText('4')).toBeInTheDocument();

    MockDate.now.mockReturnValue(5999);
    act(() => {
        animate();
    });
    expect(screen.getByText('4')).toBeInTheDocument();

    MockDate.now.mockReturnValue(10001);
    act(() => {
        animate();
    });
    expect(screen.getByText('0')).toBeInTheDocument();
});

test('it starts the video at questionStartTime when startTime is reached after player is loaded', () => {
    const animate = createTestDirector(mockWindow);

    MockDate.now.mockReturnValue(9999);

    const question = createQuestion({
        startTime: 10000,
        questionStartTime: 2000,
        endTime: 4000,
        videoID: 'foo-id'
    });
    render(<ExampleQuestionViewer question={question} />);

    const { videoId, opts, onReady } = MockYouTube.mock.calls[0][0];

    expect(videoId).toEqual('foo-id');

    expect(opts?.playerVars).toEqual(expect.objectContaining({
        start: 2000,
        end: 4000
    }));

    onReady && onReady({
        target: mockPlayer
    });

    act(() => {
        animate();
    });

    expect(mockPlayer.playVideo).not.toHaveBeenCalled();

    MockDate.now.mockReturnValue(10000);
    act(() => {
        animate();
    });

    expect(mockPlayer.playVideo).toHaveBeenCalled();
});

test('it adds elapsed time to questionStartTime when player is loaded after startTime', () => {
    const animate = createTestDirector(mockWindow);

    MockDate.now.mockReturnValue(13000);

    const question = createQuestion({
        startTime: 10000,
        questionStartTime: 20,
        endTime: 50,
        videoID: 'foo-id'
    });
    render(<ExampleQuestionViewer question={question} />);

    const { opts, onReady } = MockYouTube.mock.calls[0][0];

    expect(opts?.playerVars).toEqual(expect.objectContaining({
        start: 23,
        end: 50
    }));

    act(() => {
        animate();
    });

    onReady && onReady({
        target: mockPlayer
    });

    act(() => {
        animate();
    });

    expect(mockPlayer.playVideo).toHaveBeenCalled();
});

test('it does not load video if elapsed time passes end time', () => {
    const animate = createTestDirector(mockWindow);

    MockDate.now.mockReturnValue(20000);

    const question = createQuestion({
        startTime: 10000,
        questionStartTime: 20,
        endTime: 30,
        videoID: 'foo-id'
    });
    render(<ExampleQuestionViewer question={question} />);

    act(() => {
        animate();
    });

    expect(MockYouTube).not.toHaveBeenCalled();
});

test('it does not cause YouTube component to reinitialise as elapsed time advances', () => {
    const animate = createTestDirector(mockWindow);

    MockDate.now.mockReturnValue(5000);

    const question = createQuestion({
        startTime: 10000,
        questionStartTime: 20,
        endTime: 50,
        videoID: 'foo-id'
    });
    render(<ExampleQuestionViewer question={question} />);

    const { onReady } = MockYouTube.mock.calls[0][0];

    onReady && onReady({
        target: mockPlayer
    });

    act(() => {
        animate();
    });

    MockDate.now.mockReturnValue(15000);

    act(() => {
        animate();
    });

    expect(MockYouTube.mock.calls[0][0].opts).toEqual(MockYouTube.mock.calls[1][0].opts);
});
