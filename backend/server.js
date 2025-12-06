require('dotenv').config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const connectDB = require("./db");
const { connectDB } = require("./db");
const ScrapeResult = require("./models/ScrapeResult");
const { scrapeUrl } = require("./scraper");
const { 
  sendWhatsApp, 
  testWhatsApp, 
  sendScrapeNotification, 
  isConfigured: isWhatsAppConfigured, 
  getConfig: getWhatsAppConfig 
} = require("./whatsapp");

const PORT = process.env.PORT || 5000;

const app = express();

// 1. CORS Configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Security headers (Helmet disabled for development)
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
} else {
  // Basic security headers for development
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

// 3. Body parser
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 4. Connect to MongoDB Atlas
connectDB().then(() => {
  console.log("📦 Database initialization complete");
}).catch(err => {
  console.error("❌ Failed to connect to DB:", err.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Health check endpoint with DB status
app.get("/healthz", async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const status = dbStatus === 1 ? "healthy" : "degraded";
  
  res.json({ 
    status,
    service: "mern-scraper-api",
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus === 1,
      state: dbStatus,
      host: mongoose.connection.host || "unknown"
    },
    whatsapp: {
      configured: isWhatsAppConfigured
    }
  });
});

// API Info endpoint
app.get("/api", (req, res) => {
  res.json({
    service: "MERN Scraper API",
    version: "1.0.0",
    endpoints: {
      health: "GET /healthz",
      whatsappConfig: "GET /api/whatsapp/config",
      whatsappTest: "POST /api/whatsapp/test",
      scrape: "POST /api/scrape",
      listScrapes: "GET /api/scrapes",
      getScrape: "GET /api/scrapes/:id",
      deleteScrape: "DELETE /api/scrapes/:id"
    },
    documentation: "https://github.com/your-repo/docs"
  });
});

// WhatsApp configuration endpoint
app.get("/api/whatsapp/config", (req, res) => {
  res.json({
    success: true,
    configured: isWhatsAppConfigured,
    config: getWhatsAppConfig(),
    timestamp: new Date().toISOString()
  });
});

// WhatsApp test endpoint
app.post("/api/whatsapp/test", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Phone number is required in the request body"
      });
    }
    
    const result = await testWhatsApp(phoneNumber);
    
    if (result.success) {
      res.json({
        success: true,
        message: "WhatsApp test completed successfully",
        ...result
      });
    } else {
      res.status(400).json({
        success: false,
        error: "WhatsApp Test Failed",
        ...result
      });
    }
    
  } catch (error) {
    console.error("WhatsApp test error:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message
    });
  }
});

// Handle preflight requests
app.options('*', cors());

