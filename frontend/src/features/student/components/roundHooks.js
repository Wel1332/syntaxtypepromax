// The clock and the end-of-round report that every class round shares.

import { useEffect, useRef } from 'react';
import { TICK_SECONDS } from '../data/challengeRounds';

/**
 * Ticks while `running`. Each tick carries the real seconds since the last one:
 * browsers slow timers in a background tab, and counting fixed steps would let
 * a student stop the clock by switching tabs.
 */
export function useRoundClock(dispatch, running) {
    useEffect(() => {
        if (!running) return undefined;
        let last = performance.now();
        const timer = setInterval(() => {
            const now = performance.now();
            dispatch({ type: 'tick', seconds: (now - last) / 1000 });
            last = now;
        }, TICK_SECONDS * 1000);
        return () => clearInterval(timer);
    }, [dispatch, running]);
}

/** Reports the finished round exactly once. */
export function useFinishOnce(state, onFinish) {
    const reported = useRef(false);
    useEffect(() => {
        if (state.done && !reported.current) {
            reported.current = true;
            onFinish(state);
        }
    }, [state, onFinish]);
}
