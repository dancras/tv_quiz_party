import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { BehaviorSubject, Observable } from 'rxjs';
import { useObservable } from '../Lib/RxReact';
import { QuestionTimings } from '../Model/QuestionTimer';
import { createTimings } from '../Model/QuestionTimer.test';
import { CurrentQuestion } from '../Model/Round';
import { createCurrentQuestion } from '../Model/Round.test';
import { useQuestionTimings } from './QuestionTimingsHook';

test('it sets up question timings', () => {
    const question = createCurrentQuestion();
    const mockSetup: jest.MockedFunction<(question: CurrentQuestion) => Observable<QuestionTimings>> = jest.fn();
    mockSetup.mockReturnValue(new BehaviorSubject(createTimings(1)));

    function Fixture() {
        const timings = useQuestionTimings(mockSetup, question);
        return (
            <div>{ timings.hasStarted ? 'foo' : 'bar' }</div>
        );
    }

    render(<Fixture />);

    expect(screen.getByText('foo')).toBeInTheDocument();
});

test('it does not setup new timings every render', () => {
    const question = createCurrentQuestion();
    const mockSetup: jest.MockedFunction<(question: CurrentQuestion) => Observable<QuestionTimings>> = jest.fn();
    const timings$ = new BehaviorSubject(createTimings(1));
    mockSetup.mockReturnValue(timings$);

    function Fixture() {
        const timings = useQuestionTimings(mockSetup, question);
        return (
            <div>{ timings.hasStarted ? 'foo' : 'bar' }</div>
        );
    }

    render(<Fixture />);

    act(() => {
        timings$.next(createTimings(0));
    });

    expect(mockSetup).toHaveBeenCalledTimes(1);
});

test('it sets up new timings if the question changes', () => {
    const question$ = new BehaviorSubject(createCurrentQuestion());
    const mockSetup: jest.MockedFunction<(question: CurrentQuestion) => Observable<QuestionTimings>> = jest.fn();
    const timings$ = new BehaviorSubject(createTimings(1));
    mockSetup.mockReturnValue(timings$);

    function Fixture() {
        const question = useObservable(question$);
        const timings = useQuestionTimings(mockSetup, question);
        return (
            <div>{ timings.hasStarted ? 'foo' : 'bar' }</div>
        );
    }

    render(<Fixture />);

    act(() => {
        question$.next(createCurrentQuestion());
    });

    expect(mockSetup).toHaveBeenCalledTimes(2);
});
