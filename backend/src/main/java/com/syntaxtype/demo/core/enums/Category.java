package com.syntaxtype.demo.core.enums;

public enum Category {
    TYPING_TESTS,
    FALLING_WORDS,
    GALAXY,
    GRID,
    BOOKWORM,
    CROSSWORD,
    FOUR_PICS,
    CODE_CHALLENGES,
    MAP,
    // Despite the name, SYNTAX_SAVER is the Syntax Sniper *game* — the label maps
    // in Dashboard.js and AnalyticsController.GAME_LABELS both read it that way,
    // and it is one of the three pre/post assessment games in the MVP validation
    // study. Renaming it would require migrating the challenge_type strings
    // already stored in the scores table, so the name stays and this comment
    // carries the meaning.
    SYNTAX_SAVER,
    // The Syntax Saver *lesson* — a guided tutorial that submits a score only to
    // award XP and trigger badges. Kept separate from SYNTAX_SAVER so its
    // untagged, fixed-accuracy submissions cannot contaminate Syntax Sniper's
    // pre/post assessment data.
    SYNTAX_SAVER_LESSON,
    CHALLENGES,
    // Logic Puzzles — read-and-reason challenges over C constructs (Objective
    // 5.2). Submissions carry no modeType and report wpm 0: nothing is typed, so
    // a WPM figure here would pollute the typing statistics the study measures.
    LOGIC_PUZZLES,
    OVERALL
}