package com.syntaxtype.demo.core.exception;

import org.springframework.http.HttpStatus;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

// @ControllerAdvice // Applied to all @Controller classes
public class GlobalExceptionHandler {

    // @ExceptionHandler(Exception.class)
    // @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    // public String handleGenericError(Exception ex, Model model) {
    //     model.addAttribute("errorMessage", "An unexpected error occurred.");
    //     model.addAttribute("errorDetails", ex.getMessage());
    //     return "error/generic"; // Name of your generic error HTML page
    // }

    // @ExceptionHandler(RuntimeException.class)
    // @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    // public String handleRuntimeException(RuntimeException ex, Model model) {
    //     model.addAttribute("errorMessage", "A runtime error occurred.");
    //     model.addAttribute("errorDetails", ex.getMessage());
    //     return "error/runtime"; // Name of your runtime error HTML page
    // }

    // // You can add more specific exception handlers here
    // @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    // @ResponseStatus(HttpStatus.CONFLICT)
    // public String handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex, Model model) {
    //     model.addAttribute("errorMessage", "Data integrity violation.");
    //     model.addAttribute("errorDetails", "This usually indicates a duplicate entry or a constraint violation.");
    //     return "error/data-integrity"; // Name of your data integrity error HTML page
    // }
}