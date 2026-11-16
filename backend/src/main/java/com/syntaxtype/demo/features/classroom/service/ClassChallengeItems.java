package com.syntaxtype.demo.features.classroom.service;

import com.syntaxtype.demo.core.enums.ContentGame;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Checks a teacher's items against what each game can actually play, and keeps
 * only the fields the game reads. Every message names the item, so the teacher
 * can find the problem in a long list.
 */
final class ClassChallengeItems {

    static final int MAX_ITEMS = 50;

    // Bug Smasher drops lines from this pool continuously; fewer than four repeat
    // too often to be a challenge. Matches the floor the game uses for authored banks.
    static final int MIN_BUG_SMASHER_ITEMS = 4;

    private static final Set<String> DIFFICULTIES = Set.of("easy", "medium", "hard");

    private ClassChallengeItems() {
    }

    static List<Map<String, Object>> validate(ContentGame game, List<Map<String, Object>> items) {
        if (items == null || items.isEmpty()) {
            throw bad("Add at least one item.");
        }
        if (items.size() > MAX_ITEMS) {
            throw bad("A challenge can have at most " + MAX_ITEMS + " items.");
        }
        if (game == ContentGame.FALLING && items.size() < MIN_BUG_SMASHER_ITEMS) {
            throw bad("Bug Smasher needs at least " + MIN_BUG_SMASHER_ITEMS + " items.");
        }

        List<Map<String, Object>> clean = new ArrayList<>(items.size());
        for (int i = 0; i < items.size(); i++) {
            Map<String, Object> item = items.get(i) == null ? Map.of() : items.get(i);
            String where = "Item " + (i + 1) + ": ";
            clean.add(switch (game) {
                case SNIPER -> sniper(item, where);
                case TRANSLATION -> translation(item, where);
                case FALLING -> bugSmasher(item, where);
            });
        }
        return clean;
    }

    // Syntax Sniper treats every "_" in the code as a blank and compares each
    // keystroke against one answer, so blanks and answers must pair up one-to-one
    // and every answer must be a single key.
    private static Map<String, Object> sniper(Map<String, Object> item, String where) {
        String title = requiredText(item, "title", where, 80);
        String code = requiredText(item, "code", where, 1000);

        if (!(item.get("answers") instanceof List<?> rawAnswers) || rawAnswers.isEmpty()) {
            throw bad(where + "answers are required.");
        }
        List<String> answers = new ArrayList<>(rawAnswers.size());
        for (Object answer : rawAnswers) {
            if (!(answer instanceof String s) || s.length() != 1 || s.isBlank()) {
                throw bad(where + "each answer must be exactly one character.");
            }
            answers.add(s);
        }

        long blanks = code.chars().filter(ch -> ch == '_').count();
        if (blanks != answers.size()) {
            throw bad(where + "the code has " + plural(blanks, "blank") + " (_) but "
                    + plural(answers.size(), "answer") + ".");
        }

        Map<String, Object> clean = new LinkedHashMap<>();
        clean.put("title", title);
        clean.put("code", code);
        clean.put("answers", answers);
        clean.put("difficulty", difficulty(item, where));
        return clean;
    }

    private static Map<String, Object> translation(Map<String, Object> item, String where) {
        Map<String, Object> clean = new LinkedHashMap<>();
        clean.put("prompt", requiredText(item, "prompt", where, 300));
        clean.put("solution", requiredText(item, "solution", where, 300));
        clean.put("difficulty", difficulty(item, where));
        String topic = optionalText(item, "topic", where, 60);
        if (topic != null) {
            clean.put("topic", topic);
        }
        return clean;
    }

    private static Map<String, Object> bugSmasher(Map<String, Object> item, String where) {
        String buggy = requiredText(item, "buggy", where, 200);
        String correct = requiredText(item, "correct", where, 200);
        if (buggy.equals(correct)) {
            throw bad(where + "the buggy line and the correct line must differ.");
        }
        String category = optionalText(item, "category", where, 60);

        Map<String, Object> clean = new LinkedHashMap<>();
        clean.put("buggy", buggy);
        clean.put("correct", correct);
        clean.put("category", category == null ? "custom" : category);
        return clean;
    }

    private static String difficulty(Map<String, Object> item, String where) {
        String value = optionalText(item, "difficulty", where, 10);
        if (value == null) {
            return "medium";
        }
        if (!DIFFICULTIES.contains(value)) {
            throw bad(where + "difficulty must be easy, medium or hard.");
        }
        return value;
    }

    private static String requiredText(Map<String, Object> item, String field, String where, int max) {
        String value = optionalText(item, field, where, max);
        if (value == null) {
            throw bad(where + field + " is required.");
        }
        return value;
    }

    private static String optionalText(Map<String, Object> item, String field, String where, int max) {
        Object raw = item.get(field);
        if (raw == null) {
            return null;
        }
        if (!(raw instanceof String s)) {
            throw bad(where + field + " must be text.");
        }
        String value = s.strip();
        if (value.isEmpty()) {
            return null;
        }
        if (value.length() > max) {
            throw bad(where + field + " must be at most " + max + " characters.");
        }
        return value;
    }

    private static String plural(long n, String word) {
        return n + " " + word + (n == 1 ? "" : "s");
    }

    private static ResponseStatusException bad(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }
}
