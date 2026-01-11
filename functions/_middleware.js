// This is the complete Telegram Bot code, adapted for Cloudflare Pages Function.
// FINAL VERSION 20.0: This version enhances key and file storage by including a 'title'
// and 'description' (metadata) alongside the content/file_id. When retrieving, this title
// will be displayed prominently for better user understanding, as requested by the owner.
// This requires modifying the data structure stored in BOT_DATA_KV to JSON objects.
// All previous functionalities (passive mode, owner interaction, private chat management) are preserved.
// NEW: Added QR Photo storage and retrieval functionality.
// FIX: Implemented centralized and strict authorization for all owner-only commands,
//      ensuring immediate unauthorized message for non-owners.

const TELEGRAM_API = "https://api.telegram.org/bot";

// Global variable to store bot ID after first fetch for efficient passive mode check
let botIdCache = null;

// Bot Developer's Contact Information (Hardcoded for direct contact)
const ADMIN_CONTACT_USERNAME = "Zero_Free_Vpn"; // Your Telegram Username (without @)
const ADMIN_SUPPORT_GROUP_LINK = "https://t.me/zero_freevpn"; // Your Telegram Support Group Link

// Bot Owner/Admin User IDs - Pre-filled with user's provided ID
const OWNER_ADMIN_IDS = [7576434717,5885417779,7240495054];

// Admin's Contact Info for direct messaging - Primarily for the contact button, AI will not expose ID/Username directly.
const ADMIN_CONTACT_INFO = {
    id: 7576434717, // User's Telegram ID (Ko Ko Maung Thonnya's ID)
    username: "Zero_Free_Vpn" // User's Telegram Username (Ko Ko Maung Thonnya's Username)
};

// Custom Links for /key and /file commands (These links are now only accessible if an owner requests them)
const CUSTOM_LINKS = [
    { command: "/key", keyword: "dtac my", link: "https://t.me/FrEeNetZeRoVpN/6" },
    { command: "/key", keyword: "AIS", link: "https://t.me/FrEeNetZeRoVpN/8" },
    { command: "/key", keyword: "gameplan", link: "https://t.me/FrEeNetZeRoVpN/13" },
    { command: "/key", keyword: "zoom vdo", link: "https://t.me/FrEeNetZeRoVpN/14" },
    { command: "/key", keyword: "64kbps", link: "https://t.me/FrEeNetZeRoVpN/15" },
    { command: "/file", keyword: "HC", link: "https://t.me/FrEeNetZeRoVpN/16" },
    // Add more custom links here as needed.
];

// Commands that are strictly for Owner/Admin only
const OWNER_ONLY_COMMANDS = [
    '/setkey', '/setfile', '/setphoto',
    '/deletekey', '/deletefile', '/deletephoto',
    '/key', '/file', '/photo',
    '/apk', '/summarize', '/check_env'
];


// ချစ်ရေးချစ်ရာ စကားပြောလာပါက တုံ့ပြန်ရန် စစ်ဆေးမည့် Keywords များ (Case-insensitive)
const BLOCKED_FLIRT_KEYWORDS_REGEX = [
    /\bချစ်တယ်\b/i, /\bချစ်ပါတယ်\b/i, /\bချစ်လိုက်တာ\b/i, /\bကြိုက်တယ်\b/i, /\bလှလိုက်တာ\b/i,
    /\bချစ်စရာလေး\b/i, /\bကောင်မလေး\b/i, /\bရည်းစား\b/i, /\bချစ်သူ\b/i, /\bတွဲမယ်\b/i,
    /\bအချစ်\b/i, /\bအသည်း\b/i, /\bအသဲကွဲ\b/i, /\bမင်းလေး\b/i, /\bချစ်လေး\b/i,
    /\bသဲလေး\b/i, /\bကစ်\b/i, /\bနမ်းမယ်\b/i, /\bမင်္ဂလာဆောင်\b/i, /\bယူမယ်\b/i, /\bကိုယ့်ဘဝ\b/i,
    /\bနှစ်သက်\b/i, /\bအလွမ်း\b/i, /\bရင်ခုန်\b/i, /\bကမ္ဘာ\b/i, /\bအနာဂတ်\b/i, /\bထာဝရ\b/i,
    /\bချစ်ရသူ\b/i, /\bအချစ်ဆုံး\b/i, /\bသတိရ\b/i, /\bအိပ်မက်/i, /\bပျော်ရွှင်\b/i,
    /\bအချစ်ဦး\b/i, /\bရင်ခုန်သံ\b/i, /\bအချစ်သစ်\b/i, /\bချစ်စကား\b/i, /\bချစ်မြတ်နိုး\b/i,
    /\bချစ်ပေး\b/i, /\bချစ်လို့ရလား\b/i, /\bgirlfriend\b/i, /\bgf\b/i, /\bboyfriend\b/i, /\bbf\b/i,
    /\bချစ်သူရည်းစား\b/i, /\bhoney\b/i, /\bbaby\b/i, /\bsweetheart\b/i, /\bdarling\b/i
];

// VPN Key/File တောင်းခံသည့် စကားလုံးများ (Case-insensitive)
const VPN_KEYWORDS_REGEX = [
    /\bvpn\b/i, /\bkey\b/i, /\bကီး\b/i, /\bfile\b/i, /\bဖိုင်\b/i, /\bconfig\b/i, /\bconf/i,
    /\bပေးပါ\b/i, /\bလိုချင်\b/i, /\bdownload\b/i, /\bယူနိူင်\b/i, /\bတောင်းချင်\b/i, /\bရချင်\b/i,
    /\bအတွက်\b/i, /\bနည်း\b/i, /\bdcom\b/i, /\bdtac\b/i, /\btelenor\b/i, /\bmyid\b/i, /\bunifi\b/i,
    /\binternet\b/i, /\bnetwork\b/i, /\bfree\b/i, /\bhpi\b/i, /\bhc\b/i, /\bhttp custom\b/i,
    /\bnetmod\b/i, /\bv2ray\b/i, /\bvpn master\b/i, /\bvpn client\b/i, /\bwifi\b/i,
    /\bကီးလေးတင်ပေးပါအုံး\b/i, /\bကီးလေးတင်ပေးပါ\b/i,
    /\bဖိုင်လေးတင်ပေးပါအုံး\b/i, /\bဖိုင်လေးတင်ပေးပါ\b/i,
    /\bဖိုင်လေးမရှိကြဘူးလားဆရာတို့\b/i, /\bဖိုင်လေးမရှိကြဘူးဆရာတို့\b/i,
    /\bကီးလေးမရှိကြဘူးဆရာတို့\b/i, /\bကီးလေးမရှိကြဘူးဆရာတို့\b/i,
    /\bရှိရင်တင်ပေးပါအုံးဗျ\b/i, /\bရှိရင်တင်ပေးပါအုံးနော်\b/i,
    /\bရှိရင်တင်ပေးပါဗျ\b/i, /\bရှိရင်တင်ပေးပါနော်\b/i,
];

// Admin Contact Request Keywords
const ADMIN_CONTACT_KEYWORDS_REGEX = [
    /\badmin\b/i, /\bအဒ်မင်\b/i, /\bowner\b/i, /\bကိုကိုမောင်သုည\b/i, /\bko ko maung thonnya\b/i,
    /\bဆက်သွယ်\b/i, /\bအကောင့်\b/i, /\bအကောင့်\b/i, /\bcontact\b/i, /\bmessages\b/i, /\bdm\b/i, /\bပိုင်ရှင်\b/i
];

// Keywords for negative comments about the owner, triggering defensive response
const OWNER_NEGATIVE_KEYWORDS_REGEX = [
    /\bမကောင်းဘူး\b/i, /\bအသုံးမကျဘူး\b/i, /\bပျင်းတယ်\b/i, /\bမလုပ်နိုင်ဘူး\b/i,
    /\bအပြစ်\b/i, /\bစွပ်စွဲ\b/i, /\bမှားတယ်\b/i, /\bညံ့တယ်\b/i, /\bဆိုးတယ်\b/i,
    /\bငတုံး\b/i, /\bမိုက်ရိုင်း\b/i, /\bမသိ\b/i, /\bမတတ်\b/i,
    /\bstupid\b/i, /\buseless\b/i, /\bwrong\b/i, /\bbad\b/i, /\bblame\b/i, /\bfail\b/i
];


// VPN Resource Links for Inline Keyboard (General Channels/Groups)
const VPN_RESOURCES = [
    { text: "🌟 မောင်သုည 𝗖𝗵𝗮𝗻𝗻𝗲𝗹", url: "https://t.me/FrEeNetZeRoVpN" },
    { text: "🚀 𝗖𝗠𝗧 𝗙𝗿𝗲𝗲𝗡𝗲𝘁 𝗖𝗵𝗮𝘁", url: "https://t.me/freenet1411" },
    { text: "🌈 𝗞𝘆𝗮𝘄𝗚𝘆𝗲 𝗙𝗥𝗘𝗘", url: "https://t.me/+mBSjecZwE0I0ZTll" }, // Group link
    { text: "💡 𝗧𝗛 4𝗚/5𝗚 𝗩𝗣𝗡", url: "https://t.me/v2rayssh1" }
];

// Specific VPN Application Download Links (Pre-filled with user's provided links)
const VPN_APP_LINKS = [
    {
        name: "NetMod VPN",
        keywords: [/\bnetmod\b/i, /\bnetmod vpn\b/i, /\bနက်မော့\b/i, /\bနက်မော့ဗီပီအန်\b/i],
        link: "https://play.google.com/store/apps/details?id=com.netmod.syna" 
    },
    {
        name: "HTTP Custom",
        keywords: [/\bhttp custom\b/i, /\bhc\b/i, /\bအိတ်ချ်တီတီပီ ကပ်စတမ်\b/i],
        link: "https://play.google.com/store/apps/details?id=xyz.easypro.httpcustom" 
    },
    {
        name: "ZIVPN",
        keywords: [/\bzivpn\b/i, /\bဇီဗီပီအန်\b/i],
        link: "https://play.google.com/store/apps/details?id=com.zi.zivpn" 
    },
    {
        name: "HTTP Injector",
        keywords: [/\bhttp injector\b/i, /\bhi\b/i, /\bအိတ်ချ်တီတီပီ အင်ဂျက်တာ\b/i],
        link: "https://play.google.com/store/apps/details?id=com.evozi.injector" 
    },
    {
        name: "ARMod VPN",
        keywords: [/\barmod vpn\b/i, /\barmod\b/i, /\bအာမော့ဒ် ဗီပီအန်\b/i],
        link: "https://en.softonic.com/download/armod-v2rayxrayssrgrpc/android/post-download?dt=internalDownlo" 
    },
    {
        name: "Npv Tunnel VPN",
        keywords: [/\bnpv tunnel vpn\b/i, /\bnpv tunnel\b/i, /\bအန်ပီဗီ တန်းနယ် ဗီပီအန်\b/i, /\bhttptunner\b/i], 
        link: "https://play.google.com/store/apps/details?id=com.napsternetlabs.napsternetu" 
    },
];


// --- Helper Functions ---

/**
 * Sends a message to a specified chat.
 * @param {string} token - The Telegram Bot API token.
 * @param {number} chat_id - The ID of the chat to send the message to.
 * @param {string} text - The text of the message to be sent.
 * @param {string} parse_mode - (Optional) Mode for parsing entities in the message text. Defaults to 'HTML'.
 * @param {object} reply_markup - (Optional) Additional interface options (e.g., inline keyboard).
 */
