import { ChangeEvent, MutableRefObject, PropsWithChildren, useRef, useState } from 'react';
import { YouTubeProps } from 'react-youtube';
import { YouTubePlayer } from 'youtube-player/dist/types';
import { Button, Container, Form, Icon } from 'semantic-ui-react';

// #   { 'video_id': 'MZJkNYabZIM'
// #   , 'start_time': 73.0
// #   , 'question_display_time': 74.0
// #   , 'answer_lock_time': 75.0
// #   , 'answer_reveal_time': 76.0
// #   , 'end_time': 77.0
// #   , 'answer_text_1': "Red"
// #   , 'answer_text_2': "White"
// #   , 'answer_text_3': "Blue"
// #   , 'correct_answer': '2'
// #   },

function VideoTimeField({ children, playerRef }: PropsWithChildren<{ playerRef: MutableRefObject<YouTubePlayer | undefined> }>) {

    const inputRef = useRef<HTMLInputElement | null>(null);

    function handleReadTime() {
        if (inputRef.current && playerRef.current) {
            inputRef.current.value = playerRef.current.getCurrentTime().toFixed(4);
        }
    }

    function handleSeek() {
        if (inputRef.current && playerRef.current) {
            playerRef.current.seekTo(parseFloat(inputRef.current.value), true);
        }
    }

    return (
        <Form.Field>
            <label>
                { children }
                <input ref={inputRef} type="text" />
                <Button icon onClick={handleReadTime}><Icon name='video' /></Button>
                <Button icon onClick={handleSeek}><Icon name='forward' /></Button>
            </label>
        </Form.Field>
    );
}

function EndQuestionScreen(YouTube: React.ComponentClass<YouTubeProps>) {
    const [YouTubeID, setYouTubeID] = useState<string | null>(null);
    const playerRef = useRef<YouTubePlayer | undefined>();

    // field for YT link
    // video player to the right
    // inputs for times
    //  text input, button to pull time from vid, button to move vid to time

    // inputs for answers (3 hard coded for now)
    // bullet selector for correct answer
    // button to start preview
    // json dump area

    function handleYouTubeURLChange(event: ChangeEvent<HTMLInputElement>) {
        const YouTubeURL = new URL(event.target.value);
        const enteredYouTubeID = YouTubeURL.searchParams.get('v');

        setYouTubeID(enteredYouTubeID);
        event.target.value = '';
    }

    function onReady(event: { target: YouTubePlayer }) {
        playerRef.current = event.target;
    }

    return (
        <Container>
            <Form>
                <Form.Field>
                    <label>YouTube URL<input type="text" placeholder={YouTubeID || ''} onChange={handleYouTubeURLChange} /></label>
                </Form.Field>
                <VideoTimeField playerRef={playerRef}>Start Position</VideoTimeField>
            </Form>
            { YouTubeID &&
                <YouTube videoId={YouTubeID} onReady={onReady} />
            }
        </Container>
    );
}

export default EndQuestionScreen;