// POST /api/scrape - Trigger a scrape
app.post("/api/scrape", async (req, res) => {
  try {
    const { url } = req.body;
    
    // Input validation
    if (!url || typeof url !== "string") {
      return res.status(400).json({ 
        success: false,
        error: "Bad Request",
        message: "Provide a valid 'url' in the request body"
      });
    }
    
    const trimmedUrl = url.trim();
    
    if (!/^(https?:)\/\//i.test(trimmedUrl)) {
      return res.status(400).json({ 
        success: false,
        error: "Bad Request", 
        message: "Only http(s) URLs are supported"
      });
    }

    console.log(`🔍 Starting scrape: ${trimmedUrl}`);
    const startTime = Date.now();
    
    // Scrape the URL
    const result = await scrapeUrl(trimmedUrl);
    const scrapeTime = Date.now() - startTime;
    
    console.log(`✅ Scrape completed in ${scrapeTime}ms`);
    console.log(`   Sections: ${result.sections?.length || 0}`);
    console.log(`   Errors: ${result.errors?.length || 0}`);

    // Save to database
    let savedDoc = null;
    try {
      const doc = new ScrapeResult({
        url: trimmedUrl,
        scrapedAt: new Date(result.scrapedAt),
        meta: result.meta || {},
        sections: result.sections || [],
        interactions: result.interactions || { clicks: [], scrolls: 0, pages: [] },
        errors: result.errors || [],
        raw: result
      });
      
      savedDoc = await doc.save();
      console.log(`💾 Saved to database with ID: ${savedDoc._id}`);
      
    } catch (dbError) {
      console.error("❌ Failed to save to database:", dbError.message);
      // Continue even if DB save fails
    }

    // WhatsApp Notification - ENHANCED
    if (isWhatsAppConfigured && savedDoc) {
      try {
        const notifyTo = process.env.NOTIFY_WHATSAPP_TO;
        if (notifyTo) {
          console.log(`📱 Sending WhatsApp notification to: ${notifyTo}`);
          
          const notificationData = {
            url: trimmedUrl,
            id: savedDoc._id?.toString(),
            title: result.meta?.title?.substring(0, 100) || 'No title',
            sections: result.sections?.length || 0,
            errors: result.errors?.length || 0,
            scrapeTime: `${scrapeTime}ms`,
            timestamp: new Date().toISOString()
          };
          
          // Send notification
          const whatsappResult = await sendScrapeNotification(notifyTo, notificationData);
          
          console.log(`✅ WhatsApp notification sent: ${whatsappResult.sid}`);
        } else {
          console.log("⚠️ NOTIFY_WHATSAPP_TO not set in environment variables");
        }
      } catch (whatsappError) {
        console.warn("⚠️ WhatsApp notification failed:", whatsappError.message);
        // Don't fail the whole scrape if WhatsApp fails
      }
    } else {
      console.log("ℹ️ WhatsApp notifications disabled (not configured or save failed)");
    }

    // Return success response
    res.json({
      success: true,
      message: "Scrape completed successfully",
      id: savedDoc?._id || null,
      scrapeTime: `${scrapeTime}ms`,
      whatsapp: {
        sent: isWhatsAppConfigured && !!process.env.NOTIFY_WHATSAPP_TO && !!savedDoc,
        configured: isWhatsAppConfigured
      },
      stats: {
        sections: result.sections?.length || 0,
        images: result.sections?.reduce((sum, sec) => sum + (sec.content?.images?.length || 0), 0) || 0,
        links: result.sections?.reduce((sum, sec) => sum + (sec.content?.links?.length || 0), 0) || 0,
        errors: result.errors?.length || 0
      },
      result: {
        url: result.url,
        scrapedAt: result.scrapedAt,
        meta: result.meta,
        sections: result.sections,
        interactions: result.interactions,
        errors: result.errors
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Scrape error:", err);
    
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: err.message || "An unexpected error occurred during scraping",
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/scrapes - List saved scrapes with pagination
app.get("/api/scrapes", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Optional search by URL or title
    if (req.query.search) {
      query.$or = [
        { url: { $regex: req.query.search, $options: 'i' } },
        { 'meta.title': { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await ScrapeResult.countDocuments(query);
    
    // Get documents
    const docs = await ScrapeResult.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .select('-raw -sections.content -sections.rawHtml'); // Exclude large fields for list view

    res.json({
      success: true,
      items: docs.map(doc => ({
        _id: doc._id,
        url: doc.url,
        scrapedAt: doc.scrapedAt,
        meta: doc.meta,
        sectionCount: doc.sections?.length || 0,
        hasErrors: doc.errors?.length > 0,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error("❌ Error fetching scrapes:", err);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to fetch saved scrapes",
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/scrapes/:id - Fetch single scrape by ID
app.get("/api/scrapes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Invalid ID format. Must be a 24-character hexadecimal string."
      });
    }

    const doc = await ScrapeResult.findById(id).lean();
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Scrape result not found"
      });
    }

    res.json({
      success: true,
      ...doc,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error("❌ Error fetching scrape:", err);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to fetch scrape",
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE /api/scrapes/:id - Delete a scrape
app.delete("/api/scrapes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Invalid ID format"
      });
    }

    const doc = await ScrapeResult.findByIdAndDelete(id);
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Scrape result not found"
      });
    }

    res.json({
      success: true,
      message: "Scrape deleted successfully",
      id: id,
      deletedAt: new Date().toISOString(),
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error("❌ Error deleting scrape:", err);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to delete scrape",
      timestamp: new Date().toISOString()
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'development' ? err.message : "An unexpected error occurred",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Cannot ${req.method} ${req.url}`,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 MERN Scraper Backend
────────────────────────────
📡 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🗄️  Database: MongoDB Atlas
📱 WhatsApp: ${isWhatsAppConfigured ? "✅ Configured" : "⚠️ Not configured"}
⏰ Started: ${new Date().toLocaleString()}
────────────────────────────
📊 Health: http://localhost:${PORT}/healthz
🔧 API Base: http://localhost:${PORT}/api
📱 WhatsApp Test: POST http://localhost:${PORT}/api/whatsapp/test
────────────────────────────
  `);
});