const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const OpenAI = require('openai');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/career_assistant');

// Schemas
const userSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  name: String,
  email: { type: String, unique: true },
  password: String,
  profile: {
    skills: [String],
    preferredJobTitles: [String],
    location: String,
    experience: String
  },
  createdAt: { type: Date, default: Date.now }
});

const resumeSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  userId: String,
  fileName: String,
  originalText: String,
  parsedData: {
    name: String,
    email: String,
    phone: String,
    skills: [String],
    experience: [Object],
    education: [Object],
    summary: String
  },
  analysis: {
    overallScore: Number,
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    atsScore: Number,
    keywordDensity: Object
  },
  uploadedAt: { type: Date, default: Date.now }
});

const jobMatchSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  resumeId: String,
  jobDescription: String,
  matchScore: Number,
  matchDetails: {
    skillsMatch: Number,
    experienceMatch: Number,
    educationMatch: Number,
    keywordsMatch: [String],
    missingKeywords: [String]
  },
  coverLetter: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Resume = mongoose.model('Resume', resumeSchema);
const JobMatch = mongoose.model('JobMatch', jobMatchSchema);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'), false);
    }
  }
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Utility Functions
async function parseResumeFile(buffer, mimetype) {
  let text = '';
  
  try {
    if (mimetype === 'application/pdf') {
      const data = await pdf(buffer);
      text = data.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }
    
    return text;
  } catch (error) {
    console.error('Error parsing file:', error);
    throw new Error('Failed to parse resume file');
  }
}

