import { Observable, distinctUntilChanged, shareReplay } from 'rxjs';
import equals from 'shallow-equals';

import { Animator } from '../Lib/Animator';
import { Timer } from '../Lib/Timer';
import { CurrentQuestion } from './Round';

export type QuestionTimings = {
    hasStarted: boolean,
    displayAnswers: boolean,
    lockAnswers: boolean,
    revealAnswer: boolean,
    hasEnded: boolean
}

export function setupQuestionTimer(
    animator: Animator,
    timer: Timer,
    question: CurrentQuestion
): Observable<QuestionTimings> {

    function hasPassed(seconds: number) {
        return timer.now() - question.startTime >= seconds * 1000;
    }

    const timings$ = new Observable<QuestionTimings>(subscriber => {
        let animationHandle: number;

        function animate() {
            subscriber.next({
                hasStarted: hasPassed(0),
                displayAnswers: hasPassed(question.questionDisplayTime - question.questionStartTime),
                lockAnswers: hasPassed(question.answerLockTime - question.questionStartTime),
                revealAnswer: hasPassed(question.answerRevealTime - question.questionStartTime),
                hasEnded: hasPassed(question.endTime - question.questionStartTime)
            });
            animationHandle = animator.requestAnimationFrame(animate);
        }

        animate();

        return () => animator.cancelAnimationFrame(animationHandle);
    });

    return timings$.pipe(
        distinctUntilChanged(equals),
        shareReplay({
            bufferSize: 1,
            refCount: true
        })
    );
}
