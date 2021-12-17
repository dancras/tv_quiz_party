import { useRef } from 'react';
import { Observable } from 'rxjs';
import { ensureObservable, useObservable } from '../Lib/RxReact';
import { QuestionTimings } from '../Model/QuestionTimer';
import CurrentQuestion from '../Model/CurrentQuestion';

export type QuestionTimingsHook<T extends CurrentQuestion | undefined> =
    (question: T) => T extends CurrentQuestion ? QuestionTimings : undefined;

export function useQuestionTimings(
    setupTimings: (question: CurrentQuestion) => Observable<QuestionTimings>,
    question: CurrentQuestion
): QuestionTimings;
export function useQuestionTimings(
    setupTimings: (question: CurrentQuestion) => Observable<QuestionTimings>,
    question: CurrentQuestion | undefined
): QuestionTimings | undefined;
export function useQuestionTimings(
    setupTimings: (question: CurrentQuestion) => Observable<QuestionTimings>,
    question: CurrentQuestion | undefined
): QuestionTimings | undefined {
    const questionRef = useRef<CurrentQuestion | undefined>();
    const timingsRef$ = useRef<Observable<QuestionTimings> | undefined>();

    // The last case can never be reached but it informs the type system
    if (question && (!questionRef.current || questionRef.current !== question || !timingsRef$.current)) {
        questionRef.current = question;
        timingsRef$.current = setupTimings(question);
    }

    return useObservable(ensureObservable(timingsRef$.current, undefined));
}
