import { MockProxy } from 'jest-mock-extended';

export interface Animator {
    requestAnimationFrame(callback: FrameRequestCallback): number
    cancelAnimationFrame(handle: number): void
}

export function createTestDirector(mockAnimator: MockProxy<Animator>): (now?: number) => void {
    let nextFrame = 0;
    let nextHandle = 0;
    let cancelledFrames: number[] = [];

    mockAnimator.requestAnimationFrame.mockImplementation(() => nextHandle++);
    mockAnimator.cancelAnimationFrame.mockImplementation((handle) => cancelledFrames.push(handle));

    return function action(now = 0) {
        const lengthBeforeAction = mockAnimator.requestAnimationFrame.mock.calls.length;
        for (nextFrame; nextFrame < lengthBeforeAction; nextFrame++) {
            if (!cancelledFrames.includes(nextFrame)) {
                mockAnimator.requestAnimationFrame.mock.calls[nextFrame][0](now);
            }
        }
    };
}
