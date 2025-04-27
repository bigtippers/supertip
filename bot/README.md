# Bluesky Tip Bot

A bot that monitors Bluesky notifications for tip commands in the format of `/tip amount` sent as mentions to your account.

## Features

- Uses Bluesky's notifications API to directly monitor mentions
- Detects tip commands with the pattern `/tip amount`
- Marks notifications as read automatically
- Implements proper pagination to handle multiple pages of notifications
- Robust error handling and automatic recovery
- Configurable via environment variables
- Easily extendable for actual payment processing

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure your `.env` file with your Bluesky credentials:
   ```
   BSKY_IDENTIFIER=your.handle.bsky.social
   BSKY_PASSWORD=your_app_password
   POLLING_INTERVAL=30000  # milliseconds
   ```

## Usage

Start the bot with:
```
npm start
```

For more reliable operation, use the included shell script which will automatically restart the bot if it crashes:
```
./start.sh
```

The bot will monitor for mentions with tip commands and log them to the console. When someone mentions your Bluesky account with a message like `@yourusername /tip 0.5`, the bot will detect it as a tip command.

To implement actual tipping functionality, you'll need to modify the `processTip` function in `index.js`.

## How it Works

The bot uses the Bluesky API's `listNotifications` endpoint to get notifications (mentions) of your account. Key features:

1. **Efficient Notification Processing**: Only processes mentions, ignoring other notification types
2. **Pagination**: Fetches up to 3 pages of notifications to ensure all mentions are processed
3. **Automatic Read Status**: Marks notifications as read after processing
4. **Error Recovery**: Handles API timeouts and connection issues gracefully
5. **Log Files**: Detailed error logs stored in the logs/ directory

## Troubleshooting

If the bot stops responding or encounters errors:

1. Check the log files in the `logs/` directory
2. Verify your Bluesky credentials are correct
3. Ensure you have a stable internet connection
4. Try increasing the `POLLING_INTERVAL` in your .env file

## Security Notes

- Never commit your `.env` file to version control
- Consider using an app-specific password for Bluesky rather than your main account password
- Implement appropriate validation and security measures before processing actual payments

## License

ISC 