declare module 'page-lifecycle' {

    export type LifecycleEventType = 'statechange'

    export type StateChangeEvent = {
        newState: string,
        oldState: string,
        originalEvent: Event
    }

    class Lifecycle {
        state: string
        pageWasDiscarded: boolean
        addEventListener(type: LifecycleEventType, listener: (event: StateChangeEvent) => void): void
        removeEventListener(type: LifecycleEventType, listener: (event: StateChangeEvent) => void): void
    }

    const lifecycle = new Lifecycle();

    export = lifecycle
}
