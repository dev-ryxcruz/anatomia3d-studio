import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import {
  ANATOMICAL_SYSTEMS,
  AnatomicalStructure,
} from '../data/anatomyCatalog';
import { PersistedQuizStats } from '../hooks/useQuizAndFavorites';

interface QuizOverlayCardProps {
  quizActive: boolean;
  quizTargetStructure: AnatomicalStructure | null;
  quizScore: {
    correct: number;
    total: number;
    streak: number;
  };
  quizFeedback: {
    status: 'correct' | 'wrong' | null;
    message: string;
  };
  persistedStats: PersistedQuizStats;
  onSkipQuestion: () => void;
  onResetPersistedStats: () => void;
}

export const QuizOverlayCard: React.FC<QuizOverlayCardProps> = ({
  quizActive,
  quizTargetStructure,
  quizScore,
  quizFeedback,
  persistedStats,
  onSkipQuestion,
  onResetPersistedStats,
}) => {
  const [showMasteryDetails, setShowMasteryDetails] = useState(true);

  if (!quizActive || !quizTargetStructure) return null;

  const globalAccuracy =
    persistedStats.totalAnswered > 0
      ? Math.round(
          (persistedStats.totalCorrect / persistedStats.totalAnswered) * 100
        )
      : 0;

  return (
    <div className="quiz-overlay-card">
      <div className="quiz-header-row">
        <span className="quiz-badge">
          <Sparkles size={14} /> MODO QUIZ ANATÔMICO (.GLB REAL)
        </span>
        <div className="quiz-stats">
          <span>
            Sessão: <strong>{quizScore.correct}</strong>/{quizScore.total}
          </span>
          <span>
            Sequência: <strong>{quizScore.streak}🔥</strong>
          </span>
          <span
            className="quiz-highscore-pill"
            title="Melhor pontuação salva neste dispositivo (localStorage)"
          >
            <Trophy size={12} /> Recorde: <strong>{persistedStats.highScore}</strong>
          </span>
          <button
            type="button"
            className="quiz-skip-btn"
            onClick={onSkipQuestion}
          >
            Pular
          </button>
        </div>
      </div>

      <div className="quiz-prompt">
        Clique no modelo 3D sobre a estrutura:{' '}
        <strong>{quizTargetStructure.name}</strong>{' '}
        <em>({quizTargetStructure.latinName})</em>
      </div>

      {quizFeedback.status && (
        <div
          className={`quiz-feedback ${
            quizFeedback.status === 'correct'
              ? 'quiz-feedback-ok'
              : 'quiz-feedback-err'
          }`}
        >
          {quizFeedback.status === 'correct' ? (
            <CheckCircle2 size={16} />
          ) : (
            <XCircle size={16} />
          )}
          <span>{quizFeedback.message}</span>
        </div>
      )}

      {/* Persistent Student Mastery Statistics by Anatomical System */}
      <div className="quiz-mastery-box">
        <div className="quiz-mastery-header">
          <button
            type="button"
            className="quiz-mastery-toggle"
            onClick={() => setShowMasteryDetails((v) => !v)}
          >
            <BarChart3 size={13} className="text-cyan" />
            <span>
              Domínio do Estudante: <strong>{globalAccuracy}%</strong> global (
              {persistedStats.totalCorrect}/{persistedStats.totalAnswered}) •
              Melhor Sequência: <strong>{persistedStats.bestStreak}🔥</strong>
            </span>
            {showMasteryDetails ? (
              <ChevronUp size={13} />
            ) : (
              <ChevronDown size={13} />
            )}
          </button>

          {persistedStats.totalAnswered > 0 && (
            <button
              type="button"
              className="quiz-reset-stats-btn"
              onClick={onResetPersistedStats}
              title="Zerar histórico de estatísticas salvo no navegador"
            >
              <RotateCcw size={11} /> Zerar
            </button>
          )}
        </div>

        {showMasteryDetails && (
          <div className="quiz-system-mastery-grid">
            {ANATOMICAL_SYSTEMS.map((sys) => {
              const stat = persistedStats.bySystem[sys.id] ?? {
                correct: 0,
                total: 0,
              };
              const pct =
                stat.total > 0
                  ? Math.round((stat.correct / stat.total) * 100)
                  : 0;
              return (
                <div
                  key={sys.id}
                  className="quiz-system-stat-chip"
                  title={`${sys.name}: ${stat.correct} acertos em ${stat.total} tentativas (${pct}%)`}
                >
                  <div className="quiz-system-stat-top">
                    <span
                      className="system-swatch"
                      style={{ backgroundColor: sys.color }}
                    />
                    <span className="quiz-system-short">
                      {sys.name.replace('Sistema ', '')}
                    </span>
                    <span className="quiz-system-pct">
                      {stat.total > 0 ? `${pct}%` : '—'}
                    </span>
                  </div>
                  <div className="quiz-system-bar-track">
                    <div
                      className="quiz-system-bar-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: sys.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
