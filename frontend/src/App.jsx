import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

// --- Animated Logos ---
const LogoPrimary = () => (
  <svg viewBox="0 0 48 48" className="w-16 h-16 mb-6">
    <defs><filter id="logoGlow"><feGaussianBlur stdDeviation="3" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
    <polygon points="24,3 44,14 44,34 24,45 4,34 4,14" fill="none" stroke="#06b6d4" strokeWidth="1.4" filter="url(#logoGlow)" opacity="0.9" />
    <polygon points="24,9 34,16 34,32 24,39 14,32 14,16" fill="rgba(6,182,212,0.1)" stroke="#06b6d4" strokeWidth="0.7" opacity="0.65" />
    <circle cx="24" cy="24" r="4.5" fill="#06b6d4" opacity="0.85"><animate attributeName="opacity" values="0.5;1;0.5" dur="3.5s" repeatCount="indefinite" /></circle>
    <circle cx="24" cy="24" r="11" fill="none" stroke="#8b5cf6" strokeWidth="0.4" opacity="0.4" strokeDasharray="3 5"><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="18s" repeatCount="indefinite" /></circle>
  </svg>
);

const LogoSecondary = () => (
  <svg viewBox="0 0 48 48" className="w-16 h-16 mb-6">
    <defs><filter id="logoGlowSign"><feGaussianBlur stdDeviation="3" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
    <polygon points="24,3 44,14 44,34 24,45 4,34 4,14" fill="none" stroke="#8b5cf6" strokeWidth="1.4" filter="url(#logoGlowSign)" opacity="0.9" />
    <polygon points="24,9 34,16 34,32 24,39 14,32 14,16" fill="rgba(139,92,246,0.1)" stroke="#8b5cf6" strokeWidth="0.7" opacity="0.65" />
    <circle cx="24" cy="24" r="4.5" fill="#8b5cf6" opacity="0.85"><animate attributeName="opacity" values="0.5;1;0.5" dur="3.5s" repeatCount="indefinite" /></circle>
    <circle cx="24" cy="24" r="11" fill="none" stroke="#06b6d4" strokeWidth="0.4" opacity="0.4" strokeDasharray="3 5"><animateTransform attributeName="transform" type="rotate" from="360 24 24" to="0 24 24" dur="18s" repeatCount="indefinite" /></circle>
  </svg>
);

// --- Shared UI Components ---
const Input = ({ className = "", type = "text", ...props }) => (
  <input
    type={type}
    className={`w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors ${className}`}
    {...props}
  />
);

const Label = ({ children, className = "" }) => (
  <label className={`block text-[11px] font-bold tracking-[0.15em] text-gray-400 mb-2 uppercase ${className}`}>
    {children}
  </label>
);

