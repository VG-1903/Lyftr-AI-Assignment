const axios = require("axios");
const cheerio = require("cheerio");
const crypto = require("crypto");
const puppeteer = require("puppeteer");

const STATIC_TEXT_THRESHOLD = 300;
const RAW_HTML_TRUNCATE = 10000; // Increased for better data preservation
const AXIOS_TIMEOUT = 30000; // Increased timeout

function makeId(seed) {
  return "sec-" + crypto.createHash("sha1").update(seed).digest("hex").slice(0, 8);
}

function absoluteUrl(base, href) {
  try {
    if (!href || href.startsWith('#')) return null;
    if (href.startsWith('http://') || href.startsWith('https://')) return href;
    
    const baseUrl = new URL(base);
    const resolved = new URL(href, baseUrl);
    return resolved.toString();
  } catch (e) {
    console.warn(`Failed to resolve URL: ${href}`, e.message);
    return null;
  }
}

function extractMeta($, baseUrl) {
  try {
    const title = ($("meta[property='og:title']").attr("content") || 
                  $("title").text() || 
                  $("h1").first().text() || "").trim().slice(0, 200);
    
    const description = ($("meta[name='description']").attr("content") ||
                       $("meta[property='og:description']").attr("content") || 
                       $("meta[name='twitter:description']").attr("content") || "").trim().slice(0, 500);
    
    const lang = $("html").attr("lang") || 
                $("meta[http-equiv='content-language']").attr("content") || 
                "";
    
    const canonical = absoluteUrl(baseUrl, $("link[rel='canonical']").attr("href") || baseUrl);
    
    const keywords = ($("meta[name='keywords']").attr("content") || "").trim();
    
    const author = ($("meta[name='author']").attr("content") || "").trim();
    
    return { 
      title, 
      description, 
      language: lang, 
      canonical,
      keywords,
      author
    };
  } catch (error) {
    console.warn("Error extracting meta:", error.message);
    return { title: "", description: "", language: "", canonical: null, keywords: "", author: "" };
  }
}

function sectionTypeFromLabel(label, elementTag) {
  if (!label) return "unknown";
  
  const ll = label.toLowerCase();
  const tag = elementTag.toLowerCase();
  
  // Check element tag first
  if (tag === 'header') return 'hero';
  if (tag === 'nav') return 'nav';
  if (tag === 'footer') return 'footer';
  if (tag === 'aside') return 'sidebar';
  if (tag === 'main') return 'main';
  if (tag === 'article') return 'article';
  if (tag === 'section') return 'section';
  
  // Check label content
  if (ll.includes("hero") || ll.includes("welcome") || ll.includes("get started")) return "hero";
  if (ll.includes("footer")) return "footer";
  if (ll.includes("nav") || ll.includes("menu")) return "nav";
  if (ll.includes("pricing") || ll.includes("price") || ll.includes("cost")) return "pricing";
  if (ll.includes("faq") || ll.includes("frequently")) return "faq";
  if (ll.includes("feature") || ll.includes("benefit")) return "features";
  if (ll.includes("testimonial") || ll.includes("review")) return "testimonials";
  if (ll.includes("contact") || ll.includes("subscribe")) return "contact";
  if (ll.includes("about") || ll.includes("story")) return "about";
  if (ll.includes("blog") || ll.includes("post")) return "blog";
  if (ll.includes("product") || ll.includes("service")) return "products";
  if (ll.includes("team") || ll.includes("member")) return "team";
  
  return "section";
}

