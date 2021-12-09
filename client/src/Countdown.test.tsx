import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { MockProxy, mock } from 'jest-mock-extended';
import Countdown, { CountdownProps } from './Countdown';
import { Animator, createTestDirector } from './lib/Animator';
import { Timer } from './lib/Timer';

let mockAnimator: MockProxy<Animator>;
let mockTimer: MockProxy<Timer>;

function ExampleCountdown(props: CountdownProps) {
    return Countdown(mockAnimator, mockTimer, props);
}

beforeEach(() => {
    mockAnimator = mock<Animator>();
    mockTimer = mock<Timer>();
});

test('it shows a countdown before question startTime is reached', () => {
    const animate = createTestDirector(mockAnimator);

    mockTimer.now.mockReturnValue(5000);

    render(<ExampleCountdown endsAt={10000} />);

    expect(screen.getByText('5')).toBeInTheDocument();

    mockTimer.now.mockReturnValue(5001);
    act(() => {
        animate();
    });
    expect(screen.getByText('5')).toBeInTheDocument();

    mockTimer.now.mockReturnValue(6000);
    act(() => {
        animate();
    });
    expect(screen.getByText('4')).toBeInTheDocument();

    mockTimer.now.mockReturnValue(9999);
    act(() => {
        animate();
    });
    expect(screen.getByText('1')).toBeInTheDocument();

    mockTimer.now.mockReturnValue(10000);
    act(() => {
        animate();
    });
    expect(screen.queryByText('0')).not.toBeInTheDocument();
});
