import { useState, useEffect, useRef } from 'react';
import { firstValueFrom, Observable, of } from 'rxjs';

const NO_VALUE = 'RxReactNoValue';

export function useObservable<T>($source: Observable<T>): T {
    const sourceRef = useRef<Observable<T> | null>(null);
    // T | 'RxReactNoValue'
    let initialValue: any = NO_VALUE;
    let returnInitialValue = false;

    if (sourceRef.current !== $source) {
        sourceRef.current = $source;
        returnInitialValue = true;

        $source.subscribe(value => initialValue = value).unsubscribe();

        if (initialValue === NO_VALUE) {
            throw firstValueFrom($source);
        }
    }

    const [value, setValue] = useState<T>(initialValue);

    useEffect(() => {
        const subscription = $source.subscribe(setValue);
        return () => subscription.unsubscribe();
    }, [$source]);

    return returnInitialValue ? initialValue : value;
};

export function ensureObservable<T, Q>($source: Observable<T> | undefined, fallback: Q): Observable<T | Q> {
    return $source === undefined ? of(fallback) : $source;
}
