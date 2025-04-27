// index.js
import { BskyAgent } from '@atproto/api';
import dotenv from 'dotenv';
import { logError } from './error-log.js';

// Load environment variables
dotenv.config();

// Create an agent to talk to Bluesky with a timeout
const agent = new BskyAgent({ 
  service: 'https://bsky.social',
  fetch: (url, init) => {
    // Add a 30-second timeout to all fetch requests
    return fetch(url, {
      ...init,
      signal: AbortSignal.timeout(30000) // 30 seconds timeout
    });
  }
});

// Get configuration from environment variables
const {
  BSKY_IDENTIFIER,
  BSKY_PASSWORD,
  POLLING_INTERVAL = 5000 // Default to 5 seconds
} = process.env;

// Regex to match the tip pattern: /tip amount
// This will capture the amount
const TIP_PATTERN = /\/tip\s+(\d+(\.\d+)?)/i;

// Track connection failures
let consecutiveFailures = 0;
const MAX_FAILURES = 5;

// Keep track of processed notifications to avoid duplicates
const processedNotifications = new Set();

async function main() {
  if (!BSKY_IDENTIFIER || !BSKY_PASSWORD) {
    logError('Missing required environment variables', 
      'Required variables: BSKY_IDENTIFIER, BSKY_PASSWORD');
    process.exit(1);
  }

  // Initial login
  await loginToBluesky();
  
  // Start polling
  console.log(`Starting notification polling every ${POLLING_INTERVAL/1000} seconds`);
  checkForNewMentions();
}

// Login function that can be called for initial login and re-logins
async function loginToBluesky() {
  try {
    console.log(`Attempting to log in as ${BSKY_IDENTIFIER}...`);
    await agent.login({ identifier: BSKY_IDENTIFIER, password: BSKY_PASSWORD });
    console.log('✅ Successfully logged in to Bluesky');
    console.log('🔍 Watching for tip commands in mentions...');
    return true;
  } catch (err) {
    logError('Error logging in', err);
    return false;
  }
}

// Function to check for new mentions
async function checkForNewMentions() {
  try {
    // Make sure we're still logged in
    if (!agent.session) {
      console.log('Session expired, attempting to log in again...');
      await loginToBluesky();
    }
    
    // Get all mention notifications
    const mentions = await getAllMentionNotifications();
    
    // Process unhandled mentions
    let tipCount = 0;
    for (const notification of mentions) {
      // Skip if we've already processed this notification
      if (processedNotifications.has(notification.cid)) {
        continue;
      }
      
      const post = notification.record;
      const author = notification.author.handle;
      
      console.log(`📣 Mention from @${author}: "${post.text}"`);
      
      // Check for the tip pattern in the post
      const tipMatch = post.text.match(TIP_PATTERN);
      
      if (tipMatch) {
        tipCount++;
        const tipAmount = tipMatch[1];
        
        // Default receiver is the bot, but could be overridden if this is a reply
        let receiver = BSKY_IDENTIFIER;
        let receiverHandle = BSKY_IDENTIFIER;
        
        // Check if this is a reply to determine the tip receiver
        if (post.reply && post.reply.parent && post.reply.parent.uri) {
          try {
            // Get the parent post to identify the receiver
            const parentThread = await agent.getPostThread({
              uri: post.reply.parent.uri,
              depth: 0
            });
            
            if (parentThread.data.thread.post.author) {
              receiver = parentThread.data.thread.post.author.did;
              receiverHandle = parentThread.data.thread.post.author.handle;
            }
          } catch (err) {
            console.log('Error fetching parent post:', err.message);
            // Continue with default receiver
          }
        }
        
        // Simple output of sender, receiver and amount
        console.log(`TIP: @${author} → @${receiverHandle}: ${tipAmount}`);
        
        // Process the tip
        processTip(author, receiverHandle, tipAmount);
      }
      
      // Mark this notification as processed
      processedNotifications.add(notification.cid);
    }
    
    // Reset failure counter on success
    consecutiveFailures = 0;
  } catch (err) {
    // Increment failure counter
    consecutiveFailures++;
    
    logError(`Error while fetching notifications (attempt ${consecutiveFailures}/${MAX_FAILURES})`, err);
    
    // Handle certain types of errors
    if (err.status === 401) {
      console.log('Unauthorized. Attempting to log in again...');
      await loginToBluesky();
    }
    
    // If we've had too many consecutive failures, wait longer before trying again
    if (consecutiveFailures >= MAX_FAILURES) {
      logError('Too many consecutive failures', 'Waiting 5 minutes before retrying');
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      consecutiveFailures = 0; // Reset counter after waiting
    }
  } finally {
    // Schedule next check regardless of success or failure
    setTimeout(checkForNewMentions, parseInt(POLLING_INTERVAL, 10));
  }
}

// Function to get all mention notifications with pagination
async function getAllMentionNotifications() {
  let allMentions = [];
  let cursor = undefined;
  
  try {
    // Loop until we've processed all pages (or up to a reasonable limit)
    let pageCount = 0;
    const MAX_PAGES = 3; // Limit to prevent excessive API calls
    
    do {
      // Get notifications with a filter for mentions
      const response = await agent.listNotifications({
        limit: 100, // Maximum limit to reduce API calls
        cursor: cursor,
      });
      
      // Filter only mentions from the response
      const mentions = response.data.notifications.filter(
        notification => notification.reason === 'mention'
      );
      
      // Add to our collection
      allMentions = [...allMentions, ...mentions];
      
      // Update cursor for next page
      cursor = response.data.cursor;
      
      // Mark notifications as read if we have results
      if (response.data.notifications.length > 0) {
        const mostRecentTimestamp = response.data.notifications[0].indexedAt;
        try {
          await agent.updateSeenNotifications(mostRecentTimestamp);
        } catch (markError) {
          logError('Failed to mark notifications as read', markError);
          // Continue anyway, non-critical error
        }
      }
      
      // Increment page counter
      pageCount++;
      
      // Exit if there are no more pages or we've reached our limit
      if (!cursor || pageCount >= MAX_PAGES) break;
      
    } while (true);
    
    return allMentions;
  } catch (err) {
    logError('Error fetching all mentions', err);
    return []; // Return empty array on error
  }
}

// Placeholder for actual tipping functionality
function processTip(from, to, amount) {
  // Simple output of the tip details
  console.log(`PROCESSING: ${amount} from @${from} to @${to}`);
}

// Handle unexpected errors
process.on('uncaughtException', (err) => {
  logError('Uncaught exception', err);
  console.log('The bot will attempt to continue running...');
});

process.on('unhandledRejection', (reason) => {
  logError('Unhandled promise rejection', reason);
  console.log('The bot will attempt to continue running...');
});

// Start the application with error handling
main().catch(err => {
  logError('Fatal error in application', err);
  process.exit(1);
});
