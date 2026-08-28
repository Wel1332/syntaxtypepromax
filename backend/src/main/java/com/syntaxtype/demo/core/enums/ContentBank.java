package com.syntaxtype.demo.core.enums;

/**
 * Which bank an item belongs to. The banks are kept disjoint so Practice cannot
 * leak the Pre-Test / Post-Test answer key — a property the study depends on.
 */
public enum ContentBank {
    PRACTICE,
    TEST
}
