import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Trophy,
  RotateCcw,
  Brain,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { getQuiz, generateQuiz } from '../api/client';
import type { Quiz, QuizQuestion } from '../types';

interface QuizViewProps {
  videoId: string;
  isSidebar?: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const OPTION_KEYS = [
  'option_a',
  'option_b',
  'option_c',
  'option_d',
] as const;

const OPTION_COLORS = {
  default:
    'border-surface-light hover:border-[#E11D48] hover:bg-surface-light text-text',
  selected: 'border-[#E11D48] bg-red-50/50 text-text',
  correct: 'border-[#15803D] bg-green-50/60 text-text',
  incorrect: 'border-red-300 bg-red-50/40 text-text',
};

export default function QuizView({ videoId, isSidebar }: QuizViewProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<
    { question: QuizQuestion; selected: string; correct: boolean }[]
  >([]);
  const [animateWrong, setAnimateWrong] = useState(false);

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuiz(videoId);
      setQuiz(data);
    } catch {
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleGenerate = async (force: boolean = false) => {
    setGenerating(true);
    setError(null);
    try {
      const data = await generateQuiz(videoId, force);
      setQuiz(data);
      resetQuiz();
    } catch {
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleNewQuiz = () => handleGenerate(true);

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setScore(0);
    setShowResults(false);
    setAnsweredQuestions([]);
  };

  const normalizeAnswer = (raw: string): string => {
    const lower = raw.toLowerCase().trim();
    if (lower.startsWith('option_')) return lower;
    if (['a', 'b', 'c', 'd'].includes(lower)) return `option_${lower}`;
    return lower;
  };

  const handleSelectAnswer = (optionKey: string) => {
    if (hasAnswered || !quiz) return;

    setSelectedAnswer(optionKey);
    setHasAnswered(true);

    const question = quiz.questions[currentQuestion];
    const isCorrect = optionKey === normalizeAnswer(question.correct_answer);

    if (isCorrect) {
      setScore((s) => s + 1);
    } else {
      setAnimateWrong(true);
      setTimeout(() => setAnimateWrong(false), 500);
    }

    setAnsweredQuestions((prev) => [
      ...prev,
      { question, selected: optionKey, correct: isCorrect },
    ]);
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((q) => q + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  if (loading) {
    return (
      <div className={isSidebar ? "p-4 bg-white" : "glass p-8 bg-white border border-surface-light"}>
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#E11D48]" />
          <span className="text-sm font-medium text-text-muted">Loading quiz...</span>
        </div>
      </div>
    );
  }

  if ((!quiz || quiz.questions.length === 0) && !generating) {
    return (
      <div className={isSidebar ? "animate-scale-in p-4 text-center bg-white" : "glass animate-scale-in p-10 text-center bg-white border border-surface-light"}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <Brain className="h-8 w-8 text-[#E11D48]" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-text">
          Generate Understanding Quiz
        </h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-text-muted">
          Test your understanding with AI-generated multiple-choice questions
          based on the video content.
        </p>
        {error && (
          <div className="animate-fade-in-down mx-auto mb-4 flex max-w-md items-center justify-center gap-2 text-sm text-red-600 font-medium">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        <button
          onClick={() => handleGenerate(false)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white px-6 py-3 text-sm font-semibold shadow-md transition-all duration-200"
        >
          <Sparkles className="h-4 w-4" />
          Generate Quiz
        </button>
      </div>
    );
  }

  if (generating) {
    return (
      <div className={isSidebar ? "p-4 text-center bg-white" : "glass p-12 text-center bg-white border border-surface-light"}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <Loader2 className="h-8 w-8 animate-spin text-[#E11D48]" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-text">
          Generating Quiz...
        </h3>
        <p className="text-sm text-text-muted">
          Creating questions from video content.
        </p>
        <div className="mx-auto mt-6 h-1 w-48 overflow-hidden rounded-full bg-surface-light">
          <div
            className="h-full rounded-full bg-[#E11D48]"
            style={{
              animation: 'shimmer 1.5s ease-in-out infinite',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  if (showResults) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const getGrade = () => {
      if (percentage >= 90) return { label: 'Excellent!', color: 'text-[#15803D]' };
      if (percentage >= 70) return { label: 'Great Job!', color: 'text-[#E11D48]' };
      if (percentage >= 50) return { label: 'Good Effort!', color: 'text-amber-600' };
      return { label: 'Keep Learning!', color: 'text-red-500' };
    };
    const grade = getGrade();

    return (
      <div className={isSidebar ? "animate-scale-in p-4 bg-white overflow-y-auto max-h-[500px]" : "glass animate-scale-in p-8 bg-white border border-surface-light"}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <Trophy className="h-10 w-10 text-amber-500" />
          </div>
          <h2 className={`mb-1 text-2xl font-bold ${grade.color}`}>
            {grade.label}
          </h2>
          <p className="text-4xl font-bold text-text">
            {score}/{quiz.questions.length}
          </p>
          <p className="mt-1 text-sm font-medium text-text-muted">{percentage}% correct</p>

          {/* Progress bar */}
          <div className="mx-auto my-6 h-2 w-48 overflow-hidden rounded-full bg-surface-light">
            <div
              className="h-full rounded-full bg-[#15803D]"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={resetQuiz}
              className="flex items-center gap-2 rounded-xl border border-surface-light bg-white px-5 py-2.5 text-sm font-semibold text-text hover:bg-surface-light transition-all duration-150"
            >
              <RotateCcw className="h-4 w-4 text-text-muted" />
              Retry Quiz
            </button>
            <button
              onClick={handleNewQuiz}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white px-5 py-2.5 text-sm font-semibold shadow-md transition-all duration-200"
            >
              <Sparkles className="h-4 w-4" />
              New Quiz
            </button>
          </div>
        </div>

        {/* Review */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-surface-light pb-2">
            Review Questions
          </h3>
          {answeredQuestions.map((aq, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 ${
                aq.correct
                  ? 'border-green-200 bg-green-50/20'
                  : 'border-red-200 bg-red-50/20'
              }`}
            >
              <div className="mb-2 flex items-start gap-2">
                {aq.correct ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#15803D]" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                )}
                <p className="text-sm font-bold text-text">
                  {aq.question.question}
                </p>
              </div>
              {!aq.correct && (
                <p className="ml-6 text-xs text-text-muted font-medium">
                  Correct Answer:{' '}
                  <span className="text-[#15803D] font-bold">
                    {aq.question[
                      aq.question.correct_answer as keyof QuizQuestion
                    ] || aq.question.correct_answer}
                  </span>
                </p>
              )}
              {aq.question.explanation && (
                <p className="ml-6 mt-2 text-xs italic text-text-muted bg-white/60 p-2.5 rounded-lg border border-surface-light">
                  {aq.question.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <div className={isSidebar ? "flex flex-col h-full bg-white select-none animate-fade-in p-4 overflow-y-auto max-h-[500px]" : "glass animate-fade-in p-6 bg-white border border-surface-light"}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#E11D48]" />
          <h3 className="text-sm font-bold text-text uppercase tracking-wider">Lesson Quiz</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-bold text-[#15803D]">
            Score: {score}
          </span>
          <span className="rounded-full bg-surface-light border border-surface-lighter px-3 py-1 text-xs font-semibold text-text-muted">
            {currentQuestion + 1} / {quiz.questions.length}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-surface-light">
        <div
          className="h-full rounded-full bg-[#E11D48] transition-all duration-300 ease-out"
          style={{
            width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Question */}
      <div className={`mb-6 ${animateWrong ? 'animate-shake' : ''}`}>
        <p className="text-[17px] font-bold leading-relaxed text-text">
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div className="mb-6 space-y-3">
        {OPTION_KEYS.map((key, i) => {
          const value = question[key];
          const isSelected = selectedAnswer === key;
          const isCorrect = normalizeAnswer(question.correct_answer) === key;

          let colorClass = OPTION_COLORS.default;
          if (hasAnswered) {
            if (isCorrect) {
              colorClass = OPTION_COLORS.correct;
            } else if (isSelected && !isCorrect) {
              colorClass = OPTION_COLORS.incorrect;
            } else {
              colorClass = 'border-surface-light opacity-50 text-text-muted';
            }
          } else if (isSelected) {
            colorClass = OPTION_COLORS.selected;
          }

          return (
            <button
              key={key}
              onClick={() => handleSelectAnswer(key)}
              disabled={hasAnswered}
              className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${colorClass} ${
                hasAnswered && isCorrect ? 'animate-bounce-in border-[#15803D]' : ''
              } disabled:cursor-default`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  hasAnswered && isCorrect
                    ? 'bg-green-100 text-[#15803D]'
                    : hasAnswered && isSelected && !isCorrect
                    ? 'bg-red-100 text-red-600'
                    : isSelected
                    ? 'bg-red-100 text-[#E11D48]'
                    : 'bg-surface-light text-text-muted'
                }`}
              >
                {OPTION_LABELS[i]}
              </span>
              <span className="pt-0.5 text-sm font-semibold">{value}</span>
              {hasAnswered && isCorrect && (
                <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-[#15803D] mt-0.5" />
              )}
              {hasAnswered && isSelected && !isCorrect && (
                <XCircle className="ml-auto h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {hasAnswered && question.explanation && (
        <div className="animate-fade-in mb-6 rounded-xl border border-surface-light bg-surface-dark bg-opacity-20 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Explanation
          </p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-text">
            {question.explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      {hasAnswered && (
        <div className="animate-fade-in flex justify-end">
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white px-5 py-2.5 text-sm font-semibold shadow-md transition-all duration-250"
          >
            {currentQuestion < quiz.questions.length - 1
              ? 'Next Question'
              : 'See Results'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
