package com.syntaxtype.demo.core.exception;

// @RestControllerAdvice
public class RestExceptionHandler {

    // @ExceptionHandler(NoSuchElementException.class)
    // @ResponseStatus(HttpStatus.NOT_FOUND)
    // public ResponseEntity<Map<String, String>> handleNoSuchElementException(NoSuchElementException ex) {
    //     Map<String, String> errorResponse = new HashMap<>();
    //     errorResponse.put("message", ex.getMessage());
    //     return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    // }

    // @ExceptionHandler(Exception.class)
    // @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    // public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
    //     Map<String, String> errorResponse = new HashMap<>();
    //     errorResponse.put("message", "An unexpected error occurred.");
    //     errorResponse.put("details", ex.getMessage());
    //     return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    // }
    
    // @ExceptionHandler(UsernameConflictException.class)
    // @ResponseStatus(HttpStatus.CONFLICT)
    // @ResponseBody // Ensures the response is written to the body
    // public Map<String, String> handleUsernameConflictException(UsernameConflictException ex) {
    //     Map<String, String> errorResponse = new HashMap<>();
    //     errorResponse.put("message", ex.getMessage());
    //     return errorResponse;
    // }

    // @ExceptionHandler(IllegalStateException.class)
    // @ResponseStatus(HttpStatus.BAD_REQUEST)
    // @ResponseBody // Ensures the response is written to the body
    // public Map<String, String> handleIllegalStateException(IllegalStateException ex) {
    //     Map<String, String> errorResponse = new HashMap<>();
    //     errorResponse.put("message", ex.getMessage());
    //     return errorResponse;
    // }
}