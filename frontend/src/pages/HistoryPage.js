import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Clock,
  FileText,
  Image as ImageIcon,
  Video,
  Newspaper,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  ArrowLeft,
  Filter,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit, offset };
      if (filterType) params.type = filterType;

      const response = await axios.get(`${API}/history`, { params });
      setHistory(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [filterType, offset]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all history?")) return;

    try {
      await axios.delete(`${API}/history`);
      setHistory([]);
      setTotal(0);
      toast.success("History cleared");
    } catch (error) {
      console.error("Failed to clear history:", error);
      toast.error("Failed to clear history");
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "text": return <FileText className="w-5 h-5 text-blue-600" />;
      case "image": return <ImageIcon className="w-5 h-5 text-purple-600" />;
      case "video": return <Video className="w-5 h-5 text-pink-600" />;
      case "verification": return <Newspaper className="w-5 h-5 text-green-600" />;
      default: return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusBadge = (status) => {
    if (status === "REAL") {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
          <CheckCircle className="w-3 h-3" /> REAL
        </span>
      );
    }
    if (status === "FAKE") {
      return (
        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-xs font-semibold">
          <XCircle className="w-3 h-3" /> FAKE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full text-xs font-semibold">
        <AlertCircle className="w-3 h-3" /> UNCERTAIN
      </span>
    );
  };

  const filterOptions = [
    { label: "All", value: null },
    { label: "Text", value: "text" },
    { label: "Image", value: "image" },
    { label: "Video", value: "video" },
    { label: "Verification", value: "verification" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/80">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm" data-testid="history-header">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-serif font-bold text-slate-900">TruthLens AI</h1>
            </div>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="rounded-xl"
              data-testid="back-to-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif text-slate-900 flex items-center gap-3" data-testid="history-title">
              <Clock className="w-8 h-8 text-blue-600" />
              Analysis History
            </h2>
            <p className="text-slate-600 mt-2">{total} total analyses</p>
          </div>
          {history.length > 0 && (
            <Button
              onClick={handleClearHistory}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              data-testid="clear-history-button"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Clear All
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8" data-testid="history-filters">
          <Filter className="w-5 h-5 text-slate-500 self-center mr-2" />
          {filterOptions.map((opt) => (
            <Button
              key={opt.label}
              onClick={() => { setFilterType(opt.value); setOffset(0); }}
              variant={filterType === opt.value ? "default" : "outline"}
              size="sm"
              className={`rounded-full ${
                filterType === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-white/70 text-slate-600 hover:bg-white"
              }`}
              data-testid={`filter-${opt.label.toLowerCase()}`}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20" data-testid="history-loading">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading history...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && history.length === 0 && (
          <div className="text-center py-20" data-testid="history-empty">
            <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-serif text-slate-700 mb-2">No analyses yet</h3>
            <p className="text-slate-500 mb-6">Your analysis history will appear here</p>
            <Button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
              Start Analyzing
            </Button>
          </div>
        )}

        {/* History List */}
        {!loading && history.length > 0 && (
          <div className="space-y-4" data-testid="history-list">
            {history.map((item, index) => (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl p-6 hover:shadow-md transition-shadow"
                data-testid={`history-item-${index}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {item.type}
                        </span>
                        {getStatusBadge(item.status)}
                        <span className="text-sm font-bold text-blue-600">
                          {Math.round(item.confidence)}%
                        </span>
                      </div>
                      <p className="text-slate-800 text-sm line-clamp-2 mb-2">
                        {item.content_preview}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expandable explanation */}
                {item.explanation && (
                  <div className="mt-4 border-l-3 border-blue-400 pl-4 ml-9">
                    <p className="text-sm text-slate-600 line-clamp-3">{item.explanation}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > limit && (
          <div className="flex items-center justify-center gap-4 mt-8" data-testid="history-pagination">
            <Button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              variant="outline"
              className="rounded-xl"
              data-testid="pagination-prev"
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
            </span>
            <Button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              variant="outline"
              className="rounded-xl"
              data-testid="pagination-next"
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