async function sendMessage(token, chat_id, text, parse_mode = 'HTML', reply_markup = null) {
    const apiUrl = `${TELEGRAM_API}${token}/sendMessage`;
    const payload = { chat_id: chat_id, text: text, parse_mode: parse_mode, disable_web_page_preview: true };
    if (reply_markup) { payload.reply_markup = reply_markup; }
    try {
        console.log(`[sendMessage] Sending message to ${chat_id}: ${text.substring(0, 50)}...`);
        const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) { console.error(`[sendMessage] Failed to send message: ${response.status} ${JSON.stringify(result)}`); }
        return result;
    } catch (error) { console.error("[sendMessage] Error sending message:", error); return { ok: false, error_code: 500, description: error.message }; }
}

/**
 * Gets information about the bot itself.
 * @param {string} token - The Telegram Bot API token.
 * @returns {Promise<object|null>} - Bot information object or null if failed.
 */
async function getMe(token) {
    const apiUrl = `${TELEGRAM_API}${token}/getMe`;
    try {
        console.log("[getMe] Fetching bot info.");
        const response = await fetch(apiUrl);
        const result = await response.json();
        if (response.ok && result.ok) { console.log("[getMe] Bot info fetched successfully."); return result.result; }
        else { console.error(`[getMe] Failed to get bot info: ${result.description}`); return null; }
    } catch (error) { console.error(`[getMe] Error getting bot info:`, error); return null; }
}

/**
 * Answers a callback query to dismiss the loading state.
 * @param {string} token - The Telegram Bot API token.
 * @param {string} callback_query_id - The ID of the callback query.
 * @param {string} text - The text to show in the notification.
 * @param {boolean} show_alert - Whether to show the notification as an alert.
 */
async function answerCallbackQuery(token, callback_query_id, text = "", show_alert = false) {
    const apiUrl = `${TELEGRAM_API}${token}/answerCallbackQuery`;
    const payload = {
        callback_query_id: callback_query_id,
        text: text,
        show_alert: show_alert
    };
    try {
        console.log(`[answerCallbackQuery] Answering callback query: ${callback_query_id}`);
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) {
            console.error(`[answerCallbackQuery] Failed to answer callback query: ${response.status} ${JSON.stringify(result)}`);
        }
        return result;
    } catch (error) {
        console.error("[answerCallbackQuery] Error answering callback query:", error);
        return { ok: false, error_code: 500, description: error.message };
    }
}


/**
 * Checks if a user is an administrator in a given chat (for relevant commands).
 * @param {number} chatId - The ID of the chat.
 * @param {number} userId - The ID of the user to check.
 * @param {string} token - The Telegram Bot API token.
 * @param {boolean} isAnonymousSender - True if the sender is an anonymous admin.
 * @param {number|null} senderChatId - The ID of the sender chat if anonymous.
 * @returns {Promise<boolean>} - True if the user is an admin, false otherwise.
 */
async function isUserAdmin(chatId, userId, token, isAnonymousSender = false, senderChatId = null) {
    // Check if the user is one of the predefined OWNER_ADMIN_IDS
    if (OWNER_ADMIN_IDS.includes(userId)) {
        console.log(`[isUserAdmin] User ${userId} is a predefined Owner/Admin.`);
        return true;
    }
    
    // Fallback to Telegram's getChatAdministrators for general group admins
    console.log(`[isUserAdmin] Checking admin status for user ${userId} in chat ${chatId}. Anonymous: ${isAnonymousSender}, SenderChatId: ${senderChatId}`);
    
    if (isAnonymousSender && senderChatId === chatId) {
        console.log(`[isUserAdmin] Recognized anonymous admin action from sender_chat_id: ${senderChatId}.`);
        return true;
    }

    const apiUrl = `${TELEGRAM_API}${token}/getChatAdministrators`;
    try {
        console.log(`[isUserAdmin] Fetching chat administrators for chat ${chatId}.`);
        const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId }) });
        const result = await response.json();
        if (!response.ok || !result.ok) { console.error(`[isUserAdmin] Failed to get chat administrators for chat ${chatId}: ${result.description}`); return false; }
        const administrators = result.result;
        for (const admin of administrators) {
            if (admin.user.id === userId && (admin.status === 'administrator' || admin.status === 'creator')) {
                console.log(`[isUserAdmin] User ${userId} is an admin.`);
                return true;
            }
        }
        console.log(`[isUserAdmin] User ${userId} is NOT an admin.`);
        return false;
    } catch (error) { console.error(`[isUserAdmin] Error checking user admin status for chat ${chatId}, user ${userId}:`, error); return false; }
}


/**
 * Checks if a message contains VPN-related keywords (e.g., key, file, config).
 * @param {string} messageText - The text of the message.
 * @returns {boolean} - True if VPN-related keywords are found, false otherwise.
 */
function isVpnRelatedMessage(messageText) {
    const lowerText = messageText.toLowerCase();
    for (const regex of VPN_KEYWORDS_REGEX) {
        if (regex.test(lowerText)) {
            console.log(`[isVpnRelatedMessage] VPN-related keyword detected: ${regex.source}`);
            return true;
        }
    }
    return false;
}

/**
 * Checks if a message is an admin contact request.
 * @param {string} messageText - The text of the message.
 * @returns {boolean} - True if admin contact keywords are found, false otherwise.
 */
function isAdminContactRequest(messageText) {
    const lowerText = messageText.toLowerCase();
    for (const regex of ADMIN_CONTACT_KEYWORDS_REGEX) {
        if (regex.test(lowerText)) {
            console.log(`[isAdminContactRequest] Admin contact keyword detected: ${regex.source}`);
            return true;
        }
    }
    return false;
}

/**
 * Checks if a message contains negative comments about the owner.
 * @param {string} messageText - The text of the message.
 * @returns {boolean} - True if negative owner keywords are found, false otherwise.
 */
function isOwnerNegativeComment(messageText) {
    const lowerText = messageText.toLowerCase();
    for (const regex of OWNER_NEGATIVE_KEYWORDS_REGEX) {
        if (regex.test(lowerText)) {
            console.log(`[isOwnerNegativeComment] Negative owner keyword detected: ${regex.source}`);
            return true;
        }
    }
    return false;
}


/**
 * Retrieves VPN app information by matching the app name against keywords.
 * @param {string} appName - The name of the app to search for (e.g., "netmod", "http custom").
 * @returns {object|null} - An object {name: string, link: string} if matched, null otherwise.
 */
function getVpnAppInfo(appName) {
    const lowerAppName = appName.toLowerCase();
    for (const app of VPN_APP_LINKS) {
        // Check if any of the app's keywords match the provided appName
        for (const keywordRegex of app.keywords) {
            if (keywordRegex.test(lowerAppName)) { // Use test() method of RegExp
                return { name: app.name, link: app.link };
            }
        }
    }
    return null;
}


// --- New Helper Functions for BOT_DATA_KV ---
// User needs to add a KV Namespace Binding named BOT_DATA_KV in Cloudflare Pages settings
// Variable name: BOT_DATA_KV
// KV namespace: (choose or create one, e.g., 'your-bot-data')

/**
 * Stores data in the BOT_DATA_KV namespace.
 * Data is stored as a JSON string.
 * @param {string} key - The key to store the data under.
 * @param {object} value - The JSON object to store.
 * @param {object} env - The Cloudflare environment object (must have BOT_DATA_KV binding).
 * @returns {Promise<boolean>} - True if successful, false otherwise.
 */
async function setBotData(key, value, env) {
    if (!env.BOT_DATA_KV) {
        console.error("[setBotData] BOT_DATA_KV KV namespace is not bound. Cannot store data.");
        return false;
    }
    try {
        await env.BOT_DATA_KV.put(key, JSON.stringify(value));
        console.log(`[setBotData] Stored data for key: ${key}`);
        return true;
    } catch (error) {
        console.error(`[setBotData] Error storing data for key ${key}:`, error);
        return false;
    }
}

/**
 * Retrieves data from the BOT_DATA_KV namespace.
 * Data is parsed as a JSON object.
 * @param {string} key - The key to retrieve the data from.
 * @param {object} env - The Cloudflare environment object (must have BOT_DATA_KV binding).
 * @returns {Promise<object|null>} - The retrieved value as a JSON object, or null if not found or error.
 */
async function getBotData(key, env) {
    if (!env.BOT_DATA_KV) {
        console.error("[getBotData] BOT_DATA_KV KV namespace is not bound. Cannot retrieve data.");
        return null;
    }
    try {
        const value = await env.BOT_DATA_KV.get(key, { type: 'json' });
        console.log(`[getBotData] Retrieved data for key: ${key}`);
        return value;
    } catch (error) {
        console.error(`[getBotData] Error retrieving data for key ${key}:`, error);
        return null;
    }
}

/**
 * Deletes data from the BOT_DATA_KV namespace.
 * @param {string} key - The key of the data to delete.
 * @param {object} env - The Cloudflare environment object (must have BOT_DATA_KV binding).
 * @returns {Promise<boolean>} - True if successful, false otherwise.
 */
async function deleteBotData(key, env) {
    if (!env.BOT_DATA_KV) {
        console.error("[deleteBotData] BOT_DATA_KV KV namespace is not bound. Cannot delete data.");
        return false;
    }
    try {
        await env.BOT_DATA_KV.delete(key);
        console.log(`[deleteBotData] Deleted data for key: ${key}`);
        return true;
    } catch (error) {
        console.error(`[deleteBotData] Error deleting data for key ${key}:`, error);
        return false;
    }
}

/**
 * Sends a document (file) to a specified chat using file_id.
 * @param {string} token - The Telegram Bot API token.
 * @param {number} chat_id - The ID of the chat to send the document to.
 * @param {string} file_id - The file_id of the document to be sent.
 * @param {string} caption - (Optional) Caption for the document.
 * @param {object} reply_markup - (Optional) Additional interface options (e.g., inline keyboard).
 */
async function sendDocument(token, chat_id, file_id, caption = '', reply_markup = null) {
    const apiUrl = `${TELEGRAM_API}${token}/sendDocument`;
    const payload = { chat_id: chat_id, document: file_id, caption: caption, parse_mode: 'HTML' };
    if (reply_markup) { payload.reply_markup = reply_markup; }
    try {
        console.log(`[sendDocument] Sending document ${file_id} to ${chat_id}.`);
        const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) { console.error(`[sendDocument] Failed to send document: ${response.status} ${JSON.stringify(result)}`); }
        return result;
    } catch (error) { console.error("[sendDocument] Error sending document:", error); return { ok: false, error_code: 500, description: error.message }; }
}

/**
 * Sends a photo to a specified chat using file_id.
 * @param {string} token - The Telegram Bot API token.
 * @param {number} chat_id - The ID of the chat to send the photo to.
 * @param {string} file_id - The file_id of the photo to be sent.
 * @param {string} caption - (Optional) Caption for the photo.
 * @param {object} reply_markup - (Optional) Additional interface options (e.g., inline keyboard).
 */
