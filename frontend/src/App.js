import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [notification, setNotification] = useState(null);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // API calls
  const uploadResume = async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('userId', user?.id || 'anonymous');

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/resume/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newResume = response.data;
      setResumes(prev => [newResume, ...prev]);
      setSelectedResume(newResume);
      showNotification('Resume uploaded and analyzed successfully!');
      setActiveTab('analysis');
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('Failed to upload resume', 'error');
    } finally {
      setLoading(false);
    }
  };

  const analyzeResumeText = async (text) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/resume/analyze-text`, {
        resumeText: text,
        userId: user?.id || 'anonymous'
      });
      
      const newResume = response.data;
      setResumes(prev => [newResume, ...prev]);
      setSelectedResume(newResume);
      showNotification('Resume analyzed successfully!');
      setActiveTab('analysis');
    } catch (error) {
      console.error('Analysis error:', error);
      showNotification('Failed to analyze resume', 'error');
    } finally {
      setLoading(false);
    }
  };

  const matchJob = async () => {
    if (!selectedResume || !jobDescription.trim()) {
      showNotification('Please select a resume and enter a job description', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/job/match`, {
        resumeId: selectedResume.resumeId,
        jobDescription: jobDescription
      });
      
      setMatchResult(response.data);
      showNotification('Job match analysis completed!');
      setActiveTab('match');
    } catch (error) {
      console.error('Job match error:', error);
      showNotification('Failed to analyze job match', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/stats`);
      setAdminStats(response.data);
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    }
  };

  // Components
  const Notification = () => {
    if (!notification) return null;
    
    return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
        notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
      } text-white transform transition-all duration-500 ease-in-out`}>
        <div className="flex items-center justify-between">
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            className="ml-4 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center space-x-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span>Processing...</span>
    </div>
  );

  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Optimize Your Career with 
            <span className="text-blue-600 dark:text-blue-400"> AI-Powered</span> Insights
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Upload your resume, analyze job matches, generate compelling cover letters, and get ATS-optimized recommendations powered by GPT-4.
          </p>
          <button 
            onClick={() => setActiveTab('upload')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Get Started Free
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">AI Resume Analysis</h3>
            <p className="text-gray-600 dark:text-gray-300">Get detailed feedback on your resume with GPT-4 powered analysis, including strengths, weaknesses, and improvement suggestions.</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Job Match Scoring</h3>
            <p className="text-gray-600 dark:text-gray-300">See how well your resume matches specific job descriptions with detailed scoring and keyword analysis.</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Cover Letter Generator</h3>
            <p className="text-gray-600 dark:text-gray-300">Generate personalized cover letters tailored to specific job descriptions using advanced AI.</p>
          </div>
        </div>

        {/* ATS Score Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">ATS Compatibility Score</h2>
          <div className="flex justify-center items-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" className="dark:stroke-gray-600"/>
                <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="8" fill="none" 
                        strokeDasharray="251.2" strokeDashoffset="75.36" strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">85%</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ATS Score</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-300 mt-4">
            Get your ATS compatibility score and recommendations to improve your resume's chances of passing automated screening.
          </p>
        </div>
      </div>
    </div>
  );

  const UploadPage = () => {
    const [resumeText, setResumeText] = useState('');
    const [uploadMethod, setUploadMethod] = useState('file');

    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        uploadResume(file);
      }
    };

    const handleTextAnalysis = () => {
      if (!resumeText.trim()) {
        showNotification('Please enter your resume text', 'error');
        return;
      }
      analyzeResumeText(resumeText);
    };

    return (
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Upload Your Resume
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            {/* Upload Method Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setUploadMethod('file')}
                  className={`px-6 py-2 rounded-md transition-all ${
                    uploadMethod === 'file' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setUploadMethod('text')}
                  className={`px-6 py-2 rounded-md transition-all ${
                    uploadMethod === 'text' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Paste Text
                </button>
              </div>
            </div>

            {uploadMethod === 'file' ? (
              <div className="text-center">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 hover:border-blue-400 transition-colors">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                    Drag and drop your resume here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Supports PDF and DOCX files (max 10MB)
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="resume-upload"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg cursor-pointer transition-colors inline-block disabled:opacity-50"
                  >
                    {loading ? <LoadingSpinner /> : 'Choose File'}
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste your resume text below:
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Paste your resume content here..."
                  disabled={loading}
                />
                <div className="mt-6 text-center">
                  <button
                    onClick={handleTextAnalysis}
                    disabled={loading || !resumeText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <LoadingSpinner /> : 'Analyze Resume'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AnalysisPage = () => {
    if (!selectedResume) {
      return (
        <div className="container mx-auto px-6 py-12 text-center">
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Please upload a resume first to see the analysis.
          </p>
          <button 
            onClick={() => setActiveTab('upload')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            Upload Resume
          </button>
        </div>
      );
    }

    const analysis = selectedResume.analysis;
    const parsedData = selectedResume.parsedData;

    return (
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Resume Analysis
          </h1>
          
          {/* Score Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Overall Score</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none"/>
                    <circle cx="50" cy="50" r="40" stroke="#3b82f6" strokeWidth="8" fill="none" 
                            strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * analysis.overallScore / 100)} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.overallScore}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">ATS Compatibility</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none"/>
                    <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="8" fill="none" 
                            strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * analysis.atsScore / 100)} strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.atsScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">Strengths</h3>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Areas for Improvement</h3>
              <ul className="space-y-2">
                {analysis.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">AI Recommendations</h3>
            <div className="space-y-3">
              {analysis.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{index + 1}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const JobMatchPage = () => {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Job Match Analysis
          </h1>
          
          {/* Job Description Input */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Job Description</h3>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Paste the job description here..."
              disabled={loading}
            />
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedResume ? `Selected: ${selectedResume.fileName}` : 'No resume selected'}
              </div>
              <button
                onClick={matchJob}
                disabled={loading || !selectedResume || !jobDescription.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <LoadingSpinner /> : 'Analyze Match'}
              </button>
            </div>
          </div>

          {/* Match Results */}
          {matchResult && (
            <div className="space-y-6">
              {/* Match Score */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Match Score</h3>
                <div className="flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none"/>
                      <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="8" fill="none" 
                              strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * matchResult.matchScore / 100)} strokeLinecap="round"/>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{matchResult.matchScore}%</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Match</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Details */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Skills Match</h4>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {matchResult.matchDetails.skillsMatch}%
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Experience Match</h4>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {matchResult.matchDetails.experienceMatch}%
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Education Match</h4>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {matchResult.matchDetails.educationMatch}%
                  </div>
                </div>
              </div>

              {/* Keywords Analysis */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                  <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">Matched Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.matchDetails.keywordsMatch.map((keyword, index) => (
                      <span key={index} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                  <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Missing Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.matchDetails.missingKeywords.map((keyword, index) => (
                      <span key={index} className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Generated Cover Letter</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans">
                    {matchResult.coverLetter}
                  </pre>
                </div>
                <div className="mt-4 text-center">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Copy Cover Letter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const AdminPage = () => {
    useEffect(() => {
      loadAdminStats();
    }, []);

    if (!adminStats) {
      return (
        <div className="container mx-auto px-6 py-12 text-center">
          <LoadingSpinner />
        </div>
      );
    }

    return (
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Admin Dashboard
          </h1>
          
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminStats.stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Resumes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminStats.stats.totalResumes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Matches</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminStats.stats.totalMatches}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Score</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(adminStats.stats.avgResumeScore)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Resume Uploads</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 text-sm font-medium text-gray-600 dark:text-gray-400">File Name</th>
                    <th className="pb-3 text-sm font-medium text-gray-600 dark:text-gray-400">Candidate</th>
                    <th className="pb-3 text-sm font-medium text-gray-600 dark:text-gray-400">Score</th>
                    <th className="pb-3 text-sm font-medium text-gray-600 dark:text-gray-400">Upload Date</th>
                  </tr>
                </thead>
                <tbody>
                  {adminStats.recentActivity.map((resume, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3 text-gray-900 dark:text-white">{resume.fileName}</td>
                      <td className="py-3 text-gray-700 dark:text-gray-300">{resume.parsedData?.name || 'Anonymous'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          resume.analysis?.overallScore >= 80 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : resume.analysis?.overallScore >= 60
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {resume.analysis?.overallScore || 0}%
                        </span>
                      </td>
                      <td className="py-3 text-gray-700 dark:text-gray-300">
                        {new Date(resume.uploadedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  CareerAI
                </h1>
                <nav className="hidden md:flex space-x-6">
                  <button
                    onClick={() => setActiveTab('home')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'home'
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'upload'
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    Upload
                  </button>
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'analysis'
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    Analysis
                  </button>
                  <button
                    onClick={() => setActiveTab('match')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'match'
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    Job Match
                  </button>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'admin'
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    Admin
                  </button>
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {activeTab === 'home' && <HomePage />}
          {activeTab === 'upload' && <UploadPage />}
          {activeTab === 'analysis' && <AnalysisPage />}
          {activeTab === 'match' && <JobMatchPage />}
          {activeTab === 'admin' && <AdminPage />}
        </main>

        {/* Notification */}
        <Notification />
      </div>
    </div>
  );
}

export default App;