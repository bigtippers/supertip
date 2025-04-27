import { AtpAgent, AtpSessionEvent, AtpSessionData } from '@atproto/api';
import { AppBskyNotificationListNotifications } from '@atproto/api';
import dotenv from 'dotenv';
import { logError } from './error-log';
import { TipContract } from '../src/lib/TipContract';
import { ethers, Wallet } from 'ethers';


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Load environment variables
dotenv.config();

// Define notification type
type Notification = AppBskyNotificationListNotifications.Notification;

const provider = new ethers.JsonRpcProvider("https://westend-asset-hub-eth-rpc.polkadot.io");
const signer = new Wallet(process.env.PRIVATE_KEY || "", provider);
const tipContract = new TipContract(signer);

// Create an agent to talk to Bluesky with a timeout
export const agent = new AtpAgent({ 
  service: 'https://bsky.social',
  persistSession: (evt, sess) => {
    // Store the session info somewhere if needed
    console.log('Session updated:', new Date())
  },
  fetch: (url, init) => {
    // Add a 30-second timeout to all fetch requests
    return fetch(url, {
      ...init,
      signal: AbortSignal.timeout(30000) // 30 seconds timeout
    });
  }
});

// Function to check session validity
function checkSessionValidity() {

  console.log('Session exists:', !!agent.session)
  console.log('Session did:', agent.session?.did)
  console.log('Session handle:', agent.session?.handle)
  console.log('Access JWT exists:', !!agent.session?.accessJwt)
  console.log('Refresh JWT exists:', !!agent.session?.refreshJwt)

  try {
    // Get the profile - this requires authentication but is typically less restrictive
    if (agent.session) {
      agent.getProfile({ actor: agent.session.did })
        .then(profile => {
          console.log('Authentication works - able to fetch profile:', profile.data.handle);
        })
        .catch(error => {
          console.error('Profile fetch failed - session may be invalid:', error);
        });
    } else {
      console.log('No active session yet, need to login first');
    }
  } catch (error) {
    console.error('Error in session check:', error);
  }
}

// Get configuration from environment variables
const {
  BSKY_IDENTIFIER,
  BSKY_PASSWORD,
  POLLING_INTERVAL = "5000" // Default to 5 seconds
} = process.env;

// Regex to match the tip pattern: /tip amount
// This will capture the amount
const TIP_PATTERN = /\/tip\s+(\d+(\.\d+)?)/i;
// Track connection failures
let consecutiveFailures = 0;
const MAX_FAILURES = 5;

// Keep track of processed notifications to avoid duplicates
const processedNotifications = new Set<string>();

// Add this near the top with other global variables
const sinceTimestamp = new Date();

async function main() {
  if (!BSKY_IDENTIFIER || !BSKY_PASSWORD) {
    logError('Missing required environment variables', 
      'Required variables: BSKY_IDENTIFIER, BSKY_PASSWORD');
    process.exit(1);
  }

  // Initial login
  await loginToBluesky();
  
  // Start polling
  console.log(`Starting notification polling every ${parseInt(POLLING_INTERVAL, 10)/1000} seconds`);
  checkForNewMentions();
}

// Login function that can be called for initial login and re-logins
async function loginToBluesky(): Promise<boolean> {
  try {
    console.log(`Attempting to log in as ${BSKY_IDENTIFIER}...`);
    await agent.login({ identifier: BSKY_IDENTIFIER!, password: BSKY_PASSWORD! });
    await sleep(3000);

    // Run the check
    checkSessionValidity();


    console.log('✅ Successfully logged in to Bluesky');
    console.log('🔍 Watching for tip commands in mentions...');

    return true;
  } catch (err) {
    logError('Error logging in', err);
    return false;
  }
}