const Button = ({ children, className = "", onClick, disabled }) => (
  <motion.button
    whileHover={!disabled ? { scale: 1.01 } : {}}
    whileTap={!disabled ? { scale: 0.99 } : {}}
    className={`w-full flex items-center justify-center rounded-lg text-sm font-bold text-white transition-all h-12 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 ${className}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </motion.button>
);

const Card = ({ children, className = "", ...props }) => (
  <div className={`bg-black/75 backdrop-blur-xl border border-white/10 rounded-xl p-6 ${className}`} {...props}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-[#06b6d4]/10 text-[#06b6d4] border-[#06b6d4]/20",
    secondary: "bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20",
    error: "bg-red-500/10 text-red-500 border-red-500/20",
    outline: "text-white border border-white/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};

// --- Main Application Router ---
export default function App() {
  const [view, setView] = useState("login");
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Programmatic Title and Browser Bar Configuration
  useEffect(() => {
    document.title = "ARIA";
  }, []);

  useEffect(() => {
    if (token && (view === "login" || view === "signup")) setView("dashboard");
  }, [token, view]);

  const validateForm = (isLoginMode) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) { toast.error("Email is required."); return false; }
    if (!emailRegex.test(email)) { toast.error("Please enter a valid email address."); return false; }
    if (!password) { toast.error("Password is required."); return false; }

    if (!isLoginMode) {
      if (password.length < 8) { toast.error("Password must be at least 8 characters."); return false; }
      if (!fullName) { toast.error("Full Name is required."); return false; }
      if (!organization) { toast.error("Organization is required."); return false; }
      if (!termsAccepted) { toast.error("You must agree to the Terms of Service."); return false; }
    }
    return true;
  };

  const handleAuth = async (isLoginMode) => {
    if (!validateForm(isLoginMode)) return;

    setIsLoading(true);
    const endpoint = isLoginMode ? 'login' : 'signup';

    try {
      let res;
      if (isLoginMode) {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        res = await fetch(`http://localhost:8000/api/auth/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params
        });
      } else {
        res = await fetch(`http://localhost:8000/api/auth/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, password: password })
        });
      }

      const data = await res.json();
      if (res.ok) {
        if (isLoginMode) {
          setToken(data.access_token);
          localStorage.setItem('token', data.access_token);
          toast.success("Authentication successful");
          setView("dashboard");
        } else {
          toast.success("Account created successfully. Please log in.");
          setView("login");
          setPassword('');
          setTermsAccepted(false);
        }
      } else {
        toast.error(data.detail || "Authentication Failed");
      }
    } catch (e) {
      toast.error("Backend connection offline.");
    }
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setView('login');
  };

  const renderContent = () => {
    switch (view) {
      case "login":
        return (
          <div className="flex items-center justify-center min-h-screen px-4 font-sans relative z-10 w-full">
            <div className="w-full max-w-sm">
              <div className="flex flex-col items-center mb-8 text-center">
                <LogoPrimary />
                <h2 className="text-4xl font-light tracking-tight text-white mb-2">Welcome back</h2>
                <p className="text-[11px] tracking-[0.2em] uppercase text-gray-500 font-semibold">Sign in to ARIA Research</p>
              </div>
              <div className="space-y-6">
                <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@research.org" /></div>
                <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="········" /></div>
                <Button onClick={() => handleAuth(true)} disabled={isLoading} className="mt-8 bg-[#06b6d4] hover:bg-[#0891b2] text-black">
                  {isLoading ? 'Authenticating...' : 'Sign In'}
                </Button>
                <p className="text-sm text-gray-500 text-center mt-6">
                  Don't have an account? <span className="text-[#06b6d4] cursor-pointer hover:underline" onClick={() => setView("signup")}>Sign up →</span>
                </p>
              </div>
            </div>
          </div>
        );
      case "signup":
        return (
          <div className="flex items-center justify-center min-h-screen px-4 font-sans relative z-10 w-full py-12">
            <div className="w-full max-w-sm">
              <div className="flex flex-col items-center mb-8 text-center">
                <LogoSecondary />
                <h2 className="text-4xl font-light tracking-tight text-white mb-2">Join ARIA</h2>
                <p className="text-[11px] tracking-[0.2em] uppercase text-gray-500 font-semibold">Create your research account</p>
              </div>
              <div className="space-y-5">
                <div><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Jane Smith" /></div>
                <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@research.org" /></div>
                <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="········" /></div>
                <div><Label>Organization</Label><Input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Research Lab or University" /></div>
                <div className="flex items-center gap-3 pt-2">
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="w-4 h-4 rounded border-gray-700 bg-[#0a0a0a] accent-[#8b5cf6] cursor-pointer shrink-0" />
                  <span className="text-sm text-gray-400">I agree to the <span className="text-[#8b5cf6] cursor-pointer hover:underline">Terms</span></span>
                </div>
                <Button onClick={() => handleAuth(false)} disabled={isLoading} className="mt-4">
                  {isLoading ? 'Processing...' : 'Create Account'}
                </Button>
                <p className="text-sm text-gray-500 text-center mt-6">
                  Already have an account? <span className="text-[#8b5cf6] cursor-pointer hover:underline" onClick={() => setView("login")}>Sign in →</span>
                </p>
              </div>
            </div>
          </div>
        );
      case "dashboard":
        return <Dashboard token={token} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#06b6d4]/30 relative overflow-x-hidden font-sans w-full flex flex-col">
      {/* Global Background Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Global Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-8 bg-black/80 backdrop-blur-xl border-b border-white/10 w-full">
        <div className="flex items-center justify-center gap-3">
          {/* Changed Icon to Purple Hexagon Variant */}
          <svg viewBox="0 0 48 48" className="w-8 h-8 md:w-9 md:h-9 flex-shrink-0">
            <defs><filter id="navGlow"><feGaussianBlur stdDeviation="2" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
            <polygon points="24,3 44,14 44,34 24,45 4,34 4,14" fill="none" stroke="#8b5cf6" strokeWidth="1.4" filter="url(#navGlow)" />
            <polygon points="24,9 34,16 34,32 24,39 14,32 14,16" fill="rgba(139,92,246,0.1)" stroke="#8b5cf6" strokeWidth="0.6" />
            <circle cx="24" cy="24" r="3.5" fill="#8b5cf6" />
          </svg>
          <div className="flex items-center gap-2">
            <h1 className="text-xs md:text-sm font-semibold tracking-[0.15em] uppercase text-white">ARIA</h1>
            <p className="hidden md:block text-[10px] tracking-[0.25em] uppercase text-gray-400 mt-[2px]">Autonomous research agent</p>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <span className="text-sm font-medium text-gray-300 hover:text-white cursor-pointer transition-colors flex items-center" onClick={() => token ? setView("dashboard") : setView("login")}>Home</span>

          {/* Dynamic Authentic Account State Router */}
          {token ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold cursor-pointer text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all"
              title="Click to Disconnect Terminal"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#8b5cf6]"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Account
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView("login")}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white text-xs font-bold cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-shadow border border-white/20 flex items-center justify-center whitespace-nowrap"
            >
              Sign In / Sign Up
            </motion.button>
          )}
        </div>
      </nav>

      <Toaster position="top-center" toastOptions={{ style: { background: '#0a0a0a', color: '#fff', border: '1px solid #333' } }} />
      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="w-full flex-1 flex flex-col">
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- Live Dashboard Component (SSE Wired & Export Ready) ---
const Dashboard = ({ token }) => {
  const [query, setQuery] = useState("");
  const [report, setReport] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState("Idle");

  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);

  const [stages, setStages] = useState([
    { id: "Plan", desc: "Intent & path generation", icon: "plan", status: "Idle", color: "#8b5cf6" },
    { id: "Deep Search", desc: "DOM scraping & metasearch", icon: "search", status: "Idle", color: "#06b6d4" },
    { id: "Rank & Embed", desc: "Vector injection & sorting", icon: "embed", status: "Idle", color: "#8b5cf6" },
    { id: "Synthesis", desc: "Report generation", icon: "synthesis", status: "Idle", color: "#06b6d4" },
  ]);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 30, filter: "blur(4px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: "easeOut" } } };

  const handleCopy = () => {
    const textToCopy = typeof report === 'string' ? report : JSON.stringify(report, null, 2);
    navigator.clipboard.writeText(textToCopy);
    toast.success("Report copied to clipboard.");
  };

  const handleDownload = async (format) => {
    setIsDownloadMenuOpen(false);
    const textToExport = typeof report === 'string' ? report : JSON.stringify(report, null, 2);

    if (format === 'txt') {
      const blob = new Blob([textToExport], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ARIA_Research_Report.txt';
      a.click();
      URL.revokeObjectURL(url);
      toast.success("TXT file downloaded locally.");
      return;
    }

    const loadingToast = toast.loading(`Generating ${format.toUpperCase()} via engine...`);

    try {
      const res = await fetch('http://localhost:8000/api/research/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ markdown_text: textToExport, format })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ARIA_Research_Report.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success(`${format.toUpperCase()} downloaded successfully.`);
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error(`Export failed: ${e.message}`);
    }
  };

  const runResearch = async () => {
    if (!query) return toast.error("Enter a research query.");
    setIsProcessing(true);
    setReport("");
    setPipelineStatus("Initializing...");
    setIsDownloadMenuOpen(false);

    setStages(prev => prev.map(s => ({ ...s, status: "Idle" })));

    try {
      const res = await fetch('http://localhost:8000/api/research/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ query })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (let line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.report) {
                setReport(data.report);
                setStages(prev => prev.map(s => ({ ...s, status: 'Complete' })));
                setPipelineStatus("Completed");
                toast.success("Research completed.");
              } else if (data.stage) {
                setPipelineStatus(`Running: ${data.stage}`);
                setStages(prev => prev.map(s => {
                  if (s.id === data.stage) return { ...s, status: 'Active' };
                  if (s.status === 'Active') return { ...s, status: 'Complete' };
                  return s;
                }));
              }
            } catch (jsonError) {
              console.warn("Incomplete stream chunk received.");
            }
          }
        }
      }
    } catch (e) {
      toast.error(e.message || "Agent Engine Offline or Failed.");
      setPipelineStatus("Failed");
      setStages(prev => prev.map(s => ({ ...s, status: s.status === 'Active' ? 'Failed' : s.status })));
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Failed') return 'bg-red-500';
    if (status === 'Completed') return 'bg-[#10b981]';
    if (isProcessing) return 'bg-[#06b6d4] animate-pulse';
    return 'bg-gray-500';
  };

  return (
    <div className="w-full flex flex-col pt-16">
      <motion.main variants={containerVariants} initial="hidden" animate="show" className="pb-16 w-full px-4 md:px-8 xl:px-16 flex-1 flex flex-col space-y-8">

        <motion.div variants={itemVariants} className="w-full">
          <Card className="relative overflow-hidden w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-[#06b6d4]/5 to-[#8b5cf6]/5 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <p className="text-xs tracking-[0.28em] uppercase text-gray-500">Initialize Pipeline</p>
              <Badge variant={pipelineStatus === 'Failed' ? 'error' : 'outline'} className="gap-2 bg-black/50">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(pipelineStatus)}`}></span>
                {pipelineStatus}
              </Badge>
            </div>
            <div className="flex flex-col lg:flex-row items-center gap-4 relative z-10 w-full">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter research topic or URL for extraction..."
                className="flex-1 py-4 lg:py-6 text-base lg:text-lg bg-black/60 border-white/20 focus:border-[#06b6d4]"
                disabled={isProcessing}
              />
              <Button onClick={runResearch} disabled={isProcessing} className="w-full lg:w-48 py-4 lg:py-6 text-base lg:text-lg bg-[#06b6d4] hover:bg-[#0891b2] text-black shrink-0">
                {isProcessing ? 'Processing...' : 'Execute Task'}
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full pt-2">
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-extralight tracking-tight break-words">Research Pipeline</h2>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full">
          <Card className="w-full p-4 md:p-6 overflow-hidden">
            <div className="flex items-center gap-4 w-full overflow-x-auto pb-4 custom-scrollbar">
              {stages.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <div className={`bg-black/40 border border-white/5 rounded-xl p-5 min-w-[200px] flex-1 text-center transition-all ${item.status === 'Active' ? 'ring-1 ring-[#06b6d4]/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : item.status === 'Failed' ? 'opacity-30 grayscale ring-1 ring-red-500/50' : item.status === 'Complete' ? 'opacity-50' : ''}`}>
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center border" style={{ backgroundColor: `${item.color}10`, borderColor: `${item.color}30` }}>
                      {item.icon === "plan" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="1.6"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                      {item.icon === "search" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="1.6"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>}
                      {item.icon === "embed" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="1.6"><circle cx="12" cy="12" r="9" strokeOpacity="0.5" /><circle cx="8" cy="8" r="2" fill={`${item.color}40`} /><circle cx="16" cy="9" r="1.8" fill={`${item.color}35`} /><circle cx="10" cy="16" r="2.2" fill={`${item.color}40`} /><circle cx="17" cy="15" r="1.6" fill={`${item.color}30`} /></svg>}
                      {item.icon === "synthesis" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="1.5"><polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" fill={`${item.color}20`} /></svg>}
                    </div>
                    <p className="text-[10px] md:text-[11px] tracking-[0.2em] uppercase font-bold break-words" style={{ color: item.color }}>{item.id}</p>
                    <p className="text-[10px] md:text-[11px] text-gray-500 mt-1 hidden md:block">{item.desc}</p>
                  </div>
                  {idx < 3 && (
                    <div className="flex items-center flex-shrink-0" style={{ width: 40, height: 40 }}>
                      <svg width="40" height="40">
                        <line x1="0" y1="20" x2="40" y2="20" stroke={item.color} strokeWidth="1.2" strokeDasharray="4 4" opacity="0.5" />
                        {item.status === 'Active' && <circle r="3" fill={item.color} opacity="0.9"><animateMotion dur="0.8s" repeatCount="indefinite" path="M0,20 L40,20" /></circle>}
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </Card>
        </motion.div>

        {report && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="w-full">
            <Card className="border-[#10b981]/20 w-full overflow-visible">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 relative">
                <p className="text-xs tracking-[0.28em] uppercase text-[#10b981] font-bold">Synthesis Complete & Verified</p>

                <div className="flex items-center gap-3">
                  <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-semibold text-gray-300">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    Copy
                  </button>

                  <div className="relative">
                    <button onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#06b6d4]/10 border border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 transition-all text-xs font-semibold text-[#06b6d4]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      Export
                      <motion.svg animate={{ rotate: isDownloadMenuOpen ? 180 : 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></motion.svg>
                    </button>

                    <AnimatePresence>
                      {isDownloadMenuOpen && (
                        <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-2 w-36 bg-[#0a0a0a] backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50">
                          <div className="flex flex-col">
                            <button onClick={() => handleDownload('pdf')} className="flex items-center gap-2 text-left px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-[#06b6d4]/10 hover:text-[#06b6d4] transition-colors">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                              .PDF File
                            </button>
                            <button onClick={() => handleDownload('docx')} className="flex items-center gap-2 text-left px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-[#8b5cf6]/10 hover:text-[#8b5cf6] transition-colors border-y border-white/5">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" /><polyline points="14 2 14 8 20 8" /><path d="M2 15h10" /><path d="M9 18l3-3-3-3" /></svg>
                              .DOCX File
                            </button>
                            <button onClick={() => handleDownload('txt')} className="flex items-center gap-2 text-left px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>
                              .TXT File
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base text-gray-300 break-words">
                {typeof report === 'string' ? report : JSON.stringify(report, null, 2)}
              </div>
            </Card>
          </motion.div>
        )}
      </motion.main>
    </div>
  );
};