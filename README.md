# 💼 AI-Powered Career Assistant Platform

A full-stack AI-driven career assistant built using **React.js**, **Tailwind CSS**, **Node.js**, and **GPT-4**. Designed to help users optimize their resumes, generate cover letters, analyze job descriptions, and simulate ATS compatibility.

---

## 🧠 Features

### 📄 Resume & Job Description Tools

- 📤 Upload resume (PDF/DOCX) and job descriptions
- 🤖 AI-Powered Resume Analysis with GPT-4
- ✍️ Cover Letter Generation tailored to job descriptions
- 🧮 Job-to-Resume Match Score based on keyword analysis
- ✅ ATS Compatibility Score Simulator

### 📊 Reports & Insights

- 📈 Career insights dashboard using Chart.js
- 📁 Downloadable PDF reports for resume analysis
- 📧 Email notifications with AI feedback

### 🔐 User Management

- 🔐 Secure Authentication (JWT or Firebase optional)
- 🛠 Admin Dashboard for user and activity management

### 🧰 Technology Stack

- **Frontend**: React.js, Tailwind CSS, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **AI Layer**: OpenAI GPT-4 API
- **PDF Reports**: jsPDF or pdf-lib
- **CI/CD**: GitHub Actions

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-career-assistant.git
cd ai-career-assistant
```

### 2. Install Dependencies

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 3. Add Environment Variables

Create `.env` files in both `client/` and `server/` directories:

```
# server/.env
OPENAI_API_KEY=your-openai-key
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-secret
```

### 4. Start Development

```bash
# In separate terminals
cd client && npm start        # Frontend
cd server && npm run dev      # Backend
```

---

## 🗂️ Project Structure

```
ai-career-assistant/
├── client/                 # React frontend
├── server/                 # Express backend
├── shared/                 # Common utilities
├── .github/workflows/      # GitHub Actions
├── README.md
└── .env.example
```

---

## 🧪 Future Features

- 🔍 GitHub repo analysis with GPT insights
- 🧑‍💼 LinkedIn profile analysis
- 📅 Interview prep & calendar integration

---

## 📜 License

MIT © [Mohammed Khan]

---

## 📬 Contact

📧 Email: mzskhan626@gmail.com
🔗 LinkedIn: [linkedin.com/in/your-profile]([https://linkedin.com/in/your-profile](https://www.linkedin.com/in/mohammedzkhan/))