function extractFromNode(node, baseUrl, depth = 0) {
  try {
    const $ = cheerio.load(node, null, false);
    const element = $(node);
    
    // Extract text content
    const textParts = [];
    element.find("p, h1, h2, h3, h4, h5, h6, li, td, th, span, div").each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 10) { // Filter out very short text
        textParts.push(text);
      }
    });
    
    const text = textParts.join("\n\n").trim().slice(0, 5000); // Limit text length
    
    // Extract headings
    const headings = [];
    element.find("h1, h2, h3").each((i, el) => {
      const headingText = $(el).text().trim();
      if (headingText && !headings.includes(headingText)) {
        headings.push(headingText);
      }
    });
    
    // Extract links
    const links = [];
    element.find("a[href]").each((i, el) => {
      const href = $(el).attr("href");
      const linkText = $(el).text().trim();
      const absoluteHref = absoluteUrl(baseUrl, href);
      
      if (absoluteHref && absoluteHref !== baseUrl) {
        links.push({
          text: linkText || absoluteHref,
          href: absoluteHref,
          title: $(el).attr("title") || ""
        });
      }
    });
    
    // Extract images
    const images = [];
    element.find("img[src]").each((i, el) => {
      const src = $(el).attr("src");
      const alt = $(el).attr("alt") || "";
      const title = $(el).attr("title") || "";
      const absoluteSrc = absoluteUrl(baseUrl, src);
      
      if (absoluteSrc && !absoluteSrc.endsWith('.svg')) { // Skip SVGs for now
        images.push({
          src: absoluteSrc,
          alt: alt,
          title: title,
          width: $(el).attr("width"),
          height: $(el).attr("height")
        });
      }
    });
    
    // Extract lists
    const lists = [];
    element.find("ul, ol").each((i, listEl) => {
      const items = [];
      $(listEl).find("li").each((j, li) => {
        const itemText = $(li).text().trim();
        if (itemText) items.push(itemText);
      });
      if (items.length > 0) {
        lists.push({
          type: $(listEl).prop("tagName").toLowerCase() === 'ol' ? 'ordered' : 'unordered',
          items: items
        });
      }
    });
    
    // Extract tables
    const tables = [];
    element.find("table").each((i, tbl) => {
      const rows = [];
      $(tbl).find("tr").each((r, tr) => {
        const cells = [];
        $(tr).find("th, td").each((c, cell) => {
          cells.push($(cell).text().trim());
        });
        if (cells.length > 0) {
          rows.push(cells);
        }
      });
      if (rows.length > 0) {
        tables.push({
          headers: rows[0] || [],
          rows: rows.slice(1),
          caption: $(tbl).find("caption").text().trim() || ""
        });
      }
    });
    
    // Generate label
    let label = headings[0] || 
               element.attr('aria-label') || 
               element.attr('title') || 
               text.split(/\s+/).slice(0, 7).join(" ") || 
               "Section";
    
    if (label.length > 100) label = label.slice(0, 100) + "...";
    
    // Get element tag for type detection
    const elementTag = element.prop("tagName") || "";
    
    const rawHtml = element.html() ? element.html().slice(0, RAW_HTML_TRUNCATE) : "";
    
    return {
      id: makeId(label + baseUrl + depth),
      type: sectionTypeFromLabel(label, elementTag),
      label,
      sourceUrl: baseUrl,
      content: {
        headings,
        text,
        links: links.slice(0, 20), // Limit links
        images: images.slice(0, 10), // Limit images
        lists: lists.slice(0, 5), // Limit lists
        tables: tables.slice(0, 3) // Limit tables
      },
      rawHtml,
      truncated: rawHtml.length >= RAW_HTML_TRUNCATE,
      elementCount: {
        paragraphs: element.find("p").length,
        headings: element.find("h1, h2, h3, h4, h5, h6").length,
        links: element.find("a").length,
        images: element.find("img").length
      }
    };
  } catch (error) {
    console.warn("Error extracting from node:", error.message);
    return null;
  }
}

function extractSectionsFromDom(html, baseUrl) {
  try {
    const $ = cheerio.load(html);
    let sections = [];
    
    // First, try semantic landmarks
    const landmarks = [
      ...$("header").toArray(),
      ...$("nav").toArray(),
      ...$("main").toArray(),
      ...$("section").toArray(),
      ...$("article").toArray(),
      ...$("aside").toArray(),
      ...$("footer").toArray()
    ];
    
    // If no landmarks, use major containers
    let candidates = landmarks;
    if (candidates.length === 0) {
      candidates = $("body > div, body > section, body > article").slice(0, 15).toArray();
    }
    
    // Extract sections from candidates
    candidates.forEach((node, index) => {
      const section = extractFromNode(node, baseUrl, index);
      if (section && (
          section.content.text.length > 50 ||
          section.content.links.length > 0 ||
          section.content.images.length > 0 ||
          section.content.headings.length > 0
      )) {
        sections.push(section);
      }
    });
    
    // If still no sections, use the entire body
    if (sections.length === 0) {
      const bodySection = extractFromNode($("body").first(), baseUrl, 0);
      if (bodySection) sections.push(bodySection);
    }
    
    // Deduplicate sections with similar content
    const uniqueSections = [];
    const seenTexts = new Set();
    
    sections.forEach(section => {
      const textHash = crypto.createHash('md5').update(section.content.text).digest('hex');
      if (!seenTexts.has(textHash) && section.content.text.length > 20) {
        seenTexts.add(textHash);
        uniqueSections.push(section);
      }
    });
    
    return uniqueSections;
  } catch (error) {
    console.error("Error extracting sections:", error);
    return [];
  }
}

