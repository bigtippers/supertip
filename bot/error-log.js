import fs from 'fs';
import path from 'path';

// Create a logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create a log file with current timestamp
const logFileName = `error-log-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
const logFilePath = path.join(logsDir, logFileName);

// Function to write to the log file
export function logError(message, error) {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.stack || error.message : JSON.stringify(error);
  
  const logEntry = `[${timestamp}] ${message}\n${errorMessage}\n\n`;
  
  // Log to console and file
  console.error(logEntry);
  
  // Append to file asynchronously
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
}

// Export the log file path
export const LOG_FILE = logFilePath; 