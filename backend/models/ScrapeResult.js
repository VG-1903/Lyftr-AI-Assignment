const mongoose = require("mongoose");

const ScrapeResultSchema = new mongoose.Schema({
  url: { 
    type: String, 
    required: true,
    index: true 
  },
  scrapedAt: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  meta: {
    title: String,
    description: String,
    language: String,
    canonical: String,
    keywords: String,
    author: String
  },
  sections: [{
    id: String,
    type: String,
    label: String,
    sourceUrl: String,
    content: {
      headings: [String],
      text: String,
      links: [{
        text: String,
        href: String,
        title: String
      }],
      images: [{
        src: String,
        alt: String,
        title: String,
        width: String,
        height: String
      }],
      lists: [{
        type: String,
        items: [String]
      }],
      tables: [{
        headers: [String],
        rows: [[String]],
        caption: String
      }]
    },
    rawHtml: String,
    truncated: Boolean,
    elementCount: {
      paragraphs: Number,
      headings: Number,
      links: Number,
      images: Number
    }
  }],
  interactions: {
    clicks: [String],
    scrolls: { type: Number, default: 0 },
    pages: [String]
  },
  errors: [{
    message: String,
    phase: String,
    code: String,
    status: Number,
    stack: String
  }],
  raw: { type: mongoose.Schema.Types.Mixed }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for section count
ScrapeResultSchema.virtual('sectionCount').get(function() {
  return this.sections ? this.sections.length : 0;
});

// Virtual for hasErrors
ScrapeResultSchema.virtual('hasErrors').get(function() {
  return this.errors && this.errors.length > 0;
});

// Indexes for better query performance
ScrapeResultSchema.index({ createdAt: -1 });
ScrapeResultSchema.index({ 'meta.title': 'text', 'meta.description': 'text' });

module.exports = mongoose.model("ScrapeResult", ScrapeResultSchema);