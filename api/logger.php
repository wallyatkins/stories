<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Monolog\Logger;
use Monolog\Handler\RotatingFileHandler;
use Monolog\Formatter\JsonFormatter;
use Monolog\Processor\WebProcessor;

// Create a new logger instance
$logger = new Logger('stories_app');

// Create a handler that rotates files daily and keeps them for 14 days
$rotatingHandler = new RotatingFileHandler(__DIR__ . '/../logs/app.log', 14, Logger::DEBUG);

// Format logs as JSON
$rotatingHandler->setFormatter(new JsonFormatter());

// Add a processor to include web-specific data (IP, URL, method)
$logger->pushProcessor(new WebProcessor());

// Push the handler to the logger
$logger->pushHandler($rotatingHandler);

// Set a global exception handler to log uncaught exceptions
set_exception_handler(function (Throwable $e) use ($logger) {
    $logger->critical('Uncaught Exception', [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString(),
    ]);
    // Optionally, display a generic error message to the user
    // For an API, you might want to send a JSON response
    if (php_sapi_name() !== 'cli') {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'A critical error occurred. Please try again later.']);
    }
});


// Make the logger globally accessible (optional, but convenient for this project structure)
$GLOBALS['logger'] = $logger;
