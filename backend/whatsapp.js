const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

// Check if all required environment variables are present
const isTwilioConfigured = accountSid && authToken && fromNumber;

let client = null;
if (isTwilioConfigured) {
  try {
    client = twilio(accountSid, authToken);
    console.log("✅ Twilio WhatsApp client configured successfully");
    console.log(`   From: ${fromNumber}`);
  } catch (error) {
    console.error("❌ Failed to initialize Twilio client:", error.message);
    client = null;
  }
} else {
  console.log("⚠️ Twilio not configured. WhatsApp notifications disabled.");
  console.log("   Missing environment variables:");
  if (!accountSid) console.log("   - TWILIO_ACCOUNT_SID");
  if (!authToken) console.log("   - TWILIO_AUTH_TOKEN");
  if (!fromNumber) console.log("   - TWILIO_WHATSAPP_FROM");
}

// Format phone number for WhatsApp
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add + if not present
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  // Add whatsapp: prefix
  return `whatsapp:${cleaned}`;
}

// Send WhatsApp message
async function sendWhatsApp(toNumber, message) {
  // Validate inputs
  if (!toNumber) {
    throw new Error("Phone number is required");
  }
  
  if (!message || message.trim() === '') {
    throw new Error("Message cannot be empty");
  }
  
  if (!isTwilioConfigured || !client) {
    throw new Error("Twilio client not configured. Check your environment variables.");
  }

  try {
    // Format phone numbers
    const formattedTo = formatPhoneNumber(toNumber);
    const formattedFrom = formatPhoneNumber(fromNumber);
    
    if (!formattedTo) {
      throw new Error("Invalid phone number format");
    }

    console.log(`📱 Attempting to send WhatsApp to: ${formattedTo}`);
    console.log(`   Message length: ${message.length} characters`);
    
    // Send message via Twilio
    const response = await client.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: message.substring(0, 1600) // WhatsApp has a 1600 character limit
    });

    console.log(`✅ WhatsApp message sent successfully!`);
    console.log(`   Message SID: ${response.sid}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   To: ${response.to}`);
    
    return {
      success: true,
      sid: response.sid,
      status: response.status,
      to: response.to,
      from: response.from,
      timestamp: new Date().toISOString(),
      messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : '')
    };
    
  } catch (error) {
    console.error("❌ Failed to send WhatsApp message:", error.message);
    
    // Provide user-friendly error messages
    let errorMessage = error.message;
    if (error.code === 21211) {
      errorMessage = "Invalid phone number format. Please use format: +1234567890";
    } else if (error.code === 21608) {
      errorMessage = "Not authorized to send to this number. Check Twilio permissions.";
    } else if (error.code === 21610) {
      errorMessage = "Recipient has not opted in to WhatsApp messages.";
    } else if (error.code === 21612) {
      errorMessage = "Invalid WhatsApp number or not registered on WhatsApp.";
    } else if (error.code === 21614) {
      errorMessage = "Rate limit exceeded. Please wait before sending more messages.";
    }
    
    throw new Error(`WhatsApp send failed: ${errorMessage}`);
  }
}

// Test function to verify WhatsApp setup
async function testWhatsApp(toNumber) {
  console.log("🧪 Testing WhatsApp configuration...");
  
  if (!isTwilioConfigured) {
    return {
      success: false,
      message: "Twilio not configured. Check environment variables.",
      missing: {
        accountSid: !accountSid,
        authToken: !authToken,
        fromNumber: !fromNumber
      }
    };
  }
  
  try {
    const testMessage = `🔔 MERN Scraper WhatsApp Test\n\n✅ Service: Operational\n📅 Time: ${new Date().toLocaleString()}\n🌐 URL: http://localhost:5000\n\nThis is a test notification from your web scraper backend. If you receive this, WhatsApp notifications are working correctly!`;
    
    const result = await sendWhatsApp(toNumber, testMessage);
    
    return {
      success: true,
      message: "Test message sent successfully!",
      ...result
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error.code || "UNKNOWN_ERROR"
    };
  }
}

// Send scrape completion notification
async function sendScrapeNotification(toNumber, scrapeData) {
  try {
    const {
      url,
      id,
      title,
      sections = 0,
      errors = 0,
      scrapeTime = 0,
      timestamp = new Date().toISOString()
    } = scrapeData;

    const emoji = errors > 0 ? "⚠️" : "✅";
    
    const message = `
${emoji} Web Scrape Complete

🔗 URL: ${url}
🆔 ID: ${id}
📄 Title: ${title || 'No title found'}
📊 Sections: ${sections}
❌ Errors: ${errors}
⏱️ Time: ${scrapeTime}
📅 Completed: ${new Date(timestamp).toLocaleTimeString()}

View results: http://localhost:3000
API: http://localhost:5000/api/scrapes/${id}
    `.trim();

    return await sendWhatsApp(toNumber, message);
  } catch (error) {
    console.error("Failed to send scrape notification:", error);
    throw error;
  }
}

// Get configuration (masked for security)
function getWhatsAppConfig() {
  return {
    accountSid: accountSid ? '***' + accountSid.slice(-4) : 'Not set',
    fromNumber,
    configured: isTwilioConfigured
  };
}

module.exports = { 
  sendWhatsApp, 
  testWhatsApp,
  sendScrapeNotification,
  isConfigured: isTwilioConfigured,
  getConfig: getWhatsAppConfig
};