async function analyzeResumeWithAI(resumeText) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert HR professional and resume analyzer. Analyze the provided resume and return a JSON response with the following structure:
          {
            "parsedData": {
              "name": "Full Name",
              "email": "email@example.com",
              "phone": "phone number",
              "skills": ["skill1", "skill2"],
              "experience": [{"company": "Company", "position": "Role", "duration": "Period", "description": "Details"}],
              "education": [{"institution": "School", "degree": "Degree", "year": "Year"}],
              "summary": "Professional summary"
            },
            "analysis": {
              "overallScore": 85,
              "strengths": ["strength1", "strength2"],
              "weaknesses": ["weakness1", "weakness2"],
              "suggestions": ["suggestion1", "suggestion2"],
              "atsScore": 78,
              "keywordDensity": {"skill1": 5, "skill2": 3}
            }
          }`
        },
        {
          role: "user",
          content: `Please analyze this resume:\n\n${resumeText}`
        }
      ],
      temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing resume with AI:', error);
    throw new Error('Failed to analyze resume');
  }
}

async function generateCoverLetter(resumeData, jobDescription) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional career counselor. Generate a personalized cover letter based on the resume data and job description provided. Make it compelling, professional, and tailored to the specific role."
        },
        {
          role: "user",
          content: `Resume Summary: ${JSON.stringify(resumeData.parsedData)}\n\nJob Description: ${jobDescription}\n\nPlease generate a professional cover letter.`
        }
      ],
      temperature: 0.7
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw new Error('Failed to generate cover letter');
  }
}

function calculateJobMatch(resumeData, jobDescription) {
  const resumeText = JSON.stringify(resumeData.parsedData).toLowerCase();
  const jobText = jobDescription.toLowerCase();
  
  // Extract keywords from job description
  const jobKeywords = jobText.match(/\b\w{3,}\b/g) || [];
  const uniqueJobKeywords = [...new Set(jobKeywords)];
  
  // Calculate matches
  const matchedKeywords = uniqueJobKeywords.filter(keyword => 
    resumeText.includes(keyword.toLowerCase())
  );
  
  const missingKeywords = uniqueJobKeywords.filter(keyword => 
    !resumeText.includes(keyword.toLowerCase())
  ).slice(0, 10); // Top 10 missing keywords
  
  const matchScore = Math.round((matchedKeywords.length / uniqueJobKeywords.length) * 100);
  
  return {
    matchScore,
    matchDetails: {
      skillsMatch: Math.min(matchScore + 10, 100),
      experienceMatch: Math.min(matchScore + 5, 100),
      educationMatch: Math.min(matchScore, 100),
      keywordsMatch: matchedKeywords.slice(0, 20),
      missingKeywords: missingKeywords
    }
  };
}

// API Routes

// Health Check
app.get('/api/', (req, res) => {
  res.json({ message: 'Career Assistant API is running' });
});

// User Authentication
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resume Upload and Analysis
app.post('/api/resume/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { userId } = req.body;
    const resumeText = await parseResumeFile(req.file.buffer, req.file.mimetype);
    const aiAnalysis = await analyzeResumeWithAI(resumeText);
    
    const resume = new Resume({
      userId: userId || 'anonymous',
      fileName: req.file.originalname,
      originalText: resumeText,
      parsedData: aiAnalysis.parsedData,
      analysis: aiAnalysis.analysis
    });
    
    await resume.save();
    
    res.json({
      resumeId: resume.id,
      fileName: resume.fileName,
      parsedData: resume.parsedData,
      analysis: resume.analysis
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze resume text directly
app.post('/api/resume/analyze-text', async (req, res) => {
  try {
    const { resumeText, userId } = req.body;
    
    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text is required' });
    }
    
    const aiAnalysis = await analyzeResumeWithAI(resumeText);
    
    const resume = new Resume({
      userId: userId || 'anonymous',
      fileName: 'text-input.txt',
      originalText: resumeText,
      parsedData: aiAnalysis.parsedData,
      analysis: aiAnalysis.analysis
    });
    
    await resume.save();
    
    res.json({
      resumeId: resume.id,
      fileName: resume.fileName,
      parsedData: resume.parsedData,
      analysis: resume.analysis
    });
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Job Matching
app.post('/api/job/match', async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;
    
    const resume = await Resume.findOne({ id: resumeId });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    const matchResult = calculateJobMatch(resume, jobDescription);
    const coverLetter = await generateCoverLetter(resume, jobDescription);
    
    const jobMatch = new JobMatch({
      resumeId,
      jobDescription,
      matchScore: matchResult.matchScore,
      matchDetails: matchResult.matchDetails,
      coverLetter
    });
    
    await jobMatch.save();
    
    res.json({
      matchId: jobMatch.id,
      matchScore: jobMatch.matchScore,
      matchDetails: jobMatch.matchDetails,
      coverLetter: jobMatch.coverLetter
    });
  } catch (error) {
    console.error('Job matching error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user resumes
app.get('/api/resumes/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const resumes = await Resume.find({ userId }).sort({ uploadedAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job matches for a resume
app.get('/api/matches/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    const matches = await JobMatch.find({ resumeId }).sort({ createdAt: -1 });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalResumes = await Resume.countDocuments();
    const totalMatches = await JobMatch.countDocuments();
    
    const recentResumes = await Resume.find()
      .sort({ uploadedAt: -1 })
      .limit(10)
      .select('fileName parsedData.name analysis.overallScore uploadedAt');
    
    res.json({
      stats: {
        totalUsers,
        totalResumes,
        totalMatches,
        avgResumeScore: await Resume.aggregate([
          { $group: { _id: null, avgScore: { $avg: '$analysis.overallScore' } } }
        ]).then(result => result[0]?.avgScore || 0)
      },
      recentActivity: recentResumes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate PDF Report
app.post('/api/report/generate', async (req, res) => {
  try {
    const { resumeId, matchId } = req.body;
    
    const resume = await Resume.findOne({ id: resumeId });
    const match = matchId ? await JobMatch.findOne({ id: matchId }) : null;
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    const doc = new PDFDocument();
    let pdfBuffer = [];
    
    doc.on('data', chunk => pdfBuffer.push(chunk));
    doc.on('end', () => {
      const pdfData = Buffer.concat(pdfBuffer);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="career-report.pdf"');
      res.send(pdfData);
    });
    
    // Generate PDF content
    doc.fontSize(20).text('Career Analysis Report', 50, 50);
    doc.fontSize(14).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
    
    doc.fontSize(16).text('Resume Analysis', 50, 120);
    doc.fontSize(12).text(`Overall Score: ${resume.analysis.overallScore}/100`, 50, 150);
    doc.text(`ATS Score: ${resume.analysis.atsScore}/100`, 50, 170);
    
    doc.text('Strengths:', 50, 200);
    resume.analysis.strengths.forEach((strength, index) => {
      doc.text(`• ${strength}`, 70, 220 + (index * 20));
    });
    
    const weaknessY = 220 + (resume.analysis.strengths.length * 20) + 20;
    doc.text('Areas for Improvement:', 50, weaknessY);
    resume.analysis.weaknesses.forEach((weakness, index) => {
      doc.text(`• ${weakness}`, 70, weaknessY + 20 + (index * 20));
    });
    
    if (match) {
      const matchY = weaknessY + (resume.analysis.weaknesses.length * 20) + 60;
      doc.text('Job Match Analysis', 50, matchY);
      doc.text(`Match Score: ${match.matchScore}%`, 50, matchY + 30);
      doc.text(`Skills Match: ${match.matchDetails.skillsMatch}%`, 50, matchY + 50);
    }
    
    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Career Assistant API server running on port ${PORT}`);
});