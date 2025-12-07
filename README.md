# **🔍 Lyftr AI Assignment – Intelligent Web Scraper**

A sophisticated **full-stack intelligent web scraper** featuring hybrid scraping, structured content extraction, dynamic fallback logic, and a React dashboard.  
Built using the **MERN stack (MongoDB, Express, React, Node.js)**.

---

## **✨ Features**

### **🤖 Intelligent Scraping Engine**
- **Static Scraping (Cheerio)** for fast HTML parsing  
- **Dynamic Scraping (Puppeteer)** for JavaScript-rendered content  
- **Automatic Fallback Logic** (static → dynamic if content is insufficient)  
- **Structured Extraction** of:
  - Headings  
  - Paragraphs  
  - Links  
  - Images  
  - Lists  
  - Tables  

### **🎯 Smart Enhancements**
- **Automatic Port Detection** (3000/5000 → next free port)  
- **Noise Filtering** (ads, banners, boilerplate content)  
- **Overlay Removal** (modals, cookie banners)  
- **Auto-Scrolling** for lazy-loaded websites  
- **Click Automation** for “Load More” / “Show More” buttons  

### **📱 Integrations**
- **MongoDB Atlas** for storing scraped results  
- **Twilio WhatsApp API** for sending scraped data  
- **REST API** for external automation  
- **React Dashboard UI** for visualization  

---

## **🚀 Quick Start**

### **Prerequisites**
- **Node.js 16+**  
- **npm**  
- **Git**  
- **MongoDB Atlas account**

---

## **📦 Installation**

```bash
# Clone the repository
git clone https://github.com/VG-1903/Lyftr-AI-Assignment.git
cd Lyftr-AI-Assignment

# Install dependencies automatically
# Windows:
install.bat

# macOS/Linux:
chmod +x install.sh
./install.sh




## **🌐 Access the Application**

Frontend: http://localhost:3000

Backend API: http://localhost:5000

Health Check: http://localhost:5000/healthz

If ports are busy, the launcher scripts automatically pick available ports in the ranges:

Frontend: 3000–3010

Backend: 5000–5010

---

## **🏗️ Architecture**
React Frontend ─────────▶ Express Backend ─────────▶ Scraper Engine ─────────▶ Target Website
        ▲                          │
        │                          ▼
        └──────────────────── MongoDB Atlas

---

## **🔄 Scraping Strategy**
Start Scrape
   │
   ▼
Static Scrape (Cheerio)
   │
   ├── If extracted content > 300 chars → Return result
   │
   ▼
Fallback to Puppeteer
   │
Dynamic Scraping (JS Execution + Interactions)
   ▼
Return Final Results

---

## **🧩 Project Structure**
Lyftr-AI-Assignment/
├── backend/
│   ├── server.js
│   ├── scraper.js
│   ├── models/
│   ├── routes/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
├── run.bat
├── run.sh
├── install.bat
├── install.sh
├── design_notes.md
├── setup-guide.md
├── requirements.txt
├── README-PORTS.md
└── README.md



## **🧪 Testing**
### **Backend tests**
cd backend
npm test

### **Frontend tests**
cd frontend
npm test

### **Test scraping**
curl -X POST http://localhost:5000/api/scrape -d '{"url": "https://example.com"}'

---

## **🚢 Deployment (Optional)**
Deploy to Vercel
### Backend
cd backend
vercel --prod

### Frontend
cd frontend
vercel --prod

---

## **Environment Variables**
### **Backend**
MONGO_URI=your_mongodb_uri
NODE_ENV=production
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token

### **Frontend**
REACT_APP_API_URL=https://your-backend.vercel.app

##**🐞 Troubleshooting**
Issue	Solution
Ports busy	Use kill-ports.bat or kill-ports.sh
MongoDB fails	Check .env + IP whitelist
Puppeteer errors	Install missing OS dependencies
React not loading	Ensure backend is running

.---

###**❤️ Built by Vansh Gaba**

