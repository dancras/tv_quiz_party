import React, { useEffect } from 'react';

import { CurrentQuestionMetadata, Question } from './Round';

export type QuestionViewerProps = {
    question: CurrentQuestionMetadata & Question
}

export interface TimeProvider {
    now(): number
}

export interface AnimateProvider {
    requestAnimationFrame(callback: FrameRequestCallback): number
    cancelAnimationFrame(handle: number): void
}

function QuestionViewer(window: AnimateProvider, Date: TimeProvider, { question } : QuestionViewerProps) {
    const [timeToStart, setTimeToStart] = React.useState(question.startTime - Date.now());

    const animateRef = React.useRef<number | null>(null);

    function countdown() {
        const nextTimeToStart = question.startTime - Date.now();
        setTimeToStart(nextTimeToStart);
        if (nextTimeToStart > 0) {
            animateRef.current = window.requestAnimationFrame(countdown);
        }
    };

    function displayTimeToStart() {
        return Math.floor(Math.max(0, timeToStart) / 1000);
    }

    useEffect(() => {
        animateRef.current = window.requestAnimationFrame(countdown);
        return () => animateRef.current ? window.cancelAnimationFrame(animateRef.current) : void(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const dumpQuestion = JSON.stringify(question, undefined, 2);

    return (
        <div>
            <div>{displayTimeToStart()}</div>
            <div>{dumpQuestion}</div>
        </div>
    );
}

export default QuestionViewer;
