export type PartiallyApplied1<T> = T extends (x: any, ...args: infer Q) => infer R ?
    (...args: Q) => R :
    never;

export type PartiallyApplied2<T> = T extends (x: any, y: any, ...args: infer Q) => infer R ?
    (...args: Q) => R :
    never;

export type ConstructorFunction<C> =
    C extends { new(...args: infer A): infer R } ? (...args: A) => R : never;
