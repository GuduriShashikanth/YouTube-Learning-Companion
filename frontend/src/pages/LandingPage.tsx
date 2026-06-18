import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  BookOpen,
  Layers,
  Brain,
  MessageSquare,
  Clock,
  Play,
  Check,
  Send,
  Star,
  Zap,
  HelpCircle,
  ChevronRight,
  Code
} from 'lucide-react';

// Predefined quiz question for playground
const PLAYGROUND_QUIZ = {
  question: "Which of the following is the correct syntax to define a function in Python?",
  options: [
    { key: "A", text: "function myFunc():", isCorrect: false },
    { key: "B", text: "def my_func():", isCorrect: true },
    { key: "C", text: "void myFunc() {}", isCorrect: false },
    { key: "D", text: "define myFunc():", isCorrect: false }
  ],
  explanation: "In Python, the 'def' keyword is used to define functions, followed by the function name and parentheses."
};

// Predefined flashcards for playground
const PLAYGROUND_FLASHCARDS = [
  {
    front: "What is the primary difference between a Python List and a Tuple?",
    back: "Lists are mutable (can be edited after creation using square brackets `[]`), whereas Tuples are immutable (cannot be changed after creation, defined with parentheses `()`)."
  },
  {
    front: "What does PEP 8 stand for in Python development?",
    back: "PEP 8 is Python's official Style Guide. It outlines coding conventions and standards for writing clean, readable, and maintainable Python code."
  },
  {
    front: "How do you handle exceptions in Python?",
    back: "Exceptions are caught and handled using the 'try' and 'except' blocks, allowing developers to handle run-time errors gracefully."
  }
];

