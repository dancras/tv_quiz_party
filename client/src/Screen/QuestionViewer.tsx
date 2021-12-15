import { useEffect, useState } from 'react';
import { YouTubeProps } from 'react-youtube';

import { Timer } from '../Lib/Timer';

import { CurrentQuestion } from '../Model/Round';

import { CountdownProps } from '../Component/Countdown';
import { useObservable } from '../Lib/RxReact';
import { Observable } from 'rxjs';
import { QuestionTimings } from '../Model/QuestionTimer';

export type QuestionViewerProps = {
    question: CurrentQuestion
}

function QuestionViewer(
    Countdown: React.FunctionComponent<CountdownProps>,
    YouTube: React.ComponentClass<YouTubeProps>,
    currentQuestionTimings$: Observable<QuestionTimings>,
    timer: Timer,
    { question } : QuestionViewerProps
) {
    // IMPORTANT: Anything that causes re-renders, eg React.useState, can lose the references to
    // the YouTube component. If state becomes necessary again, ensure that the opts value doesn't
    // change when re-rendering. This can be achieved using refs.

    const [player, setPlayer] = useState<any>(null);

    const timings = useObservable(currentQuestionTimings$);

    useEffect(() => {
        if (timings.hasStarted && player && !timings.hasEnded && player.getPlayerState() === 5) {
            player.seekTo(question.questionStartTime + (timer.now() - question.startTime) / 1000, true);
            player.playVideo();
        }
    });

    const opts = {
        playerVars: {
            autoplay: 0 as 0,
            controls: 0 as 0,
            start: question.questionStartTime,
            end: question.endTime
        }
    };

    function onReady(event: { target: any }) {
        setPlayer(event.target);
    }

    return (
        <div>
            <YouTube videoId={question.videoID} opts={opts} onReady={onReady} />
            <Countdown endsAt={question.startTime} />
        </div>
    );
}

export default QuestionViewer;
