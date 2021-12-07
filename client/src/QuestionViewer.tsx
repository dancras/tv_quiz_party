import React, { useEffect } from 'react';
import { YouTubeProps } from 'react-youtube';

import { Animator } from './lib/Animator';

import { CurrentQuestionMetadata, Question } from './Round';

export type QuestionViewerProps = {
    question: CurrentQuestionMetadata & Question
}

export interface TimeProvider {
    now(): number
}

function QuestionViewer(
    YouTube: React.ComponentClass<YouTubeProps>,
    window: Animator,
    Date: TimeProvider,
    { question } : QuestionViewerProps
) {
    const [timeToStart, setTimeToStart] = React.useState(question.startTime - Date.now());

    const initialTimeToStartRef = React.useRef<number>(timeToStart);

    const animateRef = React.useRef<number | null>(null);

    const playerRef = React.useRef<any>(null);

    function animate() {
        const nextTimeToStart = question.startTime - Date.now();
        setTimeToStart(nextTimeToStart);
        animateRef.current = window.requestAnimationFrame(animate);

        if (nextTimeToStart <= 0 && playerRef.current) {
            playerRef.current.playVideo();
            window.cancelAnimationFrame(animateRef.current);
        }
    };

    function displayTimeToStart() {
        return Math.floor(Math.max(0, timeToStart) / 1000);
    }

    useEffect(() => {
        animateRef.current = window.requestAnimationFrame(animate);
        return () => animateRef.current ? window.cancelAnimationFrame(animateRef.current) : void(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const dumpQuestion = JSON.stringify(question, undefined, 2);

    const questionStartTime = question.questionStartTime - Math.floor(Math.min(0, initialTimeToStartRef.current / 1000));

    const opts = {
        playerVars: {
            autoplay: 0 as 0,
            controls: 0 as 0,
            start: questionStartTime,
            end: question.endTime
        }
    };

    function onReady(event: { target: any }) {
        playerRef.current = event.target;
    }

    return (
        <div>
            { questionStartTime < question.endTime ?
                <YouTube videoId={question.videoID} opts={opts} onReady={onReady} /> :
                <></>
            }
            <div>{displayTimeToStart()}</div>
            <div>{dumpQuestion}</div>
        </div>
    );
}

export default QuestionViewer;