// Function to check for new mentions
async function checkForNewMentions(): Promise<void> {
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
      
      const post = notification.record as { text: string, reply?: { parent?: { uri?: string } } };
      const author = notification.author.handle;
      
      console.log(`📣 Mention from @${author}: "${post.text}"`);
      
      // Check for the tip pattern in the post
      const tipMatch = post.text.match(TIP_PATTERN);

      if (tipMatch) {
        tipCount++;
        const tipAmount = tipMatch[1];
        
        // Default receiver is the bot, but could be overridden if this is a reply
        let receiver = BSKY_IDENTIFIER || "";
        let receiverHandle = BSKY_IDENTIFIER || "";
        
        // Check if this is a reply to determine the tip receiver
        if (post.reply && post.reply.parent && post.reply.parent.uri) {
          try {
            // Get the parent post to identify the receiver
            const parentThread = await agent.getPostThread({
              uri: post.reply.parent.uri,
              depth: 0
            });
            
            const threadView = parentThread.data.thread;
            if ('post' in threadView && threadView.post.author) {
              receiver = threadView.post.author.did;
              receiverHandle = threadView.post.author.handle;
            }
          } catch (err) {
            console.log('Error fetching parent post:', err instanceof Error ? err.message : String(err));
            // Continue with default receiver
          }
        }
        
        // Simple output of sender, receiver and amount
        console.log(`TIP: @${author} → @${receiverHandle}: ${tipAmount}`);
        
        // Process the tip
        processTip(author, receiverHandle, tipAmount);
      }
      
      // IS this a register command?
      const registerParts = post.text.split(' ');
      console.log(registerParts);
      if (registerParts.length === 3 && registerParts[1] === '/register') {
        const wallet = registerParts[2];
        if (ethers.isAddress(wallet)) {
          register(author, wallet);
        } else  {
          console.log(`Invalid wallet address: ${wallet}`);
        }
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
    if (err instanceof Error && 'status' in err && err.status === 401) {
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
async function getAllMentionNotifications(): Promise<Notification[]> {
  let allMentions: Notification[] = [];
  let cursor: string | undefined = undefined;
  
  try {
    let pageCount = 0;
    const MAX_PAGES = 3;
    
    do {
      // Add since parameter to only get new notifications
      const response = await agent.listNotifications({
        limit: 100,
        cursor: cursor,
      });
      
      // Filter mentions from the response
      const mentions = response.data.notifications.filter(
        notification => 
          notification.reason === 'mention' && 
          new Date(notification.indexedAt) > sinceTimestamp
      );
            
      allMentions = [...allMentions, ...mentions];
      cursor = response.data.cursor;
      
      // Mark notifications as read
      if (response.data.notifications.length > 0) {
        const mostRecentTimestamp = response.data.notifications[0].indexedAt;
        try {
          await agent.updateSeenNotifications(mostRecentTimestamp);
        } catch (markError) {
          logError('Failed to mark notifications as read', markError);
        }
      }
      
      pageCount++;
      if (!cursor || pageCount >= MAX_PAGES) break;
      
    } while (true);
    
    return allMentions;
  } catch (err) {
    logError('Error fetching all mentions', err);
    return [];
  }
}

// Placeholder for actual tipping functionality
async function processTip(from: string, to: string, amount: string): Promise<void> {
  console.log(`PROCESSING: ${amount} from @${from} to @${to}`);
  try {
    // Truncate identifiers to 31 characters to fit in bytes32
    const truncatedFrom = from.length > 31 ? from.slice(0, 31) : from;
    const truncatedTo = to.length > 31 ? to.slice(0, 31) : to;
    
    // Convert the truncated identifiers to bytes32
    const fromBytes = ethers.encodeBytes32String(truncatedFrom);
    const toBytes = ethers.encodeBytes32String(truncatedTo);
    
    // Convert the amount to Wei before sending to contract
    const amountInWei = ethers.parseEther(amount);
    
    const result = await tipContract.tip(fromBytes, toBytes, amountInWei);
    console.log(JSON.stringify(result));
  } catch (err) {
    console.log('Error processing tip', err);
  }
}

async function register(identifier: string, wallet: string): Promise<void> {
  console.log(`Registering user "${identifier}" with wallet address ${wallet}`);
  try {
    // Truncate the identifier to 31 characters to fit in bytes32
    const truncatedId = identifier.length > 31 ? identifier.slice(0, 31) : identifier;
    
    // Convert the truncated identifier string to bytes32 format
    const identifierBytes = ethers.encodeBytes32String(truncatedId);
    
    const result = await tipContract.register(identifierBytes, wallet);
    console.log(JSON.stringify(result));
  } catch (err) {
    console.log('Error registering', err);
  }
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