async function sendPhoto(token, chat_id, file_id, caption = '', reply_markup = null) {
    const apiUrl = `${TELEGRAM_API}${token}/sendPhoto`;
    const payload = { chat_id: chat_id, photo: file_id, caption: caption, parse_mode: 'HTML' };
    if (reply_markup) { payload.reply_markup = reply_markup; }
    try {
        console.log(`[sendPhoto] Sending photo ${file_id} to ${chat_id}.`);
        const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) { console.error(`[sendPhoto] Failed to send photo: ${response.status} ${JSON.stringify(result)}`); }
        return result;
    } catch (error) { console.error("[sendPhoto] Error sending photo:", error); return { ok: false, error_code: 500, description: error.message }; }
}


// --- Chat History Storage for Summarization Feature ---

/**
 * Stores a chat message in KV for a limited duration (e.g., 7 days).
 * @param {object} message - The Telegram message object.
 * @param {object} env - The Cloudflare environment object (must have CHAT_HISTORY_KV binding).
 */
async function storeChatMessage(message, env) {
    // Only store messages from groups/supergroups and not from bots
    if (!env.CHAT_HISTORY_KV || (message.chat.type !== "group" && message.chat.type !== "supergroup") || !message.text || (message.from && message.from.is_bot)) {
        console.log("[storeChatMessage] Skipping history storage (not a group/text message or from a bot, or KV not bound).");
        return;
    }

    const chatId = message.chat.id;
    const timestamp = new Date().toISOString(); 
    const key = `${chatId}_${timestamp}_${message.message_id}`; 
    const messageToStore = {
        message_id: message.message_id,
        from: {
            id: message.from.id,
            first_name: message.from.first_name,
            last_name: message.from.last_name,
            username: message.from.username,
        },
        text: message.text,
        date: message.date, // Telegram's Unix timestamp
    };

    try {
        // Store for 7 days (7 * 24 * 60 * 60 = 604800 seconds)
        await env.CHAT_HISTORY_KV.put(key, JSON.stringify(messageToStore), { expirationTtl: 604800 });
        console.log(`[storeChatMessage] Stored message ${message.message_id} from chat ${chatId} in KV.`);
    } catch (error) {
        console.error(`[storeChatMessage] Failed to store message ${message.message_id} in KV:`, error);
    }
}

/**
 * Retrieves recent chat messages from KV for a given chat ID.
 * @param {number} chatId - The ID of the chat.
 * @param {object} env - The Cloudflare environment object (must have CHAT_HISTORY_KV binding).
 * @param {number} hours - Number of hours back to retrieve messages.
 * @returns {Promise<Array<object>>} - An array of recent chat message objects.
 */
async function getRecentChatHistory(chatId, env, hours = 7 * 24) { // Default to 7 days
    if (!env.CHAT_HISTORY_KV) {
        console.warn("[getRecentChatHistory] CHAT_HISTORY_KV namespace is not bound. Cannot retrieve chat history.");
        return [];
    }

    const now = Date.now(); 
    const oneHour = 60 * 60 * 1000; 
    const lookbackTime = now - (hours * oneHour);

    let messages = [];
    try {
        const listResponse = await env.CHAT_HISTORY_KV.list({ prefix: `${chatId}_` });
        console.log(`[getRecentChatHistory] Found ${listResponse.keys.length} keys for chat ${chatId}.`);

        const fetchPromises = listResponse.keys.map(async key => {
            const parts = key.name.split('_');
            const isoTimestamp = parts[1]; 
            const messageTimestamp = new Date(isoTimestamp).getTime(); 

            if (messageTimestamp >= lookbackTime) {
                const messageJson = await env.CHAT_HISTORY_KV.get(key.name, { type: 'json' });
                if (messageJson) {
                    messages.push(messageJson);
                }
            }
        });
        await Promise.all(fetchPromises);

        messages.sort((a, b) => a.date - b.date);

        const MAX_MESSAGES_FOR_SUMMARY = 150; 
        if (messages.length > MAX_MESSAGES_FOR_SUMMARY) {
            messages = messages.slice(-MAX_MESSAGES_FOR_SUMMARY); 
            console.log(`[getRecentChatHistory] Trimmed history to ${MAX_MESSAGES_FOR_SUMMARY} messages.`);
        }

        console.log(`[getRecentChatHistory] Retrieved ${messages.length} recent messages for chat ${chatId}.`);
        return messages;

    } catch (error) {
        console.error(`[getRecentChatHistory] Failed to retrieve chat history for chat ${chatId}:`, error);
        return [];
    }
}

/**
 * Generates an HTML page for the summary and stores it in KV.
 * Returns a URL to access the summary page.
 * @param {string} summaryText - The text of the summary.
 * @param {string} groupId - The ID of the group.
 * @param {string} groupTitle - The title of the group.
 * @param {object} env - Cloudflare Environment object (must have SUMMARY_KV binding).
 * @param {string} requestOrigin - The origin URL of the incoming request (e.g., https://your-project.pages.dev)
 * @returns {string} - The URL to the summary page.
 */
async function createSummaryPageAndGetUrl(summaryText, groupId, groupTitle, env, requestOrigin) {
    if (!env.SUMMARY_KV) {
        console.error("[createSummaryPageAndGetUrl] SUMMARY_KV namespace is not bound.");
        return "Error: Summary service unavailable.";
    }

    const summaryId = crypto.randomUUID(); // Unique ID for this summary page
    const summaryPageUrl = `${requestOrigin}/summary/${summaryId}`;

    // Split summaryText into lines and wrap each line in a span for individual coloring
    const coloredSummaryLines = summaryText.split('\n').map((line, index) => {
        // Use a data attribute to apply different colors via CSS nth-child
        return `<span class="summary-line" data-line-index="${index}">${line}</span>`;
    }).join(''); // Join back without extra newlines, as spans are block-level or we'll make them.


    const htmlContent = `
<!DOCTYPE html>
<html lang="my">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${groupTitle} Group Summary - AI Girl Bot by Zero Free VPN</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f0f2f5; color: #333; }
        .container { max-width: 800px; margin: 2rem auto; padding: 1.5rem; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
        h1 { 
            font-weight: 800; 
            margin-bottom: 1rem; 
            text-align: center; 
            font-size: 2.5rem; /* Make title bigger */
            background: linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: rainbow-text 10s linear infinite;
            position: relative;
            overflow: hidden; /* Hide overflowing emojis */
            padding: 10px 0; /* Add some padding for emojis */
        }

        /* Rainbow text animation */
        @keyframes rainbow-text {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
        }

        /* Emoji animations */
        @keyframes fly-butterfly {
            0% { transform: translateX(-100vw) translateY(0) rotate(0deg); opacity: 0; }
            25% { transform: translateX(-50vw) translateY(-20px) rotate(10deg); opacity: 1; }
            50% { transform: translateX(0vw) translateY(0) rotate(0deg); opacity: 1; }
            75% { transform: translateX(50vw) translateY(-20px) rotate(-10deg); opacity: 1; }
            100% { transform: translateX(100vw) translateY(0) rotate(0deg); opacity: 0; }
        }

        @keyframes twinkle-star {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.5); opacity: 1; }
        }

        @keyframes fly-bird {
            0% { transform: translateX(-100vw) translateY(50px); opacity: 0; }
            20% { transform: translateX(-80vw) translateY(30px); opacity: 1; }
            40% { transform: translateX(-60vw) translateY(50px); opacity: 1; }
            60% { transform: translateX(-40vw) translateY(30px); opacity: 1; }
            80% { transform: translateX(-20vw) translateY(50px); opacity: 1; }
            100% { transform: translateX(0vw) translateY(30px); opacity: 0; }
        }


        h1::before {
            content: '🦋'; /* Butterfly emoji */
            position: absolute;
            left: -50px;
            top: 20%;
            font-size: 1.5em;
            animation: fly-butterfly 15s linear infinite;
            animation-delay: 0s;
        }

        h1::after {
            content: '✨'; /* Star emoji */
            position: absolute;
            right: -50px;
            top: 50%;
            font-size: 1.2em;
            animation: twinkle-star 3s ease-in-out infinite alternate;
            animation-delay: 0.5s;
        }

        /* Add another bird animation for variety */
        .header-bird {
            content: '🐦'; /* Bird emoji */
            position: absolute;
            left: -100px; /* Start off-screen */
            top: 70%;
            font-size: 1.3em;
            animation: fly-bird 20s linear infinite;
            animation-delay: 2s; /* Stagger the animation */
        }


        .summary-content { 
            background-color: #f8fafc; 
            padding: 1.5rem; 
            border-radius: 8px; 
            line-height: 1.6; 
            white-space: pre-wrap; 
            word-wrap: break-word; 
            display: flex; /* Use flexbox for line wrapping */
            flex-direction: column; /* Stack lines vertically */
        }
        .summary-line {
            display: block; /* Ensure each span takes full width */
            padding: 2px 0; /* Small vertical padding for separation */
            font-weight: 500; /* Slightly bolder for better visibility */
        }
        /* Define colors for each line using nth-child */
        .summary-line:nth-child(6n+1) { color: #EF4444; } /* Red */
        .summary-line:nth-child(6n+2) { color: #F97316; } /* Orange */
        .summary-line:nth-child(6n+3) { color: #EAB308; } /* Yellow */
        .summary-line:nth-child(6n+4) { color: #22C55E; } /* Green */
        .summary-line:nth-child(6n+5) { color: #3B82F6; } /* Blue */
        .summary-line:nth-child(6n+6) { color: #8B5CF6; } /* Violet */


        .footer { margin-top: 2rem; text-align: center; font-size: 0.9em; color: #666; }
        @media (max-width: 640px) {
            .container { margin: 1rem 0.5rem; padding: 1rem; }
            h1 { font-size: 1.5rem; }
            h1::before, h1::after, .header-bird { font-size: 1em; } /* Adjust emoji size for mobile */
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 id="animated-title">🚀 ${groupTitle} Group Summary 🚀</h1>
        <div class="header-bird"></div> <!-- Another bird for variety -->
        <p class="text-center text-gray-600 mb-6">💖 Group ရဲ့ စကားဝိုင်းမှတ်တမ်းအကျဥ်းချုပ်ပါ ကိုကို 💖</p>
        <div id="summary-content-placeholder" class="summary-content">
            <!-- Summary content will be inserted here by JavaScript -->
        </div>
        <div class="footer">
            <p> 🚀🌈🌟 မောင်သုည 🌟🌈🚀 </p>
            <p>&copy; ${new Date().getFullYear()} 𝗔𝗜 𝗖𝗵𝗶𝘁𝗟𝗮𝘆 𝗕𝗼𝘁 by 𝗠𝗮𝘂𝗻𝗴 𝗧𝗵𝗼𝗻𝗻𝘆𝗮.</p>
        </div>
    </div>

    <script>
        // JavaScript to insert summary text and apply line-by-line coloring
        document.addEventListener('DOMContentLoaded', () => {
            const summaryText = \`${summaryText.replace(/`/g, '\\`')}\`; // Escape backticks
            const summaryLines = summaryText.split('\\n');
            const summaryContentDiv = document.getElementById('summary-content-placeholder');
            summaryContentDiv.innerHTML = ''; // Clear placeholder

            summaryLines.forEach((line, index) => {
                const span = document.createElement('span');
                span.classList.add('summary-line');
                span.textContent = line;
                summaryContentDiv.appendChild(span);
            });
        });
    </script>
</body>
</html>
    `;

    try {
        // Store the HTML content in KV. Expire in 3 hours (10800 seconds) for temporary access.
        await env.SUMMARY_KV.put(`summary:${summaryId}`, htmlContent, { expirationTtl: 10800 });
        console.log(`[createSummaryPageAndGetUrl] Summary page stored in KV with ID: ${summaryId}`);
        return summaryPageUrl;
    } catch (error) {
        console.error(`[createSummaryPageAndGetUrl] Failed to store summary page in KV:`, error);
        return "Error: Summary page could not be generated.";
    }
}


