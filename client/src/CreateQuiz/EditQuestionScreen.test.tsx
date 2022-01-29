import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditQuestionScreen from './EditQuestionScreen';

type MockPlayer = {
    playVideo: jest.MockedFunction<() => void>,
    seekTo: jest.MockedFunction<(seconds: number, allowSeekAhead: boolean) => void>,
    getPlayerState: jest.MockedFunction<() => number>,
    getCurrentTime: jest.MockedFunction<() => number>,
}

let MockYouTube: any;
let mockPlayer: MockPlayer;

function ExampleEditQuestionScreen() {
    return EditQuestionScreen(MockYouTube);
}

beforeEach(() => {
    MockYouTube = jest.fn();
    MockYouTube.mockReturnValue(<div>YouTube</div>);
    mockPlayer = {
        playVideo: jest.fn(),
        seekTo: jest.fn(),
        getPlayerState: jest.fn(),
        getCurrentTime: jest.fn(),
    };
});

test('it loads a YouTube player for the provided url', () => {
    const YouTubeID = 'qBB_QOZNEdc';
    render(<ExampleEditQuestionScreen />);

    const field = screen.getByLabelText('YouTube URL') as HTMLInputElement;
    userEvent.paste(field, `https://www.youtube.com/watch?v=${YouTubeID}`);

    expect(field.value).toEqual('');
    expect(field.placeholder).toEqual(YouTubeID);

    const { videoId } = MockYouTube.mock.calls[0][0];

    expect(videoId).toEqual(YouTubeID);
});

test('time fields can read current position from video', () => {
    render(<ExampleEditQuestionScreen />);

    userEvent.paste(
        screen.getByLabelText('YouTube URL'),
        'https://www.youtube.com/watch?v=qBB_QOZNEdc'
    );

    const { onReady } = MockYouTube.mock.calls[0][0];

    act(() => {
        onReady && onReady({
            target: mockPlayer
        });
    });

    const field = screen.getByLabelText('Start Position') as HTMLInputElement;
    const readTimeButton = field.nextElementSibling as HTMLButtonElement;

    mockPlayer.getCurrentTime.mockReturnValue(55.12346);
    userEvent.click(readTimeButton);

    expect(field.value).toEqual('55.1235');
});

test('time fields can seek their to position in the video', () => {
    render(<ExampleEditQuestionScreen />);

    userEvent.paste(
        screen.getByLabelText('YouTube URL'),
        'https://www.youtube.com/watch?v=qBB_QOZNEdc'
    );

    const { onReady } = MockYouTube.mock.calls[0][0];

    act(() => {
        onReady && onReady({
            target: mockPlayer
        });
    });

    const field = screen.getByLabelText('Start Position') as HTMLInputElement;
    const seekTimeButton = field.nextElementSibling?.nextElementSibling as HTMLButtonElement;

    userEvent.type(field, '12.5');
    userEvent.click(seekTimeButton);

    expect(mockPlayer.seekTo).toHaveBeenCalledWith(12.5, expect.anything());
});
