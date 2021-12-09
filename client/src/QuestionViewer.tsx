import React, { useEffect } from 'react';
import { YouTubeProps } from 'react-youtube';

import { Animator } from './lib/Animator';
import { Timer } from './lib/Timer';

import { CurrentQuestionMetadata, Question } from './Round';

import Countdown, { CountdownProps } from './Countdown';

export type QuestionViewerProps = {
    question: CurrentQuestionMetadata & Question
}

function QuestionViewer(
    YouTube: React.ComponentClass<YouTubeProps>,
    animator: Animator,
    timer: Timer,
    { question } : QuestionViewerProps
) {
    // IMPORTANT: Anything that causes re-renders, eg React.useState, can lose the references to
    // the YouTube component. If state becomes necessary again, ensure that the opts value doesn't
    // change when re-rendering. This can be achieved using refs.

    const animateRef = React.useRef<number | null>(null);

    const playerRef = React.useRef<any>(null);

    function ComposedCountdown(props: CountdownProps) {
        return Countdown(animator, timer, props);
    }

    function animate() {
        const now = timer.now();
        if (question.startTime <= now && playerRef.current) {
            const elapsedTime = (now - question.startTime) / 1000;
            if (question.questionStartTime + elapsedTime < question.endTime) {
                playerRef.current.seekTo(question.questionStartTime + elapsedTime, true);
                playerRef.current.playVideo();
            }
        } else {
            animateRef.current = animator.requestAnimationFrame(animate);
        }
    };

    useEffect(() => {
        animateRef.current = animator.requestAnimationFrame(animate);
        return () => animateRef.current ? animator.cancelAnimationFrame(animateRef.current) : void(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const dumpQuestion = JSON.stringify(question, undefined, 2);

    const opts = {
        playerVars: {
            autoplay: 0 as 0,
            controls: 0 as 0,
            start: question.questionStartTime,
            end: question.endTime
        }
    };

    function onReady(event: { target: any }) {
        playerRef.current = event.target;
    }

    return (
        <div>
            <YouTube videoId={question.videoID} opts={opts} onReady={onReady} />
            <ComposedCountdown endsAt={question.startTime} />
            <div>{dumpQuestion}</div>
        </div>
    );
}

export default QuestionViewer;