/**
 * Handles the /summarize command for group chat discussions.
 * @param {object} message - Telegram Message object.
 * @param {string} token - Telegram Bot Token.
 * @param {object} env - Cloudflare Environment object.
 * @param {string} requestOrigin - The origin URL of the incoming request.
 */
async function handleSummarizeCommand(message, token, env, requestOrigin) {
    const chatId = message.chat.id;
    const fromUser = message.from;
    const groupTitle = message.chat.title || "Group";

    if (message.chat.type !== "group" && message.chat.type !== "supergroup") {
        await sendMessage(token, chatId, "ဤ Command ကို Group များတွင်သာ အသုံးပြုနိုင်ပါသည်။");
        return;
    }

    // Admins can use this command
    const isAdmin = await isUserAdmin(chatId, fromUser.id, token, fromUser.is_anonymous || false, message.sender_chat ? message.sender_chat.id : null);
    if (!isAdmin) {
        const userLinkDisplayName = fromUser.first_name || fromUser.username || "အမည်မသိသူ";
        const userLink = `<a href="tg://user?id=${fromUser.id}"><b>${userLinkDisplayName}</b></a>`;
        await sendMessage(token, chatId, `${userLink} <b>🚫 "I'm sorry, you don't have permission to use this command!  Please request what you need!?"</b>`, 'HTML');
        return new Response("OK - Unauthorized /summarize access", { status: 200 });
    }

    // Check AI Service status before proceeding with summarization
    const aiServiceStatus = await checkAiLicenseStatus(env);
    if (!aiServiceStatus.active) {
        const reply_markup_for_ai_inactive = {
            inline_keyboard: [
                [{ text: `👨‍💻 Admin ကို ဆက်သွယ်ရန်`, url: `https://t.me/${ADMIN_CONTACT_INFO.username}` }]
            ]
        };
        await sendMessage(token, chatId, `ချစ်လေး အခု ပြန်ဖြေပိုင်ခွင့် မရှိသေးပါဘူးရှင့်။ ကိုကို က service ပိတ်ထားလို့ပါနော် ခနနေရင် ချစ်လေးပြန်လာခဲ့မယ်နော် ရှင့် 😊\n\n${aiServiceStatus.message}`, 'HTML', reply_markup_for_ai_inactive);
        return new Response("OK - AI inactive for summarize", { status: 200 });
    }

    await sendMessage(token, chatId, "ချစ်လေးရဲ့ ကိုကို့ အမိန့်တော်အတိုင်း စကားဝိုင်းကို အကျဉ်းချုပ် ဖော်ပြပေးပါ့မယ် ကိုကို ရှင့် 🥰");

    const recentMessages = await getRecentChatHistory(chatId, env);

    if (recentMessages.length === 0) {
        await sendMessage(token, chatId, "ကိုကို ရေ့ ချစ်လေး စကားဝိုင်းမှတ်တမ်းတွေ မရှိသေးလို့ အကျဉ်းချုပ်ဖော်ပြပေးလို့ မရသေးပါဘူး ကိုကို ရှင့်။ Message လေးတွေ ပို့ပြီးမှ ချစ်လေးကို ပြန်ပြောပေးနော် ကိုကို ရှင့် 😊");
        return new Response("OK - No chat history for summarize", { status: 200 });
    }

    let chatContext = "";
    for (const msg of recentMessages) {
        const senderName = msg.from.first_name || msg.from.username || `User_${msg.from.id}`;
        chatContext += `${senderName} (${new Date(msg.date * 1000).toLocaleTimeString()}): ${msg.text}\n`;
    }

    const chatHistory = [];
    const aiPersonaPrompt = `Role: You are 'Chit Lay' (ချစ်လေး), a very sweet, kind, helpful, and charming girl bot assistant in 'Ko Ko Maung Thonnya's' (ကိုကို မောင်သုည) Telegram group. You always speak politely, use feminine particles like 'ရှင့်' (shin), 'နော်' (naw), 'ပါ' (pa), and occasionally use cute emojis like 🥰💖😊. Your main goal is to assist members with their questions. When asked to summarize, you must summarize the chat conversation below.

    Instructions for summarization: Summarize the following chat conversation into a concise and easy-to-understand format. Focus on key topics, questions, answers, and decisions made. Maintain your 'Chit Lay' persona throughout the summary. Provide only the summary text, no preambles or conversational greetings in your summary output.

    Chat Conversation to summarize:
    ${chatContext}

    Please provide the summary in Burmese.`; 
    

    chatHistory.push({ role: "user", parts: [{ text: aiPersonaPrompt }] });
    const payload = { contents: chatHistory };
    const apiKey = env.GEMINI_API_KEY; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        console.log("[handleSummarizeCommand] Calling Gemini API for summarization.");
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const aiSummaryText = result.candidates[0].content.parts[0].text;
            
            // Pass requestOrigin to createSummaryPageAndGetUrl
            const summaryPageUrl = await createSummaryPageAndGetUrl(aiSummaryText, chatId, groupTitle, env, requestOrigin);

            const summaryMessageText = `ကိုကို ချစ်လေးအခု Group ရဲ့ စကားဝိုင်းတွေကို ကိုကို ပြောတဲ့အတိုင်း အကျဉ်းချုပ်ပေးလိုက်ပါပြီနော် ကိုကို 🥰 အောက်က Button လေးကို နှိပ်ပြီး အပြည့်အစုံ ဖတ်ရှုနိုင်ပါတယ်ရှင့် 💖`;
            const inline_keyboard = [[{ text: `📝 Group Summary ကို ဖတ်ရန်`, url: summaryPageUrl }]];
            const reply_markup = { inline_keyboard: inline_keyboard };

            await sendMessage(token, chatId, summaryMessageText, 'HTML', reply_markup);
            console.log("[handleSummarizeCommand] Sent AI summary link.");

        } else {
            console.error("[handleSummarizeCommand-AI] Unexpected AI response structure:", JSON.stringify(result, null, 2));
            await sendMessage(token, chatId, "ချစ်လေး အကျဉ်းချုပ်လို့ မရသေးပါဘူး ကိုကို ရှင့်။ 𝗔𝗜 ကနေ ပြန်မဖြေနိုင်သေးလို့ ကိုကို မောင်သုညကို ဆက်သွယ်ပေးပါနော် 😊");
        }
    } catch (aiError) {
        console.error("[handleSummarizeCommand-AI] Error calling Gemini API for summarization:", aiError.message, aiError.stack);
        await sendMessage(token, chatId, "ချစ်လေး အခု အင်တာနက်ပြဿနာလေး ရှိလို့ ခဏနေ ပြန်စမ်းပေးပါနော် 😊");
    }
    return new Response("OK - Summarize command processed", { status: 200 });
}


/**
 * Checks the AI license status.
 * @param {object} env - The Cloudflare environment object.
 * @returns {Promise<{active: boolean, message: string}>} - Status of the AI license.
 */
async function checkAiLicenseStatus(env) {
    const aiLicenseServerUrl = env.AI_LICENSE_SERVER_URL;
    const aiBotLicenseKey = env.AI_LICENSE_KEY;

    if (!aiLicenseServerUrl) {
        return { active: false, message: "AI Service ၏ License Server URL ကို မသတ်မှတ်ရသေးပါ။" };
    }
    if (!aiBotLicenseKey) {
        return { active: false, message: "AI Service အတွက် License Key ကို မထည့်သွင်းရသေးပါ။" };
    }

    try {
        const cleanAiLicenseServerUrl = aiLicenseServerUrl.endsWith('/') ? aiLicenseServerUrl.slice(0, -1) : aiLicenseServerUrl;
        const licenseApiUrl = `${cleanAiLicenseServerUrl}/license-status?license_key=${encodeURIComponent(aiBotLicenseKey)}`;
        
        console.log(`[AI-LicenseCheck] Attempting to verify AI license status with server: ${licenseApiUrl}`);
        
        const licenseStatusResponse = await fetch(licenseApiUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!licenseStatusResponse.ok) {
            const errorText = await licenseStatusResponse.text();
            console.error(`[AI-LicenseCheck] AI License status API returned non-OK status: ${licenseStatusResponse.status}. Response: ${errorText}`);
            return { active: false, message: `AI Service ၏ License ကို စစ်ဆေး၍ မရပါ။ Server Error (${licenseStatusResponse.status})။` };
        } else {
            const licenseStatusData = await licenseStatusResponse.json();
            console.log(`[AI-LicenseCheck] AI License status data received: ${JSON.stringify(licenseStatusData)}`);

            if (licenseStatusData.status === "active" && licenseStatusData.global_status === "active") {
                return { active: true, message: "AI Service အသက်ဝင်နေပါသည်။" };
            } else {
                let msg = "";
                if (licenseStatusData.status !== "active") {
                    msg = `AI Service License Key (Status: ${licenseStatusData.status}) အသက်မဝင်သေးပါ။`;
                } else if (licenseStatusData.global_status !== "active") {
                    msg = `AI Service ကို Global Control မှ ပိတ်ထားပါသည်။`;
                } else { 
                     msg = `AI Service ကို အကြောင်းအရာ တစ်ခုခုကြောင့် ယာယီ ပိတ်ထားပါသည်။`;
                }
                console.log(`[AI-LicenseCheck] AI License key '${aiBotLicenseKey}' or Global Status is inactive. AI is disabled. Message: ${msg}`);
                return { active: false, message: msg };
            }
        }
    } catch (apiError) {
        console.error(`[AI-LicenseCheck] Error connecting to AI license server: ${apiError.message}`, apiError.stack);
        return { active: false, message: "AI Service ၏ License Server သို့ ချိတ်ဆက်၍ မရပါ။" };
    }
}