async function staticScrape(url) {
  const result = {
    url,
    scrapedAt: new Date().toISOString(),
    meta: { title: "", description: "", language: "", canonical: null, keywords: "", author: "" },
    sections: [],
    interactions: { clicks: [], scrolls: 0, pages: [url] },
    errors: []
  };
  
  try {
    const resp = await axios.get(url, { 
      timeout: AXIOS_TIMEOUT, 
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
      },
      maxRedirects: 5
    });
    
    const html = resp.data;
    const sections = extractSectionsFromDom(html, url);
    const $ = cheerio.load(html);
    
    result.meta = extractMeta($, url);
    result.sections = sections;
    
    const totalTextLen = sections.reduce((sum, sec) => sum + (sec.content.text || "").length, 0);
    
    if (totalTextLen < STATIC_TEXT_THRESHOLD) {
      result.errors.push({
        message: `Low text content (${totalTextLen} chars), consider JavaScript fallback`,
        phase: "static_scrape"
      });
    }
    
    return result;
  } catch (err) {
    console.error("Static scrape error:", err.message);
    
    result.errors.push({
      message: err.message,
      phase: "fetch",
      code: err.code,
      status: err.response?.status
    });
    
    return result;
  }
}

async function puppeteerScrape(url, maxScrolls = 3) {
  const result = {
    url,
    scrapedAt: new Date().toISOString(),
    meta: { title: "", description: "", language: "", canonical: null, keywords: "", author: "" },
    sections: [],
    interactions: { clicks: [], scrolls: 0, pages: [] },
    errors: []
  };
  
  let browser;
  
  try {
    browser = await puppeteer.launch({ 
      headless: "new", 
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080"
      ] 
    });
    
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    
    // Enable request interception to block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    // Navigate to page
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });
    
    result.interactions.pages.push(page.url());
    
    // Extract initial content
    let html = await page.content();
    let $ = cheerio.load(html);
    result.meta = extractMeta($, url);
    
    // Try to dismiss overlays
    const overlaySelectors = [
      '[aria-label="Close"]', 
      '.close', 
      '.modal-close', 
      '[data-dismiss="modal"]',
      '.cookie-banner',
      '#cookie-banner',
      '.newsletter-popup',
      '.overlay'
    ];
    
    for (const selector of overlaySelectors) {
      try {
        await page.click(selector).catch(() => {});
        await page.waitForTimeout(500);
        result.interactions.clicks.push(`dismiss:${selector}`);
      } catch (e) {}
    }
    
    // Try to click "Load more" or similar buttons
    const loadMoreTexts = ["Load more", "Show more", "See more", "View more", "Load More", "Show More"];
    for (const text of loadMoreTexts) {
      try {
        const [button] = await page.$x(`//button[contains(., '${text}')]`);
        if (button) {
          await button.click();
          await page.waitForTimeout(2000);
          result.interactions.clicks.push(`load_more:${text}`);
        }
      } catch (e) {}
    }
    
    // Scroll to load dynamic content
    for (let i = 0; i < maxScrolls; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await page.waitForTimeout(1000);
      result.interactions.scrolls++;
    }
    
    // Get final HTML
    html = await page.content();
    const sections = extractSectionsFromDom(html, url);
    result.sections = sections;
    
    return result;
    
  } catch (err) {
    console.error("Puppeteer scrape error:", err);
    
    result.errors.push({
      message: err.message,
      phase: "render",
      stack: err.stack
    });
    
    return result;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

async function scrapeUrl(url) {
  console.log(`🔍 Starting scrape of: ${url}`);
  
  // First attempt: static scrape
  const staticResult = await staticScrape(url);
  
  // Check if static scrape got enough content
  const totalText = staticResult.sections.reduce((sum, sec) => sum + (sec.content?.text?.length || 0), 0);
  const hasContent = staticResult.sections.length > 0 && totalText > STATIC_TEXT_THRESHOLD;
  
  if (hasContent && staticResult.errors.length === 0) {
    console.log(`✅ Static scrape successful (${staticResult.sections.length} sections, ${totalText} chars)`);
    return staticResult;
  }
  
  // Fallback to puppeteer if static failed or insufficient content
  console.log(`🔄 Static scrape insufficient, falling back to Puppeteer...`);
  
  try {
    const jsResult = await puppeteerScrape(url, 3);
    
    if (jsResult.sections.length > 0) {
      console.log(`✅ Puppeteer scrape successful (${jsResult.sections.length} sections)`);
      return jsResult;
    } else {
      console.log(`⚠️ Puppeteer returned no sections, using static result`);
      staticResult.errors.push({
        message: "Puppeteer fallback returned no sections",
        phase: "fallback"
      });
      return staticResult;
    }
  } catch (fallbackError) {
    console.error(`❌ Puppeteer fallback failed:`, fallbackError);
    
    staticResult.errors.push({
      message: `Puppeteer fallback failed: ${fallbackError.message}`,
      phase: "fallback_error"
    });
    
    return staticResult;
  }
}

module.exports = { scrapeUrl };