// Predefined FAQs
const FAQS = [
  {
    question: "How does LearnTube turn videos into notes?",
    answer: "Our system fetches the official or auto-generated transcript of the YouTube video, feeds it through our specialized LLM pipeline, formats the concepts into structured chapters, and generates matching interactive materials like quizzes and flashcards."
  },
  {
    question: "Is there a limit on video length?",
    answer: "You can process videos of almost any length. For standard study sessions, videos between 5 minutes and 2 hours work best and generate highly detailed study guides."
  },
  {
    question: "Can I ask questions about specific parts of a video?",
    answer: "Yes! Our integrated RAG (Retrieval-Augmented Generation) chat system retrieves context directly from the transcript, allowing you to ask questions like 'What did they say about variable declarations at 5:12?' and get an instant, timestamped response."
  },
  {
    question: "Are the study materials saved to my profile?",
    answer: "Absolutely. Once you create an account, any YouTube link you process is saved in your Personal Library, enabling spaced-repetition studying, chat history recovery, and quiz progress tracking."
  }
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'quiz' | 'chat'>('notes');
  
  // Quiz states
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  
  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Chat states
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: "Hello! I've analyzed this Python tutorial. Ask me anything about loops, variable definitions, or OOP concepts mentioned in the video." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // FAQ accordion active indices
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Auto typing animation for hero heading
  const [heroTitleIndex, setHeroTitleIndex] = useState(0);
  const heroTitles = ["Study Smarter", "Create Flashcards", "Test Your Knowledge", "Ask AI Questions"];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroTitleIndex((prev) => (prev + 1) % heroTitles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userText = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setIsTyping(true);

    // Simulated streaming response from LLM
    setTimeout(() => {
      let reply = "In Python, variables are created the moment you first assign a value to them. Unlike other languages, you don't need to specify their type. For example: `x = 5` creates an integer variable.";
      if (userText.toLowerCase().includes('list') || userText.toLowerCase().includes('tuple')) {
        reply = "Lists are mutable and defined as `my_list = [1, 2, 3]`. Tuples are immutable, defined as `my_tuple = (1, 2, 3)`. You choose tuples for fixed configuration data.";
      } else if (userText.toLowerCase().includes('loop') || userText.toLowerCase().includes('for')) {
        reply = "Python has two loop commands: `for` loops (to iterate over lists/tuples/ranges) and `while` loops (to execute statements as long as a condition is true).";
      }
      setChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSuggestedQuestion = (text: string) => {
    setChatInput(text);
    // Focus or submit directly
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { sender: 'user', text: text }]);
      setIsTyping(true);
      setTimeout(() => {
        let reply = "Python is dynamically typed. This means you do not declare variable types; the interpreter binds the variable name to its value type at runtime.";
        if (text.includes("mutable")) {
          reply = "Mutable objects (like Lists, Dictionaries, and Sets) can have their content changed. Immutable objects (like Integers, Floats, Strings, and Tuples) cannot be modified after creation.";
        }
        setChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
        setIsTyping(false);
      }, 1000);
    }, 50);
  };

  return (
    <div className="relative min-h-screen bg-surface-dark text-text overflow-hidden">
      
      {/* ─── Animated Hero Mesh Blobs ────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-red-500/5 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-1/4 -right-20 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-[100px]" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-10 left-10 h-[450px] w-[450px] rounded-full bg-rose-500/5 blur-[130px] animate-float" />
        
        {/* Subtle grid pattern for tech look */}
        <div className="absolute inset-0 grid-overlay opacity-[0.4]" />
      </div>

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8 lg:pt-24 text-center">
        <div className="mx-auto max-w-4xl">
          {/* Sparkle badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary animate-fade-in-down">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Active Learning</span>
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-text">Turn Any YouTube Video Into</span>
            <br />
            <span className="inline-block mt-2 h-[80px] sm:h-[90px] lg:h-[110px] animated-gradient-text">
              {heroTitles[heroTitleIndex]}
            </span>
          </h1>

          {/* Subtext */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-text-muted sm:text-lg lg:text-xl font-medium leading-relaxed">
            Stop passive watching. Input a YouTube URL and let LearnTube construct structured study notes, flashcards, automated quizzes, and a responsive RAG chatbot instantly.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/signup" className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white shadow-lg btn-glow-primary flex items-center justify-center gap-2 group transition-all duration-300">
              Get Started for Free
              <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#playground" className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-text bg-white border border-surface-light hover:bg-surface-light hover:border-surface-lighter flex items-center justify-center gap-2 transition-all duration-200">
              Interactive Preview
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="mt-12 flex justify-center items-center gap-8 text-xs font-semibold text-text-dim">
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" /> No credit card required
            </div>
            <div className="h-4 w-px bg-surface-light" />
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" /> Instant AI processing
            </div>
          </div>
        </div>
      </section>

      {/* ─── Interactive Playground Section (The WOW Factor) ──────────────── */}
      <section id="playground" className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Live Experience</h2>
          <p className="mt-2 text-3xl font-extrabold text-text sm:text-4xl">Try the Interactive Workspace</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-text-muted">
            See exactly how LearnTube structures a programming video. Interact with actual widgets below to test our dynamic study companions.
          </p>
        </div>

        {/* Playground Shell */}
        <div className="glass-strong border border-surface-light/80 overflow-hidden shadow-2xl rounded-2xl bg-white flex flex-col">
          {/* Header Bar */}
          <div className="border-b border-surface-light px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-dark bg-opacity-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#E11D48] flex h-8 w-8 items-center justify-center rounded-lg shadow-sm">
                <Play className="h-4 w-4 text-white fill-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text">Learn Python in 10 Minutes</h3>
                <p className="text-[11px] text-text-dim">Source: YouTube Tutorial &bull; 10:24 duration</p>
              </div>
            </div>
            {/* Simulation pill */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-green-500/10 text-green-700 border border-green-200">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" /> Live Simulation
            </span>
          </div>

          {/* Playground Tabs */}
          <div className="flex border-b border-surface-light bg-surface-dark bg-opacity-10 p-1.5 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('notes'); setIsFlipped(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'notes' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              AI Notes Summary
            </button>
            <button
              onClick={() => { setActiveTab('flashcards'); setIsFlipped(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'flashcards' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Flashcards Practice
            </button>
            <button
              onClick={() => { setActiveTab('quiz'); setIsFlipped(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'quiz' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              <Brain className="h-3.5 w-3.5" />
              Interactive Quiz
            </button>
            <button
              onClick={() => { setActiveTab('chat'); setIsFlipped(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'chat' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              AI RAG Chat
            </button>
          </div>

          {/* Playground Content Area */}
          <div className="p-6 bg-white min-h-[360px] flex flex-col justify-between">
            
            {/* 1. NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Sparkles className="h-4 w-4" /> AI Generated Summary & Takeaways
                </div>
                
                {/* Chapters */}
                <div className="space-y-3">
                  <div className="p-3 border border-surface-light rounded-xl hover:border-primary/20 hover:bg-surface-dark/5 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-text">1. Setup & Environment</span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg">
                        <Clock className="h-3 w-3" /> 00:00 - 02:15
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-text-muted leading-relaxed">
                      Download Python and set up your editor (like VS Code). Learn about interpreter versus compiler concepts. Test installation with the standard entry command `print("Hello World")`.
                    </p>
                  </div>

                  <div className="p-3 border border-surface-light rounded-xl hover:border-primary/20 hover:bg-surface-dark/5 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-text">2. Variables & Dynamic Types</span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg">
                        <Clock className="h-3 w-3" /> 02:15 - 05:10
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-text-muted leading-relaxed">
                      Understand variables as value storage containers. In Python, data types are dynamically inferred at runtime, meaning declarations like `int` or `string` are omitted.
                    </p>
                  </div>

                  <div className="p-3 border border-surface-light rounded-xl hover:border-primary/20 hover:bg-surface-dark/5 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-text">3. Control Flow (Loops & Conditionals)</span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg">
                        <Clock className="h-3 w-3" /> 05:10 - 08:05
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-text-muted leading-relaxed">
                      Controlling code execution via `if`, `elif`, and `else`. Implement iterative actions using `for` loops (best with arrays or ranges) and `while` loops for Boolean checks.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. FLASHCARDS TAB */}
            {activeTab === 'flashcards' && (
              <div className="flex flex-col items-center justify-center space-y-6 animate-fade-in py-4">
                <div className="text-xs font-semibold text-text-muted">
                  Card {currentCardIndex + 1} of {PLAYGROUND_FLASHCARDS.length} &bull; Click card to flip
                </div>
                
                {/* 3D Flip Card Container */}
                <div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full max-w-sm h-48 cursor-pointer perspective-1000"
                >
                  <div className={`relative w-full h-full text-center transition-transform duration-500 preserve-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}>
                    {/* Front */}
                    <div className="absolute inset-0 w-full h-full backface-hidden border border-surface-light rounded-2xl p-6 bg-surface-dark/10 shadow-sm flex flex-col justify-between items-center">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/5 px-2 py-0.5 rounded-full">Front</span>
                      <p className="text-sm font-bold text-text px-4">{PLAYGROUND_FLASHCARDS[currentCardIndex].front}</p>
                      <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Click to Flip</span>
                    </div>
                    
                    {/* Back */}
                    <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 border border-primary/20 rounded-2xl p-6 bg-red-50/20 shadow-sm flex flex-col justify-between items-center">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Answer / Explanation</span>
                      <p className="text-xs text-text-muted px-4 leading-relaxed font-semibold">{PLAYGROUND_FLASHCARDS[currentCardIndex].back}</p>
                      <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Click to Flip Back</span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  <button 
                    disabled={currentCardIndex === 0}
                    onClick={() => {
                      setCurrentCardIndex(c => c - 1);
                      setIsFlipped(false);
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-surface-light text-xs font-bold text-text disabled:opacity-40 hover:bg-surface-light transition-all"
                  >
                    Prev
                  </button>
                  <button 
                    disabled={currentCardIndex === PLAYGROUND_FLASHCARDS.length - 1}
                    onClick={() => {
                      setCurrentCardIndex(c => c + 1);
                      setIsFlipped(false);
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-surface-light text-xs font-bold text-text disabled:opacity-40 hover:bg-surface-light transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* 3. QUIZ TAB */}
            {activeTab === 'quiz' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <HelpCircle className="h-4 w-4" /> Practice Quiz Question
                </div>
                
                <h4 className="text-sm font-bold text-text leading-relaxed">
                  {PLAYGROUND_QUIZ.question}
                </h4>

                <div className="grid gap-2.5">
                  {PLAYGROUND_QUIZ.options.map((opt) => {
                    const isSelected = selectedQuizOption === opt.key;
                    let borderClass = "border-surface-light hover:border-primary/20";
                    let bgClass = "bg-white";

                    if (quizSubmitted) {
                      if (opt.isCorrect) {
                        borderClass = "border-green-500 bg-green-50/30";
                      } else if (isSelected) {
                        borderClass = "border-red-500 bg-red-50/30";
                      }
                    } else if (isSelected) {
                      borderClass = "border-[#E11D48] bg-red-50/10";
                    }

                    return (
                      <button
                        key={opt.key}
                        disabled={quizSubmitted}
                        onClick={() => setSelectedQuizOption(opt.key)}
                        className={`flex items-center gap-3 border rounded-xl p-3 text-left text-xs font-bold transition-all ${borderClass} ${bgClass}`}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border text-[11px] font-extrabold ${
                          isSelected ? 'bg-primary text-white border-primary' : 'border-surface-light text-text-dim'
                        }`}>
                          {opt.key}
                        </span>
                        <span className="text-text">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {quizSubmitted ? (
                  <div className="p-3 bg-surface-dark/10 border border-surface-light rounded-xl text-xs leading-relaxed text-text-muted">
                    <span className="font-bold text-text block mb-1">Explanation:</span>
                    {PLAYGROUND_QUIZ.explanation}
                    <button 
                      onClick={() => {
                        setSelectedQuizOption(null);
                        setQuizSubmitted(false);
                      }}
                      className="mt-2 text-xs font-bold text-primary block hover:underline"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    disabled={!selectedQuizOption}
                    className="btn-glow-primary px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-40"
                  >
                    Submit Answer
                  </button>
                )}
              </div>
            )}

            {/* 4. CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="space-y-4 animate-fade-in flex flex-col justify-between h-[360px]">
                {/* Chat Message Scroll */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin max-h-[240px]">
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-xs font-semibold leading-relaxed shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-surface-dark/15 text-text border border-surface-light/70'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-surface-dark/15 border border-surface-light/70 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-text-dim typing-dot" />
                        <span className="h-1.5 w-1.5 rounded-full bg-text-dim typing-dot delay-100" />
                        <span className="h-1.5 w-1.5 rounded-full bg-text-dim typing-dot delay-200" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pre-defined/Suggested prompts */}
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => handleSuggestedQuestion("Is Python dynamically typed?")}
                    className="text-[10px] font-bold text-text-muted hover:text-primary bg-surface-dark/5 hover:bg-primary/5 px-2.5 py-1 border border-surface-light/80 rounded-full transition-all"
                  >
                    "Is Python dynamically typed?"
                  </button>
                  <button 
                    onClick={() => handleSuggestedQuestion("Explain List vs Tuple mutability")}
                    className="text-[10px] font-bold text-text-muted hover:text-primary bg-surface-dark/5 hover:bg-primary/5 px-2.5 py-1 border border-surface-light/80 rounded-full transition-all"
                  >
                    "Explain List vs Tuple mutability"
                  </button>
                </div>

                {/* Chat Form */}
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question about the video transcript..."
                    className="flex-1 border border-surface-light/80 rounded-xl px-3 py-2 text-xs text-text placeholder-text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-red-100 font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={isTyping || !chatInput.trim()}
                    className="bg-primary hover:bg-primary-dark text-white p-2.5 rounded-xl transition-all shadow-sm disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* Bottom Redirect Promo */}
            <div className="border-t border-surface-light/70 pt-4 mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span className="text-[11px] font-semibold text-text-muted">
                Create an account to upload your own custom YouTube videos and unlock full saving capability.
              </span>
              <Link to="/signup" className="text-xs font-bold text-primary flex items-center gap-0.5 hover:underline whitespace-nowrap">
                Start processing videos <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            
          </div>
        </div>
      </section>

      {/* ─── Features grid Section ───────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-surface-light/30">
        <div className="mb-12 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Comprehensive Features</h2>
          <p className="mt-2 text-3xl font-extrabold text-text sm:text-4xl">Everything required to master material</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-text-muted">
            Maximize learning output in a fraction of the time with our structured AI tools.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-xl bg-red-50 p-3 border border-red-100/50">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-text">Markdown Summaries</h3>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-text-muted">
                Read beautifully structured summaries containing headers, code blocks, definitions, and logical chapters mapped precisely to timestamps.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-xl bg-red-50 p-3 border border-red-100/50">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-text">Spaced-Repetition Cards</h3>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-text-muted">
                Flip dynamically generated flashcards with core definitions on the back. Quiz yourself repeatedly to cement retention.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-xl bg-red-50 p-3 border border-red-100/50">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-text">Smart Mock Quizzes</h3>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-text-muted">
                Self-test with multiple choice questions. Receive immediate grading and clear rational explanations for correct answers.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-xl bg-red-50 p-3 border border-red-100/50">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-text">AI Retrieval Chat</h3>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-text-muted">
                Leverage RAG algorithms to ask context-aware questions. AI reviews the entire transcript to output highly specific, accurate responses.
              </p>
            </div>
          </div>

          {/* Card 5 */}
          <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-xl bg-red-50 p-3 border border-red-100/50">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-text">Linked Timestamps</h3>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-text-muted">
                Jump to specific video timings. Click summaries or chat locations to automatically navigate the player straight to that moment.
              </p>
            </div>
          </div>

          {/* Card 6 */}
          <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg flex flex-col justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-xl bg-red-50 p-3 border border-red-100/50">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-text">Personal Library</h3>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-text-muted">
                Keep an organized repository of processed tutorials, lectures, and documentaries. Access and review your materials anytime, anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Workflow Step Timeline Section ──────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 border-t border-surface-light/30">
        <div className="mb-14 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">How it Works</h2>
          <p className="mt-2 text-3xl font-extrabold text-text sm:text-4xl">Three steps to mastery</p>
        </div>

        <div className="relative">
          {/* Connector Line */}
          <div className="absolute top-12 left-6 md:left-1/2 md:-ml-0.5 h-[calc(100%-100px)] w-0.5 bg-surface-light" />

          {/* Step 1 */}
          <div className="relative flex flex-col md:flex-row items-start md:justify-between mb-12">
            <div className="flex items-center gap-4 md:w-5/12 md:justify-end md:pr-8">
              <div className="md:text-right">
                <h3 className="text-sm font-bold text-text">1. Input URL</h3>
                <p className="mt-1 text-xs text-text-muted font-semibold">Paste any YouTube lecture or tutorial link directly into our engine.</p>
              </div>
            </div>
            {/* Timeline center bubble */}
            <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-extrabold shadow-md z-15">
              1
            </div>
            <div className="md:w-5/12 pl-16 md:pl-8 mt-2 md:mt-0 text-xs text-text-dim font-bold">
              Youtube Video Integration &bull; Autolink transcript data
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex flex-col md:flex-row items-start md:justify-between mb-12">
            {/* Desktop spacer */}
            <div className="md:w-5/12 hidden md:block" />
            {/* Timeline center bubble */}
            <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-extrabold shadow-md z-15">
              2
            </div>
            <div className="flex items-center gap-4 md:w-5/12 md:pl-8">
              <div>
                <h3 className="text-sm font-bold text-text">2. AI Analysis</h3>
                <p className="mt-1 text-xs text-text-muted font-semibold">Our language model processes the speech context, indexes timestamps, and constructs quizzes.</p>
              </div>
            </div>
            {/* Timeline left label */}
            <div className="absolute left-16 md:left-auto md:right-1/2 md:pr-8 md:text-right mt-2 md:mt-0 text-xs text-text-dim font-bold md:w-5/12">
              Fast processing engine &bull; Formats concepts automatically
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex flex-col md:flex-row items-start md:justify-between">
            <div className="flex items-center gap-4 md:w-5/12 md:justify-end md:pr-8">
              <div className="md:text-right">
                <h3 className="text-sm font-bold text-text">3. Interact & Study</h3>
                <p className="mt-1 text-xs text-text-muted font-semibold">Practice with flashcards, solve customized quizzes, and chat with your personalized AI tutor.</p>
              </div>
            </div>
            {/* Timeline center bubble */}
            <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-extrabold shadow-md z-15">
              3
            </div>
            <div className="md:w-5/12 pl-16 md:pl-8 mt-2 md:mt-0 text-xs text-text-dim font-bold">
              Retain notes forever &bull; Excel in exams and interviews
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials Section ───────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 border-t border-surface-light/30">
        <div className="mb-12 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">User Reviews</h2>
          <p className="mt-2 text-3xl font-extrabold text-text sm:text-4xl">Loved by students & developers</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Review 1 */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex gap-1 text-amber-500 mb-3">
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
              </div>
              <p className="text-xs leading-relaxed text-text-muted font-semibold italic">
                "LearnTube transformed the way I study for college. Instead of re-watching 2-hour software tutorials, I paste the link, study the AI notes in 5 minutes, and take the quiz. Absolute game changer."
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-light flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                JS
              </div>
              <div>
                <h4 className="text-xs font-bold text-text">Jason S.</h4>
                <p className="text-[10px] text-text-dim">Computer Science Major</p>
              </div>
            </div>
          </div>

          {/* Review 2 */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex gap-1 text-amber-500 mb-3">
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
              </div>
              <p className="text-xs leading-relaxed text-text-muted font-semibold italic">
                "As a self-taught programmer, YouTube is my university. But asking the video questions was impossible until LearnTube. The RAG-powered chatbot references transcripts perfectly, citing timestamps."
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-light flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                AM
              </div>
              <div>
                <h4 className="text-xs font-bold text-text">Alina M.</h4>
                <p className="text-[10px] text-text-dim">Frontend Developer</p>
              </div>
            </div>
          </div>

          {/* Review 3 */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex gap-1 text-amber-500 mb-3">
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
                <Star className="h-4 w-4 fill-amber-500" />
              </div>
              <p className="text-xs leading-relaxed text-text-muted font-semibold italic">
                "Spaced repetition via the custom flashcards section helped me pass my AWS certification. Creating cards by hand takes hours, but this app compiles them instantly directly from study channels."
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-light flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                DK
              </div>
              <div>
                <h4 className="text-xs font-bold text-text">Dmitri K.</h4>
                <p className="text-[10px] text-text-dim">DevOps Engineer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Frequently Asked Questions Section ─────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 border-t border-surface-light/30">
        <div className="mb-12 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Support</h2>
          <p className="mt-2 text-3xl font-extrabold text-text sm:text-4xl">Common Questions</p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => {
            const isOpen = activeFaq === i;
            return (
              <div 
                key={i} 
                className="glass-panel rounded-xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : i)}
                  className="w-full flex justify-between items-center px-6 py-4 text-left font-bold text-xs sm:text-sm text-text focus:outline-none"
                >
                  <span>{faq.question}</span>
                  <ChevronRight className={`h-4 w-4 text-text-dim transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                
                <div className={`transition-all duration-300 ${isOpen ? 'max-h-40 border-t border-surface-light' : 'max-h-0'}`}>
                  <p className="p-6 text-xs text-text-muted leading-relaxed font-semibold">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Final CTA Banner ────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-20 text-center shadow-2xl sm:px-12 sm:py-24 border border-surface-lighter/10">
          {/* Decorative shapes inside banner */}
          <div className="absolute inset-0 z-0 opacity-[0.1] grid-overlay-dark" />
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-[80px]" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-[80px]" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to supercharge your retention?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-xs sm:text-sm font-semibold text-slate-300 leading-relaxed">
              Join thousands of learners extracting deep knowledge from video material. Unlock study tools, personal transcripts, and flashcards instantly.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                to="/signup"
                className="rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-lg btn-glow-primary group flex items-center gap-2"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
