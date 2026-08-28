// Loads a game's practice and test banks from the database, falling back to the
// bank compiled into the bundle (Objective 4.2).
//
// The hook returns the built-in banks synchronously on first render and swaps in
// database content once it arrives. That ordering is the point: a game must
// never render an empty deck while a fetch is in flight, because the round a
// participant plays is the data the study analyses. A slow cold start on
// Render's free tier would otherwise produce a real, recorded, empty session.
//
// `minimum` guards a half-finished import. If faculty have written three drills
// into a bank that needs six, the built-in bank is used rather than handing a
// participant a truncated assessment.

import { useEffect, useState } from 'react';
import { fetchContent } from './gameContent';

export const BANK_SOURCE = Object.freeze({
    BUILT_IN: 'built-in',
    DATABASE: 'database',
});

export function useGameBanks(game, itemType, builtInPractice, builtInTest, minimum = 1) {
    const [banks, setBanks] = useState({
        practice: builtInPractice,
        test: builtInTest,
        source: BANK_SOURCE.BUILT_IN,
        loading: true,
    });

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const [practiceRows, testRows] = await Promise.all([
                fetchContent(game, 'PRACTICE'),
                fetchContent(game, 'TEST'),
            ]);
            if (cancelled) return;

            const practice = practiceRows.filter((r) => r.itemType === itemType);
            const test = testRows.filter((r) => r.itemType === itemType);

            // Both banks must be viable before either is used. Mixing an authored
            // practice bank with a built-in test bank would break the guarantee
            // that the two are disjoint, and practice would start leaking answers.
            const usable = practice.length >= minimum && test.length >= minimum;

            setBanks({
                practice: usable ? practice : builtInPractice,
                test: usable ? test : builtInTest,
                source: usable ? BANK_SOURCE.DATABASE : BANK_SOURCE.BUILT_IN,
                loading: false,
            });
        })();

        return () => { cancelled = true; };
        // builtIn* are module constants; re-running on their identity would loop.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [game, itemType, minimum]);

    return banks;
}
