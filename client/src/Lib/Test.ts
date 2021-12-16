import { BehaviorSubject } from 'rxjs';
import { useObservable } from './RxReact';

export function mockHook<T extends (...args: any[]) => any>(initialState: ReturnType<T>): jest.MockedFunction<(...args: Parameters<T>) => ReturnType<T>> {
    const returnValue$ = new BehaviorSubject(initialState);
    const mock = jest.fn<ReturnType<T>, Parameters<T>>((...args: Parameters<T>): ReturnType<T> => {
        return useObservable(returnValue$);
    });
    mock.mockReturnValue = function (value: ReturnType<T>) {
        returnValue$.next(value);
        return this;
    };
    return mock;
}