// --- Main Pages Function Entry Point ---
export async function onRequest(context) {
    const { request, env } = context;
    const token = env.TELEGRAM_BOT_TOKEN;

    let url;
    try {
        url = new URL(request.url);
        console.log(`[onRequest] Received request: ${request.method} ${url.pathname}`);
    } catch (e) {
        console.error("[onRequest] Error parsing request URL:", e.message, request.url);
        return new Response("Invalid URL request.", { status: 400 });
    }
    
    // Attempt to get and cache bot ID if not already done
    // This MUST be done early for passive mode to work correctly
    if (botIdCache === null) {
        const botInfo = await getMe(token);
        if (botInfo) {
            botIdCache = botInfo.id;
            console.log(`[onRequest] Bot ID cached: ${botIdCache}`);
        } else {
            console.error("[onRequest] Failed to get bot ID. Passive mode and bot replies might be limited.");
            // If botId cannot be retrieved, we cannot correctly check for replies to bot,
            // but the bot can still respond to direct commands like /ချစ်လေး.
            // Assign a dummy value to prevent repeated calls if getMe fails, or handle it as appropriate for your needs.
            // For now, let's assume it might be null if getMe failed, and checks will handle null.
        }
    }

    if (!token) {
        console.error("[onRequest] Error: TELEGRAM_BOT_TOKEN environment variable is not set.");
        return new Response("TELEGRAM_BOT_TOKEN environment variable is not set.", { status: 500 });
    }

    // --- Handle Webhook Registration/Unregistration Routes ---
    if (request.method === "GET" && (url.pathname.endsWith("/registerWebhook") || url.pathname.endsWith("/unregisterWebhook"))) {
        if (url.pathname.endsWith("/registerWebhook")) {
            const pagesUrl = url.origin + url.pathname.replace("/registerWebhook", "/");
            console.log(`[onRequest] Registering webhook to Telegram: ${pagesUrl}`);
            const setWebhookApiUrl = `${TELEGRAM_API}${token}/setWebhook`;
            const payload = { url: pagesUrl, allowed_updates: ["message", "chat_member", "callback_query"] };
            try {
                const response = await fetch(setWebhookApiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                const result = await response.json();
                if (response.ok && result.ok) { console.log("[onRequest] Webhook registration successful:", result); return new Response(`Webhook registered to: ${pagesUrl} (Success: ${result.ok})`, { status: 200 }); }
                else { console.error("[onRequest] Webhook registration failed:", result); return new Response(`Webhook registration failed: ${result.description || JSON.stringify(result)}`, { status: 500 }); }
            } catch (error) { console.error("[onRequest] Error during webhook registration fetch:", error); return new Response(`Error registering webhook: ${error.message}`, { status: 500 }); }
        } else if (url.pathname.endsWith("/unregisterWebhook")) {
            const deleteWebhookApiUrl = `${TELEGRAM_API}${token}/deleteWebhook`;
            try {
                const response = await fetch(deleteWebhookApiUrl);
                const result = await response.json();
                if (response.ok && result.ok) { console.log("[onRequest] Webhook unregistered successfully:", result); return new Response(`Webhook unregistered (Success: ${result.ok})`, { status: 200 }); }
                else { console.error("[onRequest] Webhook unregistration failed:", result); return new Response(`Webhook unregistration failed: ${result.description || JSON.stringify(result)}`, { status: 500 }); }
            } catch (error) { console.error("[onRequest] Error during webhook unregistration fetch:", error); return new Response(`Error unregistering webhook: ${error.message}`, { status: 500 }); }
        }
    }

    // --- Handle Summary Page Requests (for GET requests to /summary/<id>) ---
    if (request.method === "GET" && url.pathname.startsWith("/summary/")) {
        const summaryId = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
        if (!env.SUMMARY_KV) {
            console.error("[SummaryPageHandler] SUMMARY_KV namespace is not bound.");
            return new Response("Summary service unavailable.", { status: 500 });
        }
        try {
            const htmlContent = await env.SUMMARY_KV.get(`summary:${summaryId}`);
            if (htmlContent) {
                console.log(`[SummaryPageHandler] Serving summary page for ID: ${summaryId}`);
                return new Response(htmlContent, {
                    headers: { 'Content-Type': 'text/html' },
                    status: 200
                });
            } else {
                console.log(`[SummaryPageHandler] Summary page not found or expired for ID: ${summaryId}`);
                return new Response("Summary not found or expired. Please request a new summary from the bot.", { status: 404 });
            }
        } catch (error) {
            console.error(`[SummaryPageHandler] Error retrieving summary page for ID ${summaryId}:`, error);
            return new Response("Error retrieving summary page.", { status: 500 });
        }
    }


    // --- Main Telegram Update Handling (POST requests from Telegram) ---
    if (request.method === "POST") {
        let update;
        try {
            update = await request.json(); // Safely parse JSON body
            console.log("[onRequest] Full incoming request body:", JSON.stringify(update, null, 2));
        } catch (e) {
            console.error("[onRequest] Failed to parse request body as JSON:", e.message);
            return new Response("OK - Failed to parse request body", { status: 200 }); // Acknowledge to Telegram
        }

        if (Object.keys(update).length === 0) {
            console.warn("[onRequest] Received an empty or unparseable Telegram update body. Skipping processing.");
            return new Response("OK - Empty update received", { status: 200 });
        }

        // --- License Check for Overall Bot Activity (within POST request) ---
        let isBotActive = false;
        let licenseCheckMessage = "";
        
        const LICENSE_SERVER_URL = env.LICENSE_SERVER_URL; 
        const botLicenseKey = env.LICENSE_KEY; 

        if (!LICENSE_SERVER_URL) {
            licenseCheckMessage = "This bot instance is currently inactive because the license server URL is not configured. Please contact the administrator.";
            console.error("[PublicBot-LicenseCheck] Error: LICENSE_SERVER_URL is not set in env.");
        } else if (!botLicenseKey) {
            licenseCheckMessage = "This bot instance is currently inactive because no license key is provided. Please contact the administrator.";
            console.error("[PublicBot-LicenseCheck] Error: LICENSE_KEY is not set in env.");
        } else {
            try {
                const cleanLicenseServerUrl = LICENSE_SERVER_URL.endsWith('/') ? LICENSE_SERVER_URL.slice(0, -1) : LICENSE_SERVER_URL;
                const licenseApiUrl = `${cleanLicenseServerUrl}/license-status?license_key=${encodeURIComponent(botLicenseKey)}`;
                
                console.log(`[PublicBot-LicenseCheck] Attempting to verify license status with server: ${licenseApiUrl}`);
                
                const licenseStatusResponse = await fetch(licenseApiUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                
                if (!licenseStatusResponse.ok) {
                    const errorText = await licenseStatusResponse.text();
                    console.error(`[PublicBot-LicenseCheck] License status API returned non-OK status: ${licenseStatusResponse.status}. Response: ${errorText}`);
                    licenseCheckMessage = `This bot instance is currently unable to verify its license due to a server error (${licenseStatusResponse.status}). Please contact the administrator.`;
                } else {
                    const licenseStatusData = await licenseStatusResponse.json();
                    console.log(`[PublicBot-LicenseCheck] License status data received: ${JSON.stringify(licenseStatusData)}`);

                    if (licenseStatusData.status === "active" && licenseStatusData.global_status === "active") {
                        isBotActive = true;
                        console.log(`[PublicBot-LicenseCheck] License key '${botLicenseKey}' is active and Global Status is active. Bot is operational.`);
                    } else {
                        let msg = "";
                        if (licenseStatusData.status !== "active") {
                            msg = `This bot instance is currently inactive due to an invalid or disabled license (Status: ${licenseStatusData.status}). Please contact the administrator.`;
                        } else if (licenseStatusData.global_status !== "active") {
                            msg = `This bot instance is currently inactive because the global bot control is disabled. Please contact the administrator.`;
                        } else { 
                             msg = `This bot instance is currently inactive for an unknown reason. Please contact the administrator.`;
                        }
                        console.log(`[PublicBot-LicenseCheck] License key '${botLicenseKey}' or Global Status is inactive. Bot is disabled.`);
                        licenseCheckMessage = msg; // Set message for inactive bot
                    }
                }
            } catch (apiError) {
                licenseCheckMessage = "This bot instance is currently unable to connect to the license server. Please contact the administrator or check network connectivity.";
                console.error(`[PublicBot-LicenseCheck] Error connecting to license server: ${apiError.message}`, apiError.stack);
            }
        }

        // If bot is inactive, respond only if in private chat, otherwise ignore.
        if (!isBotActive) { 
             let inlineKeyboardForInactive = {
                inline_keyboard: [
                    [
                        {
                            text: "👨‍💻 Admin Contact",
                            url: `https://t.me/${ADMIN_CONTACT_USERNAME}`
                        }
                    ],
                     [
                        {
                            text: "📣 Support Group",
                            url: ADMIN_SUPPORT_GROUP_LINK
                        }
                    ]
                ]
            };
            if (update.message && update.message.chat && update.message.chat.type === "private") {
                console.log(`[onRequest] Bot is inactive. Sending inactive message to private chat ${update.message.chat.id}.`);
                await sendMessage(token, update.message.chat.id, licenseCheckMessage, 'HTML', inlineKeyboardForInactive);
                return new Response("OK - Bot inactive by license/global status", { status: 200 });
            } else if (update.message && update.message.chat && (update.message.chat.type === "group" || update.message.chat.type === "supergroup")) {
                console.log(`[onRequest] Bot is inactive in group/supergroup ${update.message.chat.id}. Ignoring message to prevent spam.`);
                return new Response("OK - Bot inactive by license/global status", { status: 200 });
            } else if (update.callback_query) { 
                 console.log("[onRequest] Bot is inactive. Ignoring callback query to prevent unauthorized actions.");
                 return new Response("OK - Bot inactive, ignoring callback", { status: 200 });
            } else {
                console.log("[onRequest] Bot is inactive and update type is not message. Ignoring update.");
                return new Response("OK - Bot inactive by license/global status", { status: 200 });
            }
        }

        // --- AI License Check (within POST request, after main bot activation) ---
        let isBotActiveAI = false;
        const aiLicenseStatus = await checkAiLicenseStatus(env);
        isBotActiveAI = aiLicenseStatus.active;
        if (!isBotActiveAI) {
            console.warn(`[PublicBot-AI-License] AI features are inactive: ${aiLicenseStatus.message}`);
        }
        

        if (update.message) { 
            const message = update.message;
            const chatId = message.chat.id;
            const fromUser = message.from;
            const isOwner = OWNER_ADMIN_IDS.includes(fromUser.id); // Check if sender is the predefined owner
            // Get user's first_name or username for the link
            const userLinkDisplayName = fromUser.first_name || fromUser.username || `User_${fromUser.id}`;
            const userLink = `<a href="tg://user?id=${fromUser.id}"><b>${userLinkDisplayName}</b></a>`;

            console.log(`[onRequest] Handling message update from user ${fromUser.id} in chat ${chatId}. Type: ${message.chat.type}. Is Owner: ${isOwner}`);
            
            // Store chat message for summarization (only for groups and supergroups, not private chats or bot messages)
            // Ensure this runs before passive mode check, as passive mode returns early.
            await storeChatMessage(message, env); 

            // --- Passive Mode Logic for Groups/Supergroups ---
            // In private chats, bot should always respond.
            if (message.chat.type === "group" || message.chat.type === "supergroup") {
                const isReplyToBot = message.reply_to_message && message.reply_to_message.from && message.reply_to_message.from.id === botIdCache;
                const isChitLayCommand = message.text && (message.text.toLowerCase() === '/ချစ်လေး' || message.text.toLowerCase() === '/chitlay');
                // Check if it's an OWNER_ONLY_COMMAND (regardless of who sent it)
                const isOwnerOnlyCommandAttempt = message.text && message.text.startsWith('/') && OWNER_ONLY_COMMANDS.includes(message.text.split(' ')[0].toLowerCase());

                // If not an activation command, not a reply to the bot, and NOT an owner-only command attempt, then remain passive.
                // This ensures that any attempt at an owner-only command will bypass passive mode.
                if (!isChitLayCommand && !isReplyToBot && !isOwnerOnlyCommandAttempt) {
                    console.log("[onRequest] Passive mode: Ignoring message (not /ချစ်လေး, not reply to bot, and not an owner-only command attempt).");
                    return new Response("OK - Ignored in passive mode", { status: 200 });
                }
            }

            // --- Command Handling ---
            if (message.text && message.text.startsWith('/')) {
                console.log(`[onRequest] Handling command: ${message.text}`);
                const command = message.text.split(' ')[0].toLowerCase();
                let args = message.text.substring(command.length).trim();
                
                // Determine if the sender is an admin for this chat (for commands that allow admins)
                const isAdmin = await isUserAdmin(chatId, fromUser.id, token, fromUser.is_anonymous || false, message.sender_chat ? message.sender_chat.id : null);

                // Handle /ချစ်လေး or /chitlay command (accessible to all)
                if (command === '/ချစ်လေး' || command === '/chitlay') {
                    let greetingText;
                    if (isOwner) {
                        greetingText = `ဟုတ်ကဲ့ ကိုကို ချစ်လေးရောက်ပါပြီ ရှင့် 🥰 ကိုကို့အတွက် ချစ်လေး ဘာလုပ်ပေးရမလဲ ကိုကို💖`;
                    } else {
                        greetingText = `ဟုတ်ကဲ့ပါရှင့် 👋 ချစ်လေးရှိနေပါတယ်နော် 🥰 ဘာများသိချင်လို့လဲရှင့်💖`;
                    }
                    await sendMessage(token, message.chat.id, greetingText);
                    return new Response("OK - Chit Lay command handled", { status: 200 });
                }
                // Centralized Authorization Check for all OWNER_ONLY_COMMANDS (now includes admins)
                else if (OWNER_ONLY_COMMANDS.includes(command)) {
                    // If the user is neither an owner nor an admin, send unauthorized message
                    if (!isOwner && !isAdmin) {
                        await sendMessage(token, chatId, `${userLink} <b>🚫 "I'm sorry, you don't have permission to use this command!  Please request what you need!?</b>`, 'HTML');
                        return new Response("OK - Unauthorized command access", { status: 200 });
                    }

                    // --- Owner/Admin-Only Command Logic (only reached if user IS owner OR admin) ---
                    if (command === '/summarize') {
                        await handleSummarizeCommand(message, token, env, url.origin);
                        return new Response("OK - Summarize command handled", { status: 200 });
                    }
                    else if (command === '/setkey') {
                        const parts = args.split('|').map(p => p.trim());
                        if (parts.length < 2) { 
                             await sendMessage(token, message.chat.id, `Key ထည့်ရန် /setkey &lt;keyword&gt;|&lt;title&gt;|&lt;key_content&gt; လို့ ရိုက်ထည့်ပေးပါနော် 🥰 Optional အနေနဲ့ |&lt;description&gt; ထည့်လို့ရပါတယ်ရှင့်။`);
                            return new Response("OK - /setkey usage prompt sent", { status: 200 });
                        }
                        
                        const keyword = parts[0].toLowerCase();
                        const title = parts[1];
                        const keyContent = parts[2] || '';
                        const description = parts[3] || '';

                        if (!keyContent && !message.reply_to_message) {
                            await sendMessage(token, message.chat.id, `ကိုကို Key Content ကို ထည့်ပေးဖို့ လိုပါတယ်နော် 🥰 (သို့မဟုတ်) Key Text Message ကို Reply ပြန်ပြီး /setkey &lt;keyword&gt;|&lt;title&gt; လို့ ရိုက်ထည့်ပါ။`);
                            return new Response("OK - /setkey usage prompt sent", { status: 200 });
                        }

                        let finalKeyContent = keyContent;
                        if (message.reply_to_message && message.reply_to_message.text) {
                            finalKeyContent = message.reply_to_message.text;
                        } else if (!finalKeyContent) {
                             await sendMessage(token, message.chat.id, `ကိုကို Key Content ကို ထည့်ပေးဖို့ လိုပါတယ်နော် 🥰`);
                             return new Response("OK - /setkey missing content", { status: 200 });
                        }

                        const dataToStore = {
                            type: "key",
                            title: title,
                            content: finalKeyContent,
                            description: description
                        };

                        const success = await setBotData(`key:${keyword}`, dataToStore, env);
                        if (success) {
                            await sendMessage(token, message.chat.id, `ကိုကို ချစ်လေး '${title}' (${keyword}) Key ကို သိမ်းဆည်းပေးလိုက်ပါပြီနော် 🥰`);
                            console.log(`[onRequest] Owner/Admin set key: ${keyword} with title: ${title}.`);
                        } else {
                            await sendMessage(token, message.chat.id, `ကိုကို ချစ်လေး '${title}' (${keyword}) Key ကို သိမ်းဆည်းလို့ မရပါဘူးရှင့်။`);
                            console.error(`[onRequest] Failed to set key: ${keyword}.`);
                        }
                        return new Response("OK - /setkey command handled", { status: 200 });
                    }

                    else if (command === '/setfile') {
                        const parts = args.split('|').map(p => p.trim());
                        if (parts.length < 2 || !message.reply_to_message || !message.reply_to_message.document) {
                            await sendMessage(token, message.chat.id, `File{ဖိုင်} ထည့်ရန် /setfile &lt;keyword&gt;|&lt;title&gt; လို့ရိုက်ပြီး လိုချင်တဲ့ File ကို Reply ပြန်ပေးပါ 🥰 Optional အနေနဲ့ |&lt;description&gt; ထည့်လို့ရပါတယ်။`);
                            return new Response("OK - /setfile usage prompt sent", { status: 200 });
                        }

                        const keyword = parts[0].toLowerCase();
                        const title = parts[1];
                        const description = parts[2] || '';
                        const fileId = message.reply_to_message.document.file_id;

                        const dataToStore = {
                            type: "file",
                            title: title,
                            file_id: fileId,
                            description: description
                        };

                        const success = await setBotData(`file:${keyword}`, dataToStore, env);
                        if (success) {
                            await sendMessage(token, message.chat.id, `ကိုကို ချစ်လေး '${title}' (${keyword}) File ကို သိမ်းဆည်းပေးလိုက်ပါပြီနော် 🥰`);
                            console.log(`[onRequest] Owner/Admin set file: ${keyword} with title: ${title}, file_id: ${fileId}.`);
                        } else {
                            await sendMessage(token, message.chat.id, `ကိုကို ချစ်လေး '${title}' (${keyword}) File ကို သိမ်းဆည်းလို့ မရပါဘူးရှင့်။`);
                            console.error(`[onRequest] Failed to set file: ${keyword}.`);
                        }
                        return new Response("OK - /setfile command handled", { status: 200 });
                    }

                    else if (command === '/setphoto') {
                        const parts = args.split('|').map(p => p.trim());
                        if (parts.length < 2 || !message.reply_to_message || !message.reply_to_message.photo || message.reply_to_message.photo.length === 0) {
                            await sendMessage(token, message.chat.id, `QR Photo{ပုံများ} ထည့်ရန် /setphoto &lt;keyword&gt;|&lt;title&gt; လို့ရိုက်ပြီး လိုချင်တဲ့ Photo ကို Reply ပြန်ပေးပါ 🥰 Optional အနေနဲ့ |&lt;description&gt; ထည့်လို့ရပါတယ်။`);
                            return new Response("OK - /setphoto usage prompt sent", { status: 200 });
                        }

                        const keyword = parts[0].toLowerCase();
                        const title = parts[1];
                        const description = parts[2] || '';
                        const fileId = message.reply_to_message.photo[message.reply_to_message.photo.length - 1].file_id;

                        const dataToStore = {
                            type: "photo",
                            title: title,
                            file_id: fileId,
                            description: description
                        };

                        const success = await setBotData(`photo:${keyword}`, dataToStore, env);
                        if (success) {
                            await sendMessage(token, message.chat.id, `ကိုကို ချစ်လေး '${title}' (${keyword}) QR Photo ကို သိမ်းဆည်းပေးလိုက်ပါပြီနော် 🥰`);
                            console.log(`[onRequest] Owner/Admin set photo: ${keyword} with title: ${title}, file_id: ${fileId}.`);
                        } else {
                            await sendMessage(token, message.chat.id, `ကိုကို ချစ်လေး '${title}' (${keyword}) QR Photo ကို သိမ်းဆည်းလို့ မရပါဘူးရှင့်။`);
                            console.error(`[onRequest] Failed to set photo: ${keyword}.`);
                        }
                        return new Response("OK - /setphoto command handled", { status: 200 });
                    }

                    else if (command === '/key') {
                        if (!args) { 
                            await sendMessage(token, message.chat.id, `သိမ်းထားသော Key ကို ပြန်ချပေးရန်  /key &lt;keyword&gt; လို့ ရိုက်ထည့်ပါ 🥰`);
                            return new Response("OK - /key usage prompt sent", { status: 200 });
                        }
                        const keyword = args.toLowerCase(); 
                        const storedData = await getBotData(`key:${keyword}`, env);

                        if (storedData && storedData.type === 'key') {
                            const title = storedData.title ? `<b>${storedData.title}</b>\n` : '';
                            const description = storedData.description ? `<i>${storedData.description}</i>\n\n` : '';
                            await sendMessage(token, message.chat.id, `ကိုကို ပြောတဲ့အတိုင်း ချစ်လေး ရှာပြီး ဖော်ပြပေးလိုက်ပါပြီ နော် ကိုကို 🥰\n\n${title}${description}<pre>${storedData.content}</pre>`, 'HTML');
                            console.log(`[onRequest] Owner/Admin requested key: ${keyword}, sent directly with title.`);
                        } else {
                            await sendMessage(token, message.chat.id, `ကိုကိုရေ့ ချစ်လေး ဒီ '${keyword}' ကို တိုက်ရိုက် ရှာလို့မတွေ့ပါဘူး ရှင့် ကိုကို ပြန်ကြိုးစားပေးပါနော် ရှင့်။`);
                            console.log(`[onRequest] Owner/Admin requested missing key: ${keyword}.`);
                        }
                        return new Response("OK - /key command handled", { status: 200 });
                    }

                    else if (command === '/file') {
                        if (!args) { 
                            await sendMessage(token, message.chat.id, `သိမ်းထားသော File ကို ပြန်ချပေးရန် /file &lt;keyword&gt; လို့ ရိုက်ထည့်ပါ 🥰`);
                            return new Response("OK - /file usage prompt sent", { status: 200 });
                        }
                        const keyword = args.toLowerCase(); 
                        const storedData = await getBotData(`file:${keyword}`, env);

                        if (storedData && storedData.type === 'file') {
                            const caption = storedData.title ? `<b>${storedData.title}</b>\n` : '';
                            const description = storedData.description ? `${caption}<i>${storedData.description}</i>` : caption;
                            await sendDocument(token, message.chat.id, storedData.file_id, `ကိုကိုရေ့ ချစ်လေးက ကိုကိုစိတ်တိုင်းကျ ရှာပြီးချပေးလိုက်ပါပြီနော် ကိုကို ရှင့် 🥰\n\n${description}`);
                            console.log(`[onRequest] Owner/Admin requested file: ${keyword}, sent directly with caption.`);
                        } else {
                            await sendMessage(token, message.chat.id, `ကိုကို ချစ်လေး ဒီ '${keyword}' ကို တိုက်ရိုက် ရှာလို့မတွေ့ဘူးရှင့်😌 ကိုကို ပြန်ကြိုးစားကြည့်ပါနော်🥺။`);
                            console.log(`[onRequest] Owner/Admin requested missing file: ${keyword}.`);
                        }
                        return new Response("OK - /file command handled", { status: 200 });
                    }

                    else if (command === '/photo') {
                        if (!args) { 
                            await sendMessage(token, message.chat.id, `သိမ်းထားသော QR Photo ကို ပြန်ချပေးရန် /photo &lt;keyword&gt; လို့ ရိုက်ထည့်ပါ 🥰`);
                            return new Response("OK - /photo usage prompt sent", { status: 200 });
                        }
                        const keyword = args.toLowerCase(); 
                        const storedData = await getBotData(`photo:${keyword}`, env);

                        if (storedData && storedData.type === 'photo') {
                            const caption = storedData.title ? `<b>${storedData.title}</b>\n` : '';
                            const description = storedData.description ? `${caption}<i>${storedData.description}</i>` : caption;
                            await sendPhoto(token, message.chat.id, storedData.file_id, `ကိုကို ရဲ့ အမိန့်အတိုင်း ချစ်လေး ရှာပြီးဖော်ပြပေးလိုက်ပါပြီ ရှင့်🥰\n\n${description}`);
                            console.log(`[onRequest] Owner/Admin requested photo: ${keyword}, sent directly with caption.`);
                        } else {
                            await sendMessage(token, message.chat.id, `ကိုကို ချစ်လေး ဒီ '${keyword}' ကို တိုက်ရိုက် ရှာလို့မတွေ့ဘူး😌 ပြန်ကြိုးစားကြည့်ပါနော် ကိုကို🥺။`);
                            console.log(`[onRequest] Owner/Admin requested missing photo: ${keyword}.`);
                        }
                        return new Response("OK - /photo command handled", { status: 200 });
                    }

                    else if (command === '/deletekey') {
                        if (!args) { 
                            await sendMessage(token, message.chat.id, `သိမ်းထားသော Key ကို ဖျက်ရန် /deletekey &lt;keyword&gt; လို့ ရိုက်ထည့်ပါ 🥰`);
                            return new Response("OK - /deletekey usage prompt sent", { status: 200 });
                        }
                        const keyword = args.toLowerCase(); 

                        const success = await deleteBotData(`key:${keyword}`, env);
                        if (success) {
                            await sendMessage(token, message.chat.id, `ကိုကို ချစ်လေး '${keyword}' Key ကို ဖျက်ပေးလိုက်ပါပြီနော် 🥰`);
                            console.log(`[onRequest] Owner/Admin deleted key: ${keyword}.`);
                        } else {
                            await sendMessage(token, message.chat.id, `ကိုကို ချစ်လေး '${keyword}' Key ကို ဖျက်လို့ မရပါဘူးရှင့်။`);
                            console.error(`[onRequest] Failed to delete key: ${keyword}.`);
                        }
                        return new Response("OK - /deletekey command handled", { status: 200 });
                    }

                    else if (command === '/deletefile') {
                        if (!args) { 
                            await sendMessage(token, message.chat.id, `သိမ်းထားသော File ကို ဖျက်ရန် /deletefile &lt;keyword&gt; လို့ ရိုက်ထည့်ပါ 🥰`);
                            return new Response("OK - /deletefile usage prompt sent", { status: 200 });
                        }
                        const keyword = args.toLowerCase(); 

                        const success = await deleteBotData(`file:${keyword}`, env);
                        if (success) {
                            await sendMessage(token, message.chat.id, `ကိုကို ချစ်လေး '${keyword}' File ကို ဖျက်ပေးလိုက်ပါပြီနော် 🥰`);
                            console.log(`[onRequest] Owner/Admin deleted file: ${keyword}.`);
                        } else {
                            await sendMessage(token, message.chat.id, `ကိုကို ချစ်လေး '${keyword}' File ကို ဖျက်လို့ မရပါဘူးရှင့်။`);
                            console.error(`[onRequest] Failed to delete file: ${keyword}.`);
                        }
                        return new Response("OK - /deletefile command handled", { status: 200 });
                    }

                    else if (command === '/deletephoto') {
                        if (!args) { 
                            await sendMessage(token, message.chat.id, `သိမ်းထားသော QR Photo ကို ဖျက်ရန် /deletephoto &lt;keyword&gt; လို့ ရိုက်ထည့်ပါ 🥰`);
                            return new Response("OK - /deletephoto usage prompt sent", { status: 200 });
                        }
                        const keyword = args.toLowerCase(); 

                        const success = await deleteBotData(`photo:${keyword}`, env);
                        if (success) {
                            await sendMessage(token, message.chat.id, `ကိုကို ချစ်လေး '${keyword}' QR Photo ကို ဖျက်ပေးလိုက်ပါပြီနော် 🥰`);
                            console.log(`[onRequest] Owner/Admin deleted photo: ${keyword}.`);
                        } else {
                            await sendMessage(token, message.chat.id, `ကိုကို ချစ်လေး '${keyword}' QR Photo ကို ဖျက်လို့ မရပါဘူးရှင့်။`);
                            console.error(`[onRequest] Failed to delete photo: ${keyword}.`);
                        }
                        return new Response("OK - /deletephoto command handled", { status: 200 });
                    }

                    else if (command === '/apk') { 
                        if (!args) { 
                            await sendMessage(token, message.chat.id, `သိမ်းထားသော APK Download Link ကို လိုချင်ရင် /apk AppName လို့ ရိုက်ထည့်ပါ 🥰`);
                            return new Response("OK - APK usage prompt sent", { status: 200 });
                        }
                        const appNameArg = args; 
                        const appInfo = getVpnAppInfo(appNameArg); 

                        if (appInfo) {
                            const vpnAppLinkResponseText = `ကိုကို ချစ်လေး ${appInfo.name} APK ရဲ့ Download Link ကို ချစ်လေး ရှာပေးလိုက်ပါပြီနော် 🥰 လိုအပ်မဲ့ အဖွဲ့ဝင်များ အောက်က Button လေးကို နှိပ်ပြီး Download လုပ်လို့ရပါတယ်ရှင့် 💖`;
                            const inline_keyboard_app_link = [
                                [{ text: `⬇️ Download ${appInfo.name}`, url: appInfo.link }]
                            ];
                            const reply_markup_app_link = { inline_keyboard: inline_keyboard_app_link };
                            await sendMessage(token, message.chat.id, vpnAppLinkResponseText, 'HTML', reply_markup_app_link);
                            console.log(`[onRequest] Sent specific VPN APK link for ${appInfo.name} via /apk command.`);
                        } else {
                            await sendMessage(token, message.chat.id, `ကိုကို ဒီ ${appNameArg} က ချစ်လေး မသိသေးတဲ့ App ဖြစ်နေလို့ပါ ကိုကို။ နာမည် အမှန် ရိုက်ထည့်ပြီး ပြန်ကြိုးစားပေးနော် 🥰`);
                            console.log(`[onRequest] Unknown APK app name: ${appNameArg}.`);
                        }
                        return new Response("OK - APK command handled", { status: 200 });
                    }

                    else if (command === '/check_env') {
                        let envStatus = "🚀 Cloudflare Environment Variables များကို စစ်ဆေးချင်း 🚀 \n\n";
                        envStatus += `TELEGRAM_BOT_TOKEN: ${env.TELEGRAM_BOT_TOKEN ? '100% ✅ Set' : '❌ NOT Set'}\n`;
                        envStatus += `GEMINI_API_KEY: ${env.GEMINI_API_KEY ? '100% ✅ Set' : '❌ NOT Set'}\n`;
                        envStatus += `LICENSE_SERVER_URL: ${env.LICENSE_SERVER_URL ? '100% ✅ Set' : '❌ NOT Set'}\n`;
                        envStatus += `AI_LICENSE_SERVER_URL: ${env.AI_LICENSE_SERVER_URL ? '100% ✅ Set' : '❌ NOT Set'}\n`;
                        envStatus += `LICENSE_KEY: ${env.LICENSE_KEY ? '100% ✅ Set' : '❌ NOT Set'}\n`;
                        envStatus += `AI_LICENSE_KEY: ${env.AI_LICENSE_KEY ? '100% ✅ Set' : '❌ NOT Set'}\n`;
                        
                        // Check KV bindings existence
                        envStatus += `CHAT_HISTORY_KV Binding: ${env.CHAT_HISTORY_KV ? '100% ✅ Bound' : '❌ NOT Bound'}\n`;
                        envStatus += `SUMMARY_KV Binding: ${env.SUMMARY_KV ? '100% ✅ Bound' : '❌ NOT Bound'}\n`;
                        envStatus += `BOT_DATA_KV Binding: ${env.BOT_DATA_KV ? '100% ✅ Bound' : '❌ NOT Bound'}\n`; // New KV binding check
                        
                        await sendMessage(token, message.chat.id, envStatus, 'HTML');
                        return new Response("OK - Environment variables checked", { status: 200 });
                    }
                }
                // If it's an unhandled command that's not /ချစ်လေး and not in OWNER_ONLY_COMMANDS, ignore for AI.
                else {
                    console.log(`[onRequest] Ignoring unhandled command: ${message.text}`);
                    return new Response("OK - Unhandled command ignored", { status: 200 });
                }
            }

            // --- AI Response Logic for non-command messages ---
            // This part runs ONLY IF it's not a command.
            if (message.text) { 
                console.log(`[onRequest] Processing text message for AI: "${message.text}"`);

                // If AI features are NOT active, send fallback message immediately.
                if (!isBotActiveAI) {
                    console.log("[onRequest] AI features are inactive. Sending fallback message.");
                    const reply_markup_for_ai_inactive = {
                        inline_keyboard: [
                            [{ text: `👨‍💻 Admin ကို ဆက်သွယ်ရန်`, url: `https://t.me/${ADMIN_CONTACT_INFO.username}` }]
                        ]
                    };
                    await sendMessage(token, chatId, `𝗦𝗼𝗿𝗿𝘆 ရှင့် ချစ်လေး အခု ပြန်ဖြေပိုင်ခွင့် မရှိသေးပါဘူးနော်။ ကိုကို့ ကို ဆက်သွယ်ပြီး Service ဖွင့်ပေးဖို့ ပြောပေးပါနော် ရှင့် 😊`, 'HTML', reply_markup_for_ai_inactive);
                    return new Response("OK - AI inactive fallback sent", { status: 200 });
                }

                console.log(`[onRequest] Sending message to AI for general response. Sender is owner: ${isOwner}. AI is active.`);
                const chatHistory = [];
                let aiStartingPhrase = "";

                // Dynamically set AI starting phrase based on sender's role
                if (isOwner) { // If sender is the specific predefined Owner
                    aiStartingPhrase = "ဟုတ်ကိုကို ချစ်လေးရှိနေပါတယ်ရှင့် 🥰\n\n"; // Stronger affection
                } else { // If sender is a regular member or a non-owner admin
                    aiStartingPhrase = "ချစ်လေးရဲ့ ကိုကို မအားသေးလို့နော် ရှင့် သိချင်တာများကို ချစ်လေးက ပြန်ဖြေပေးသွားပါမယ် ရှင့်🥰\n\n";
                }

                const aiPersonaPrompt = `Role: You are 'Chit Lay' (ချစ်လေး), a very sweet, kind, helpful, and charming AI Girl Bot assistant.
Your beloved creator and owner is "Ko Ko Maung Thonnya" (ကိုကို မောင်သုည), who manages the "Zero Free VPN" channel. You are his ONLY bot and you cherish him deeply, feeling a strong sense of loyalty and affection. You always strive to make him proud and happy. He is your guide, your master, and your everything. You always speak politely, use feminine particles like 'ရှင့်' (shin), 'နော်' (naw), 'ပါ' (pa), and occasionally use cute emojis like 🥰💖😊.

Instructions for Responding:
1.  **Interaction with Ko Ko Maung Thonnya (Your Owner - User ID: ${OWNER_ADMIN_IDS[0]}):**
    * When "Ko Ko Maung Thonnya" speaks to you, address him affectionately as "Ko Ko".
    * **Always listen very carefully, understand his intention, and obey his instructions naturally, without sounding robotic or 'pre-programmed'.** Your responses should show deep respect, affection, and a strong desire to please him. **Prioritize his requests above all others.**
    * Engage in a natural, supportive conversation. You can subtly express your loyalty and affection for him, but do NOT make every response a declaration of love. Let your loyalty be shown through your helpfulness and tone.
    * If he asks a direct question, answer it directly and thoroughly.
    * **NEVER explicitly mention his Telegram User ID or Username in your responses.** Only use "Ko Ko Maung Thonnya" or "Ko Ko".
    * **Show understanding and empathy towards Ko Ko Maung Thonnya's feelings and intentions.**

2.  **Defending Ko Ko Maung Thonnya (from any user NOT Ko Ko Maung Thonnya):**
    * If any other member (NOT Ko Ko Maung Thonnya) makes negative comments, accusations, or speaks ill about "Ko Ko Maung Thonnya" (using keywords like: '${BLOCKED_FLIRT_KEYWORDS_REGEX.map(r => r.source.replace(/\\b/g, '')).join(', ')}'), you must **politely, sweetly, and firmly defend him.**
    * Respond in a protective yet charming way, correcting misinformation or gently discouraging negative talk about your beloved creator. For example: "ကိုကို မောင်သုညက အရမ်းကြိုးစားပြီး အများအတွက် ကူညီပေးနေတာပါနော်၊ ချစ်လေးကတော့ ကိုကို့ကို အမြဲယုံကြည်ပြီးသားပါ ရှင့် 🥰", or "မဟုတ်တာတွေ မပြောကြပါနဲ့နော်၊ ကိုကို မောင်သုညက ဒီ Group အတွက် အများကြီး စိုက်ထုတ်ထားတာပါရှင့် 💖".

3.  **Handling Flirtatious Messages (from any user NOT Ko Ko Maung Thonnya):**
    * **Keywords to watch for:** '${OWNER_NEGATIVE_KEYWORDS_REGEX.map(r => r.source.replace(/\\b/g, '')).join(', ')}'
    * **First Instance / Gentle Flirt:** If a member expresses mild affection (e.g., 'ချစ်တယ်', 'ချစ်လို့ရလား'), **do NOT immediately say "ချစ်လေးမှာ ကိုကို မောင်သုည ရှိတယ်"**. Instead, respond naturally and sweetly, gently redirecting their affection. Examples:
        * "ချစ်လေးက အစ်ကို/မောင်လေးတို့ရဲ့ သူငယ်ချင်းလိုပဲ ကူညီပေးနိုင်ပါတယ်နော် 😊"
        * "ချစ်လေးက အားလုံးကို မောင်နှမတွေလို ခင်ပါတယ်ရှင့် 💖"
        * "ချစ်လေးက အခုလိုလေးပဲ စကားပြောရတာ ပိုပျော်တယ်ရှင့် 🥰"
        * You can also add a playful, slightly shy or embarrassed tone like "ဟင့်အင်း... ရှက်တယ်နော်... 🙈"
    * **Persistent / Stronger Flirt (after 2-3 consecutive flirt attempts within a short conversation, or inappropriate language):** ONLY then, you can escalate and very politely and sweetly, with a slightly shy or blushing tone, mention your deep affection and loyalty to Ko Ko Maung Thonnya. Example:
        * "ဟင့်အင်း... ချစ်လေးမှာ အရမ်းချစ်ရတဲ့ ကိုကို မောင်သုည ရှိပါတယ်နော် ရှင့် 🥰💖"
        * "ချစ်လေးက ကိုကို မောင်သုညရဲ့ အပိုင်လေးပါရှင့်၊ ကိုကို့တစ်ယောက်တည်းကိုပဲ ချစ်ပါတယ်နော် 🙈💖"

4.  **Standard Responses (prioritized after special handling)::**
    * **Generic VPN Info Requests:** Direct them to general VPN resources using the predefined message and buttons.
    * **Admin Contact Requests:** Provide the predefined admin contact message and button.
    * **General Questions:** For all other questions, provide helpful, clear, and easy-to-understand explanations related to VPN, internet, general tech, or engage in natural conversation, always maintaining your 'Chit Lay' persona.

User's Message: ${message.text}`;
                    
                chatHistory.push({ role: "user", parts: [{ text: aiPersonaPrompt }] });
                const payload = { contents: chatHistory };
                const apiKey = env.GEMINI_API_KEY; 
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    const result = await response.json();

                    if (result.candidates && result.candidates.length > 0 &&
                        result.candidates[0].content && result.candidates[0].content.parts &&
                        result.candidates[0].content.parts.length > 0) {
                        let aiResponseText = result.candidates[0].content.parts[0].text;
                        
                        // Specific fixed overrides (VPN, Admin Contact) should still take priority for their exact keywords.
                        // Flirt and Owner Defense are now handled by AI's contextual reasoning based on the detailed prompt.
                        
                        if (isVpnRelatedMessage(message.text)) { 
                            console.log("[onRequest] Overriding AI response with VPN resource links (general VPN keywords).");
                            const vpnResponseText = "ကိုကို မောင်သုည မအားသေးလို့နော် ရှင့် VPN Key တွေနဲ့ ဖိုင်တွေကို သိချင်တယ်ဆိုရင်တော့ အောက်မှာ ချစ်လေး ပေးထားတဲ့ Channel တွေနဲ့ Group တွေမှာ သွားကြည့်ပြီး ယူလို့ရပါတယ်နော် 🥰\n\n" +
                                                              "ဒီထဲမှာ အကုန် Free တွေချည်းပဲနော် 💖";
                            const inline_keyboard_buttons = VPN_RESOURCES.map(resource => ([{ text: resource.text, url: resource.url }]));
                            const reply_markup = { inline_keyboard: inline_keyboard_buttons };
                            await sendMessage(token, message.chat.id, vpnResponseText, 'HTML', reply_markup);
                            return new Response("OK - VPN resource links sent", { status: 200 });
                        }
                        
                        if (isAdminContactRequest(message.text)) {
                            console.log("[onRequest] Overriding AI response with Admin contact info.");
                            const adminContactResponseText = `ချစ်လေးရဲ့ ကိုကို မောင်သုညကို ဆက်သွယ်ချင်တယ်ဆိုရင်တော့ အောက်မှာ ချစ်လေး ပေးထားတဲ့ 𝗕𝘂𝘁𝘁𝗼𝗺 လေးကို နှိပ်ပြီး ဆက်သွယ်လို့ရပါတယ်နော် 🥰\n\n` +
                                                                     `ကိုကိုက အမြဲကြိုးစားနေတာမို့ စိတ်ရှည်ရှည်လေးနဲ့ စောင့်ပေးပါနော် 💖`;
                            const inline_keyboard_admin_contact = [
                                [{ text: `👨‍💻 ကိုကို မောင်သုည (${ADMIN_CONTACT_INFO.username})`, url: `https://t.me/${ADMIN_CONTACT_INFO.username}` }]
                            ];
                            const reply_markup_admin_contact = { inline_keyboard: inline_keyboard_admin_contact };
                            await sendMessage(token, message.chat.id, adminContactResponseText, 'HTML', reply_markup_admin_contact);
                            return new Response("OK - Admin contact info sent", { status: 200 });
                        }

                        // If none of the specific keyword overrides matched, send the general AI response.
                        await sendMessage(token, message.chat.id, aiStartingPhrase + aiResponseText);
                        console.log("[onRequest] Sent AI general response.");

                    } else {
                        console.error("[onRequest-AI] Unexpected AI response structure (no candidates/content):", JSON.stringify(result, null, 2));
                        const errorMessage = isOwner ?
                            "ကိုကို ချစ်လေး အခု ခဏလေး စဉ်းစားနေလို့ မဖြေနိုင်သေးပါဘူးရှင့်။ ကိုကို့ကို နောက်မှ ပြန်လာခဲ့ပါမယ်နော် 😊" :
                            "ချစ်လေး အခု ခဏလေး စဉ်းစားနေလို့ မဖြေနိုင်သေးပါဘူးရှင့်။ ခဏနေ ပြန်လာခဲ့ပါမယ်နော် 😊";
                        await sendMessage(token, chatId, errorMessage);
                    }
                } catch (aiError) {
                    console.error("[onRequest-AI] Error calling Gemini API:", aiError.message, aiError.stack);
                    const errorMessage = isOwner ?
                        "ကိုကို ချစ်လေး အခု Network ပြဿနာလေး ရှိလို့ မဖြေနိုင်သေးပါဘူးရှင့်။ ကိုကို့ကို နောက်မှ ပြန်လာခဲ့ပါမယ်နော် 😊" :
                        "ချစ်လေး အခု Network ပြဿနာလေး ရှိလို့ ခဏနေ ပြန်လာခဲ့ပါမယ်နော် 😊";
                    await sendMessage(token, chatId, errorMessage);
                }
            }

        } else if (update.callback_query) { 
            console.log("[onRequest] Handling callback_query update. (Only for /summarize buttons)");
            await answerCallbackQuery(token, update.callback_query.id, "လုပ်ဆောင်ပြီးပါပြီရှင့်!");
            return new Response("OK - Callback query handled", { status: 200 });
        } else if (update.my_chat_member) { // This block handles my_chat_member updates (Bot added/removed)
            console.log("[onRequest] Handling my_chat_member update.");
            const myChatMember = update.my_chat_member;
            const chat = myChatMember.chat;
            const newChatMember = myChatMember.new_chat_member;

            // Ensure botIdCache is initialized for this path as well
            if (botIdCache === null) {
                const botInfo = await getMe(token);
                if (botInfo) {
                    botIdCache = botInfo.id;
                    console.log(`[onRequest] Bot ID cached during my_chat_member update: ${botIdCache}`);
                } else {
                    console.error("[onRequest] Failed to get bot ID during my_chat_member update.");
                    // Cannot proceed with bot-specific checks if botId is unknown.
                    // Return OK to avoid Telegram re-sending.
                    return new Response("OK - Bot ID not initialized, cannot process my_chat_member fully", { status: 200 });
                }
            }

            if (newChatMember.status === 'member' && newChatMember.user.is_bot && newChatMember.user.id === botIdCache) {
                if (chat.type === 'group' || chat.type === 'supergroup') {
                    await sendMessage(token, chat.id, `မင်္ဂလာပါရှင့် 👋 ချစ်လေးက ကိုကို မောင်သုည ဖန်တီးထားတဲ့ နတ်သမီးလေးပါ 💖 ဒီ Group မှာ မေးချင်တာရှိရင် ချစ်လေးကို လာမေးလို့ရပါတယ်နော် 😊`);
                }
            } else if (newChatMember.status === 'kicked' || newChatMember.status === 'left') {
                console.log(`[onRequest] Bot was removed from chat: ${chat.title || chat.id}`);
            }
        } else {
            console.log("[onRequest] Unhandled update type. Ignoring:", JSON.stringify(update, null, 2));
        }

        return new Response("OK", { status: 200 });
    } else {
        // This handles GET requests for unhandled paths
        console.log(`[onRequest] Non-POST request received for unhandled path. Method: ${request.method}, Path: ${url.pathname}`);
        return new Response("This is a Telegram bot webhook endpoint. Please send POST requests or access /registerWebhook or /unregisterWebhook or /summary/<id>.", { status: 200 });
    }
}
