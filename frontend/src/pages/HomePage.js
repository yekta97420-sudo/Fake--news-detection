import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Image as ImageIcon,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Loader2,
  Shield,
  Zap,
  Target,
  Clock,
  Newspaper,
  Files,
  ExternalLink,
} from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("text");
  const [textInput, setTextInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // Batch processing states
  const [batchMode, setBatchMode] = useState(false);
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchResults, setBatchResults] = useState(null);
  const [batchProgress, setBatchProgress] = useState("");

  // News verification
  const [verifyMode, setVerifyMode] = useState(false);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const batchImageInputRef = useRef(null);
  const batchVideoInputRef = useRef(null);

  const handleTextAnalysis = async () => {
    if (!textInput.trim()) {
      toast.error("Please enter some text to analyze");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setBatchResults(null);

    try {
      const endpoint = verifyMode ? `${API}/verify-news` : `${API}/detect-text`;
      const payload = verifyMode ? { claim: textInput } : { text: textInput };
      const response = await axios.post(endpoint, payload);
      setResult(response.data);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Text analysis error:", error);
      toast.error(error.response?.data?.detail || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageAnalysis = async () => {
    if (!imageFile) {
      toast.error("Please upload an image first");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setBatchResults(null);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await axios.post(`${API}/detect-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
      toast.success("Image analysis complete!");
    } catch (error) {
      console.error("Image analysis error:", error);
      toast.error(error.response?.data?.detail || "Image analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setVideoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoAnalysis = async () => {
    if (!videoFile) {
      toast.error("Please upload a video first");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setBatchResults(null);

    try {
      const formData = new FormData();
      formData.append("file", videoFile);

      const response = await axios.post(`${API}/detect-video`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
      toast.success("Video analysis complete!");
    } catch (error) {
      console.error("Video analysis error:", error);
      toast.error(error.response?.data?.detail || "Video analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Batch handlers
  const handleBatchFilesSelect = (e) => {
    const files = Array.from(e.target.files);
    setBatchFiles(files);
  };

  const handleBatchAnalysis = async () => {
    if (batchFiles.length === 0) {
      toast.error("Please select files for batch processing");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setBatchResults(null);
    setBatchProgress(`Uploading ${batchFiles.length} files...`);

    try {
      const formData = new FormData();
      batchFiles.forEach((file) => formData.append("files", file));

      const endpoint =
        activeTab === "image" ? `${API}/batch-detect-images` : `${API}/batch-detect-videos`;

      setBatchProgress(`Analyzing ${batchFiles.length} files...`);

      const response = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setBatchResults(response.data);
      toast.success(`Batch complete! ${response.data.successful}/${response.data.total_files} analyzed successfully.`);
    } catch (error) {
      console.error("Batch analysis error:", error);
      toast.error(error.response?.data?.detail || "Batch analysis failed.");
    } finally {
      setIsAnalyzing(false);
      setBatchProgress("");
    }
  };

  const scrollToDetection = () => {
    document.getElementById("detection-section")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const ResultBadge = ({ status }) => {
    if (status === "REAL") {
      return (
        <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-full" data-testid="result-badge-real">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">REAL</span>
        </div>
      );
    }
    if (status === "FAKE") {
      return (
        <div className="flex items-center gap-2 bg-red-100 text-red-800 border border-red-200 px-4 py-2 rounded-full" data-testid="result-badge-fake">
          <XCircle className="w-5 h-5" />
          <span className="font-semibold">FAKE</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 border border-yellow-200 px-4 py-2 rounded-full" data-testid="result-badge-uncertain">
        <AlertCircle className="w-5 h-5" />
        <span className="font-semibold">UNCERTAIN</span>
      </div>
    );
  };

  const ResultCard = ({ data }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/70 backdrop-blur-xl border-2 border-white/60 shadow-[0_8px_32px_rgba(37,99,235,0.08)] rounded-2xl p-8"
      data-testid="result-card"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-serif text-slate-900">Analysis Result</h3>
        <ResultBadge status={data.status} />
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-600 font-medium">Confidence Score</span>
          <span className="text-3xl font-bold text-blue-600" data-testid="confidence-score">
            {Math.round(data.confidence)}%
          </span>
        </div>
        <Progress value={data.confidence} className="h-3" data-testid="confidence-progress" />
      </div>

      <div className="border-l-4 border-blue-500 bg-blue-50/80 p-6 rounded-r-xl mb-6" data-testid="explanation-box">
        <h4 className="font-semibold text-slate-900 mb-2">Explanation</h4>
        <p className="text-slate-700 leading-relaxed">{data.explanation}</p>
      </div>

      {data.suspicious_keywords && data.suspicious_keywords.length > 0 && (
        <div className="mb-6" data-testid="suspicious-keywords">
          <h4 className="font-semibold text-slate-900 mb-3">Key Indicators</h4>
          <div className="flex flex-wrap gap-2">
            {data.suspicious_keywords.map((keyword, index) => (
              <span key={index} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.sources && data.sources.length > 0 && data.sources[0] && (
        <div data-testid="sources-section">
          <h4 className="font-semibold text-slate-900 mb-3">Additional Context</h4>
          <ul className="space-y-2">
            {data.sources.map((source, index) =>
              source ? (
                <li key={index} className="text-slate-700 text-sm">
                  &bull; {source}
                </li>
              ) : null
            )}
          </ul>
        </div>
      )}

      {/* News API matching articles */}
      {data.matching_articles && data.matching_articles.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-6" data-testid="news-articles-section">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-600" />
            Related News Articles
          </h4>
          <div className="space-y-3">
            {data.matching_articles.map((article, index) => (
              <div key={index} className="bg-white/80 border border-slate-200 rounded-xl p-4">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-700 hover:underline flex items-center gap-1"
                >
                  {article.title}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-sm text-slate-500 mt-1">
                  {article.source} &mdash; {article.published_at ? new Date(article.published_at).toLocaleDateString() : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/80">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm" data-testid="header">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-serif font-bold text-slate-900" data-testid="logo">
                TruthLens AI
              </h1>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-slate-600 hover:text-blue-600 font-medium transition-colors" data-testid="nav-home">Home</a>
              <a href="#detection-section" className="text-slate-600 hover:text-blue-600 font-medium transition-colors" data-testid="nav-detect">Detect</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-blue-600 font-medium transition-colors" data-testid="nav-how">How It Works</a>
              <button onClick={() => navigate("/history")} className="text-slate-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-1" data-testid="nav-history">
                <Clock className="w-4 h-4" /> History
              </button>
            </nav>
            <Button onClick={scrollToDetection} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-lg" data-testid="header-cta-button">
              Verify Now
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="py-24 sm:py-32" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-5xl sm:text-6xl tracking-tighter font-serif text-slate-900 leading-tight mb-6" data-testid="hero-title">
              AI-Powered{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Fake News Detector
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed" data-testid="hero-subtitle">
              Verify the authenticity of news articles, images, and videos using cutting-edge AI technology. Get instant analysis with confidence scores and detailed explanations.
            </p>
            <Button onClick={scrollToDetection} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all" data-testid="hero-cta-button">
              Start Verification
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Detection Section */}
      <section id="detection-section" className="py-24 bg-white/30" data-testid="detection-section">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl tracking-tight font-serif text-slate-900 mb-4" data-testid="detection-title">
              Choose Detection Method
            </h2>
            <p className="text-slate-600">Select the type of content you want to verify</p>
          </div>

          {/* Tab Selection */}
          <div className="flex justify-center gap-4 mb-8" data-testid="detection-tabs">
            {["text", "image", "video"].map((tab) => (
              <Button
                key={tab}
                onClick={() => { setActiveTab(tab); setResult(null); setBatchResults(null); setBatchMode(false); }}
                variant={activeTab === tab ? "default" : "outline"}
                className={`rounded-xl px-6 py-3 ${activeTab === tab ? "bg-blue-600 text-white" : "bg-white/70 text-slate-700 hover:bg-white"}`}
                data-testid={`tab-${tab}`}
              >
                {tab === "text" && <FileText className="w-5 h-5 mr-2" />}
                {tab === "image" && <ImageIcon className="w-5 h-5 mr-2" />}
                {tab === "video" && <Video className="w-5 h-5 mr-2" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>

          {/* Detection Cards */}
          <div className="max-w-4xl mx-auto">
            {/* Text Detection */}
            {activeTab === "text" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(37,99,235,0.06)] rounded-2xl p-8" data-testid="text-detection-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-serif text-slate-800">Text News Detection</h3>
                  <label className="flex items-center gap-2 cursor-pointer" data-testid="verify-mode-toggle">
                    <input
                      type="checkbox"
                      checked={verifyMode}
                      onChange={(e) => setVerifyMode(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-slate-600 flex items-center gap-1">
                      <Newspaper className="w-4 h-4" /> News Verification
                    </span>
                  </label>
                </div>
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={verifyMode ? "Enter a claim to verify against news sources..." : "Paste news article text here..."}
                  className="min-h-[200px] bg-white border border-blue-100 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl mb-4"
                  data-testid="text-input"
                />
                <Button onClick={handleTextAnalysis} disabled={isAnalyzing} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 text-lg" data-testid="text-analyze-button">
                  {isAnalyzing ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing...</>
                  ) : verifyMode ? (
                    <><Newspaper className="w-5 h-5 mr-2" />Verify Claim</>
                  ) : (
                    "Analyze Text"
                  )}
                </Button>
              </motion.div>
            )}

            {/* Image Detection */}
            {activeTab === "image" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(37,99,235,0.06)] rounded-2xl p-8" data-testid="image-detection-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-serif text-slate-800">Image Deepfake Detection</h3>
                  <label className="flex items-center gap-2 cursor-pointer" data-testid="batch-mode-toggle">
                    <input
                      type="checkbox"
                      checked={batchMode}
                      onChange={(e) => { setBatchMode(e.target.checked); setBatchFiles([]); setBatchResults(null); }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-slate-600 flex items-center gap-1">
                      <Files className="w-4 h-4" /> Batch Upload
                    </span>
                  </label>
                </div>

                {!batchMode ? (
                  <>
                    <div onClick={() => imageInputRef.current?.click()} className="border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer mb-4 min-h-[200px]" data-testid="image-upload-area">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg" />
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-blue-600 mb-4" />
                          <p className="text-slate-600">Click to upload or drag and drop</p>
                          <p className="text-sm text-slate-500 mt-2">PNG, JPG up to 10MB</p>
                        </>
                      )}
                    </div>
                    <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" data-testid="image-file-input" />
                    <Button onClick={handleImageAnalysis} disabled={isAnalyzing || !imageFile} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 text-lg" data-testid="image-analyze-button">
                      {isAnalyzing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing...</> : "Analyze Image"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div onClick={() => batchImageInputRef.current?.click()} className="border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer mb-4 min-h-[200px]" data-testid="batch-image-upload-area">
                      {batchFiles.length > 0 ? (
                        <div className="text-center">
                          <Files className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                          <p className="text-slate-800 font-medium">{batchFiles.length} files selected</p>
                          <p className="text-sm text-slate-500 mt-1">{batchFiles.map((f) => f.name).join(", ")}</p>
                        </div>
                      ) : (
                        <>
                          <Files className="w-12 h-12 text-blue-600 mb-4" />
                          <p className="text-slate-600">Click to select multiple images</p>
                          <p className="text-sm text-slate-500 mt-2">Max 10 files (PNG, JPG)</p>
                        </>
                      )}
                    </div>
                    <input ref={batchImageInputRef} type="file" accept="image/*" multiple onChange={handleBatchFilesSelect} className="hidden" data-testid="batch-image-file-input" />
                    <Button onClick={handleBatchAnalysis} disabled={isAnalyzing || batchFiles.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 text-lg" data-testid="batch-image-analyze-button">
                      {isAnalyzing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{batchProgress || "Processing..."}</> : `Analyze ${batchFiles.length} Images`}
                    </Button>
                  </>
                )}
              </motion.div>
            )}

            {/* Video Detection */}
            {activeTab === "video" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(37,99,235,0.06)] rounded-2xl p-8" data-testid="video-detection-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-serif text-slate-800">Video Deepfake Detection</h3>
                  <label className="flex items-center gap-2 cursor-pointer" data-testid="batch-video-toggle">
                    <input
                      type="checkbox"
                      checked={batchMode}
                      onChange={(e) => { setBatchMode(e.target.checked); setBatchFiles([]); setBatchResults(null); }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-slate-600 flex items-center gap-1">
                      <Files className="w-4 h-4" /> Batch Upload
                    </span>
                  </label>
                </div>

                {!batchMode ? (
                  <>
                    <div onClick={() => videoInputRef.current?.click()} className="border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer mb-4 min-h-[200px]" data-testid="video-upload-area">
                      {videoPreview ? (
                        <video src={videoPreview} controls className="max-h-64 rounded-lg" />
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-blue-600 mb-4" />
                          <p className="text-slate-600">Click to upload or drag and drop</p>
                          <p className="text-sm text-slate-500 mt-2">MP4, MOV up to 100MB</p>
                        </>
                      )}
                    </div>
                    <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" data-testid="video-file-input" />
                    <Button onClick={handleVideoAnalysis} disabled={isAnalyzing || !videoFile} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 text-lg" data-testid="video-analyze-button">
                      {isAnalyzing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing...</> : "Analyze Video"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div onClick={() => batchVideoInputRef.current?.click()} className="border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer mb-4 min-h-[200px]" data-testid="batch-video-upload-area">
                      {batchFiles.length > 0 ? (
                        <div className="text-center">
                          <Files className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                          <p className="text-slate-800 font-medium">{batchFiles.length} videos selected</p>
                          <p className="text-sm text-slate-500 mt-1">{batchFiles.map((f) => f.name).join(", ")}</p>
                        </div>
                      ) : (
                        <>
                          <Files className="w-12 h-12 text-blue-600 mb-4" />
                          <p className="text-slate-600">Click to select multiple videos</p>
                          <p className="text-sm text-slate-500 mt-2">Max 5 files (MP4, MOV)</p>
                        </>
                      )}
                    </div>
                    <input ref={batchVideoInputRef} type="file" accept="video/*" multiple onChange={handleBatchFilesSelect} className="hidden" data-testid="batch-video-file-input" />
                    <Button onClick={handleBatchAnalysis} disabled={isAnalyzing || batchFiles.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 text-lg" data-testid="batch-video-analyze-button">
                      {isAnalyzing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{batchProgress || "Processing..."}</> : `Analyze ${batchFiles.length} Videos`}
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Single Result Display */}
          {result && (
            <div className="max-w-4xl mx-auto mt-8">
              <ResultCard data={result} />
            </div>
          )}

          {/* Batch Results Display */}
          {batchResults && (
            <div className="max-w-4xl mx-auto mt-8" data-testid="batch-results">
              <div className="bg-white/70 backdrop-blur-xl border-2 border-white/60 shadow-[0_8px_32px_rgba(37,99,235,0.08)] rounded-2xl p-8 mb-4">
                <h3 className="text-2xl font-serif text-slate-900 mb-4">Batch Results</h3>
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{batchResults.total_files}</p>
                    <p className="text-sm text-slate-500">Total Files</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">{batchResults.successful}</p>
                    <p className="text-sm text-slate-500">Successful</p>
                  </div>
                  {batchResults.failed > 0 && (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-600">{batchResults.failed}</p>
                      <p className="text-sm text-slate-500">Failed</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {batchResults.results.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm rounded-xl p-6"
                    data-testid={`batch-result-${index}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-800">{item.filename}</span>
                      <ResultBadge status={item.status} />
                    </div>
                    {item.success && (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-slate-500">Confidence:</span>
                          <span className="font-bold text-blue-600">{Math.round(item.confidence)}%</span>
                        </div>
                        <p className="text-sm text-slate-600">{item.explanation}</p>
                      </>
                    )}
                    {!item.success && (
                      <p className="text-sm text-red-600">{item.explanation}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl tracking-tight font-serif text-slate-900 mb-4" data-testid="how-it-works-title">How It Works</h2>
            <p className="text-slate-600">Our AI-powered detection process in three simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center" data-testid="how-it-works-step-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4"><Upload className="w-8 h-8" /></div>
              <h3 className="text-xl font-serif text-slate-900 mb-2">1. Upload Content</h3>
              <p className="text-slate-600">Submit text, images, or videos you want to verify for authenticity.</p>
            </div>
            <div className="text-center" data-testid="how-it-works-step-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4"><Zap className="w-8 h-8" /></div>
              <h3 className="text-xl font-serif text-slate-900 mb-2">2. AI Analysis</h3>
              <p className="text-slate-600">Our advanced AI models analyze content for manipulation, inconsistencies, and authenticity markers.</p>
            </div>
            <div className="text-center" data-testid="how-it-works-step-3">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4"><Target className="w-8 h-8" /></div>
              <h3 className="text-xl font-serif text-slate-900 mb-2">3. Get Results</h3>
              <p className="text-slate-600">Receive detailed analysis with confidence scores, explanations, and key indicators.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Trust Us */}
      <section className="py-24 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/80">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-3xl sm:text-4xl tracking-tight font-serif text-slate-900 mb-6" data-testid="why-trust-title">Why Trust TruthLens AI?</h2>
          <p className="text-slate-600 max-w-3xl mx-auto mb-12">Our platform uses state-of-the-art AI models trained on millions of data points to provide accurate, reliable fake news detection.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(37,99,235,0.06)] rounded-2xl p-6">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-serif text-slate-900 mb-2">Advanced AI Models</h3>
              <p className="text-slate-600">Powered by GPT-5.2 and cutting-edge computer vision technology.</p>
            </div>
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(37,99,235,0.06)] rounded-2xl p-6">
              <Zap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-serif text-slate-900 mb-2">Real-Time Analysis</h3>
              <p className="text-slate-600">Get instant results with detailed explanations and confidence scores.</p>
            </div>
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(37,99,235,0.06)] rounded-2xl p-6">
              <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-serif text-slate-900 mb-2">Multi-Format Support</h3>
              <p className="text-slate-600">Analyze text, images, and videos all in one platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-slate-50" data-testid="footer">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
            <h3 className="text-2xl font-serif font-bold text-slate-900">TruthLens AI</h3>
          </div>
          <p className="text-slate-600 mb-8">Empowering truth in the digital age with AI-powered verification.</p>
          <div className="flex justify-center gap-8 text-slate-600">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
          <p className="text-slate-500 text-sm mt-8">&copy; 2026 TruthLens AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
