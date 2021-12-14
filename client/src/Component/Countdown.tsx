import React, { useEffect } from 'react';
import { Animator } from '../Lib/Animator';
import { Timer } from '../Lib/Timer';

export type CountdownProps = {
    endsAt: number
}

function Countdown(animator: Animator, timer: Timer, { endsAt }: CountdownProps) {
    const [remaining, setRemaining] = React.useState(endsAt - timer.now());

    const animateRef = React.useRef<number | null>(null);

    function animate() {
        setRemaining(endsAt - timer.now());
    };

    function displayTimeToStart() {
        return Math.ceil(Math.max(0, remaining) / 1000);
    }

    useEffect(() => {
        if (remaining >= 0) {
            animateRef.current = animator.requestAnimationFrame(animate);
        }

        return () => animateRef.current ? animator.cancelAnimationFrame(animateRef.current) : void(0);
    });

    return (<>
        { remaining > 0 ?
            <div>{displayTimeToStart()}</div> :
            <></>
        }
    </>);
}

export default Countdown;
