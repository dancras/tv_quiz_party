import { Observable, distinctUntilChanged, shareReplay } from 'rxjs';
import equals from 'shallow-equals';

import { Animator } from '../Lib/Animator';
import { Timer } from '../Lib/Timer';
import CurrentQuestion from './CurrentQuestion';

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
        return timer.now() - question.timestampToStartVideo >= seconds * 1000;
    }

    const timings$ = new Observable<QuestionTimings>(subscriber => {
        let animationHandle: number;

        function animate() {
            subscriber.next({
                hasStarted: hasPassed(0),
                displayAnswers: hasPassed(question.videoShowingAnswerOptionsPosition - question.videoStartPosition),
                lockAnswers: hasPassed(question.videoAnsweringLockedPosition - question.videoStartPosition),
                revealAnswer: hasPassed(question.videoAnswerRevealedPostion - question.videoStartPosition),
                hasEnded: hasPassed(question.videoEndPosition - question.videoStartPosition)
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
