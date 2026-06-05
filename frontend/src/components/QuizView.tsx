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
    'border-surface-light/30 hover:border-primary/40 hover:bg-surface-light/20',
  selected: 'border-primary/50 bg-primary/10',
  correct: 'border-success/50 bg-success/10',
  incorrect: 'border-error/50 bg-error/10',
};

export default function QuizView({ videoId }: QuizViewProps) {
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

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await generateQuiz(videoId);
      setQuiz(data);
      resetQuiz();
    } catch {
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setScore(0);
    setShowResults(false);
    setAnsweredQuestions([]);
  };

  /**
   * Normalize correct_answer to 'option_x' format.
   * The backend/AI may return 'a', 'A', 'option_a', or 'option_A' —
   * we always compare against the OPTION_KEYS ('option_a' … 'option_d').
   */
  const normalizeAnswer = (raw: string): string => {
    const lower = raw.toLowerCase().trim();
    // Already in option_x format
    if (lower.startsWith('option_')) return lower;
    // Single letter: 'a' → 'option_a'
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
      <div className="glass rounded-2xl p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-text-muted">Loading quiz...</span>
        </div>
      </div>
    );
  }

  if ((!quiz || quiz.questions.length === 0) && !generating) {
    return (
      <div className="glass animate-scale-in rounded-2xl py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <Brain className="h-8 w-8 text-success" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-text">
          Generate Quiz
        </h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-text-muted">
          Test your understanding with AI-generated multiple-choice questions
          based on the video content.
        </p>
        {error && (
          <div className="animate-fade-in-down mx-auto mb-4 flex max-w-md items-center justify-center gap-2 text-sm text-error-light">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        <button
          onClick={handleGenerate}
          className="gradient-primary animate-pulse-glow inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
        >
          <Sparkles className="h-4 w-4" />
          Generate Quiz
        </button>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="glass rounded-2xl py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <Loader2 className="h-8 w-8 animate-spin text-success" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-text">
          Generating Quiz...
        </h3>
        <p className="text-sm text-text-muted">
          Creating questions from video content.
        </p>
        <div className="mx-auto mt-6 h-1 w-48 overflow-hidden rounded-full bg-surface-light/30">
          <div
            className="h-full rounded-full bg-gradient-to-r from-success to-accent"
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

  // Results screen
  if (showResults) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const getGrade = () => {
      if (percentage >= 90) return { label: 'Excellent!', color: 'text-success' };
      if (percentage >= 70) return { label: 'Great Job!', color: 'text-accent' };
      if (percentage >= 50) return { label: 'Good Effort!', color: 'text-warning' };
      return { label: 'Keep Learning!', color: 'text-error-light' };
    };
    const grade = getGrade();

    return (
      <div className="glass animate-scale-in rounded-2xl p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
            <Trophy className="h-10 w-10 text-warning" />
          </div>
          <h2 className={`mb-1 text-2xl font-bold ${grade.color}`}>
            {grade.label}
          </h2>
          <p className="text-4xl font-bold text-text">
            {score}/{quiz.questions.length}
          </p>
          <p className="mt-1 text-sm text-text-muted">{percentage}% correct</p>

          {/* Progress ring */}
          <div className="mx-auto my-6 h-2 w-48 overflow-hidden rounded-full bg-surface-light/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={resetQuiz}
              className="flex items-center gap-2 rounded-xl border border-surface-light/30 px-5 py-2.5 text-sm font-medium text-text-muted transition-all hover:border-primary/30 hover:bg-surface-light/30 hover:text-text"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </button>
            <button
              onClick={handleGenerate}
              className="gradient-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25"
            >
              <Sparkles className="h-4 w-4" />
              New Quiz
            </button>
          </div>
        </div>

        {/* Review */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-muted">Review</h3>
          {answeredQuestions.map((aq, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 ${
                aq.correct
                  ? 'border-success/20 bg-success/5'
                  : 'border-error/20 bg-error/5'
              }`}
            >
              <div className="mb-2 flex items-start gap-2">
                {aq.correct ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                )}
                <p className="text-sm font-medium text-text">
                  {aq.question.question}
                </p>
              </div>
              {!aq.correct && (
                <p className="ml-6 text-xs text-text-muted">
                  Correct:{' '}
                  {aq.question[
                    aq.question.correct_answer as keyof QuizQuestion
                  ] || aq.question.correct_answer}
                </p>
              )}
              {aq.question.explanation && (
                <p className="ml-6 mt-1 text-xs italic text-text-dim">
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
    <div className="glass animate-fade-in rounded-2xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-success" />
          <h3 className="text-sm font-semibold text-text">Quiz</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            Score: {score}
          </span>
          <span className="rounded-full bg-surface-light/50 px-3 py-1 text-xs font-medium text-text-muted">
            {currentQuestion + 1} / {quiz.questions.length}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 h-1 overflow-hidden rounded-full bg-surface-light/30">
        <div
          className="h-full rounded-full bg-gradient-to-r from-success to-accent transition-all duration-500 ease-out"
          style={{
            width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Question */}
      <div
        className={`mb-6 ${animateWrong ? 'animate-shake' : ''}`}
      >
        <p className="text-lg font-semibold leading-relaxed text-text">
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
              colorClass = 'border-surface-light/20 opacity-50';
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
                hasAnswered && isCorrect ? 'animate-bounce-in' : ''
              } disabled:cursor-default`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  hasAnswered && isCorrect
                    ? 'bg-success/20 text-success'
                    : hasAnswered && isSelected && !isCorrect
                    ? 'bg-error/20 text-error'
                    : 'bg-surface-light/50 text-text-muted'
                }`}
              >
                {OPTION_LABELS[i]}
              </span>
              <span className="pt-0.5 text-sm text-text-muted">{value}</span>
              {hasAnswered && isCorrect && (
                <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-success" />
              )}
              {hasAnswered && isSelected && !isCorrect && (
                <XCircle className="ml-auto h-5 w-5 shrink-0 text-error" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {hasAnswered && question.explanation && (
        <div className="animate-fade-in mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
          <p className="text-xs font-semibold uppercase text-accent">
            Explanation
          </p>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">
            {question.explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      {hasAnswered && (
        <div className="animate-fade-in flex justify-end">
          <button
            onClick={handleNext}
            className="gradient-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
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
