"use client";

import { useEffect, useMemo, useState } from "react";

type Exercise = {
  name: string;
  sets: string;
  reps: string;
  technique: string;
  cadence: string;
  strategy: string;
};

type WorkoutSection = {
  title: string;
  subtitle: string;
  theme: ThemeKey;
  exercises: Exercise[];
  cardio: string;
};

type ThemeKey = "red" | "blue" | "amber";

type Theme = {
  sectionBorder: string;
  sectionGlow: string;
  badgeText: string;
  countBadge: string;
  countBadgeText: string;
  cardBorder: string;
  cardTop: string;
  accentLabel: string;
  chipBorder: string;
  chipBg: string;
  chipLabel: string;
  weightBorder: string;
  weightFocus: string;
};

const STORAGE_KEY = "ironcore-treino-pesos-v1";

const THEMES: Record<ThemeKey, Theme> = {
  red: {
    sectionBorder: "border-rose-400/15",
    sectionGlow: "shadow-[0_10px_40px_rgba(244,63,94,0.08)]",
    badgeText: "text-rose-200",
    countBadge: "border-rose-300/20 bg-rose-300/10",
    countBadgeText: "text-rose-100",
    cardBorder: "border-rose-300/10",
    cardTop: "from-rose-400/18 to-transparent",
    accentLabel: "text-rose-300/90",
    chipBorder: "border-rose-200/10",
    chipBg: "bg-rose-200/[0.05]",
    chipLabel: "text-rose-200/70",
    weightBorder: "border-rose-300/20",
    weightFocus: "focus:border-rose-300/50",
  },
  blue: {
    sectionBorder: "border-cyan-400/15",
    sectionGlow: "shadow-[0_10px_40px_rgba(34,211,238,0.08)]",
    badgeText: "text-cyan-200",
    countBadge: "border-cyan-300/20 bg-cyan-300/10",
    countBadgeText: "text-cyan-100",
    cardBorder: "border-cyan-300/10",
    cardTop: "from-cyan-400/18 to-transparent",
    accentLabel: "text-cyan-300/90",
    chipBorder: "border-cyan-200/10",
    chipBg: "bg-cyan-200/[0.05]",
    chipLabel: "text-cyan-200/70",
    weightBorder: "border-cyan-300/20",
    weightFocus: "focus:border-cyan-300/50",
  },
  amber: {
    sectionBorder: "border-amber-400/15",
    sectionGlow: "shadow-[0_10px_40px_rgba(251,191,36,0.08)]",
    badgeText: "text-amber-200",
    countBadge: "border-amber-300/20 bg-amber-300/10",
    countBadgeText: "text-amber-100",
    cardBorder: "border-amber-300/10",
    cardTop: "from-amber-400/18 to-transparent",
    accentLabel: "text-amber-300/90",
    chipBorder: "border-amber-200/10",
    chipBg: "bg-amber-200/[0.05]",
    chipLabel: "text-amber-200/70",
    weightBorder: "border-amber-300/20",
    weightFocus: "focus:border-amber-300/50",
  },
};

const WORKOUTS: WorkoutSection[] = [
  {
    title: "📅 TREINO A",
    subtitle: "Peito + Tríceps + Abdômen",
    theme: "red",
    cardio: "10–12 min HIIT (30s forte / 60s leve)",
    exercises: [
      { name: "Supino reto barra", sets: "4", reps: "8–10", technique: "Escápula travada, pé firme, barra no meio do peito", cadence: "1s sobe / 3s desce", strategy: "Última série rest-pause (10s + reps)" },
      { name: "Supino inclinado barra", sets: "3", reps: "10", technique: "Banco 30°, foco peitoral superior", cadence: "1s / 3s", strategy: "Última série rest-pause" },
      { name: "Crucifixo polia", sets: "3", reps: "12", technique: "Cotovelo fixo, contrai no centro", cadence: "2s fecha / 3s abre", strategy: "Superset com flexão" },
      { name: "Flexão no chão", sets: "3", reps: "Falha", technique: "Corpo reto, core ativo", cadence: "Controlado", strategy: "Superset com crucifixo" },
      { name: "Tríceps corda", sets: "4", reps: "12", technique: "Cotovelo fixo, abre no final", cadence: "1s / 3s", strategy: "Contração máxima" },
      { name: "Tríceps francês polia", sets: "3", reps: "10", technique: "Alonga bem atrás, cotovelo fixo", cadence: "2s / 2s", strategy: "Foco cabeça longa" },
      { name: "Abdominal supra", sets: "4", reps: "20", technique: "Lombar colada, sobe escápula", cadence: "2s / 2s", strategy: "Última com isometria 20s" },
      { name: "Ab bicicleta", sets: "3", reps: "20", technique: "Rotação real, perna estendida", cadence: "Controlado", strategy: "Última com isometria" },
    ],
  },
  {
    title: "📅 TREINO B",
    subtitle: "Costas + Bíceps + Abdômen",
    theme: "blue",
    cardio: "10–12 min moderado (zona 2/3)",
    exercises: [
      { name: "Puxada frontal", sets: "4", reps: "10–12", technique: "Escápula desce primeiro, peito aberto", cadence: "1s / 3s", strategy: "Foco dorsal (V shape)" },
      { name: "Remada baixa", sets: "4", reps: "10–12", technique: "Tronco firme, segura 1s atrás", cadence: "2s / 3s", strategy: "Densidade" },
      { name: "Pullover polia", sets: "3", reps: "12", technique: "Braço semi-estendido, dorsal ativa", cadence: "2s / 3s", strategy: "Segura 2s embaixo" },
      { name: "Rosca barra", sets: "4", reps: "10", technique: "Cotovelo fixo, sem roubo", cadence: "2s / 3s", strategy: "Controle total" },
      { name: "Rosca Scott", sets: "3", reps: "12", technique: "Amplitude completa", cadence: "2s / 3s", strategy: "Última com drop set" },
      { name: "Elevação pernas", sets: "4", reps: "15", technique: "Movimento do quadril, sem balanço", cadence: "2s / 3s", strategy: "Abdômen inferior" },
      { name: "Prancha", sets: "3", reps: "40s", technique: "Core travado, glúteo ativo", cadence: "Isométrico", strategy: "Alterna elevação de perna" },
    ],
  },
  {
    title: "📅 TREINO C",
    subtitle: "Pernas + Ombro + Braço",
    theme: "amber",
    cardio: "10 min leve (recuperação ativa)",
    exercises: [
      { name: "Afundo halter", sets: "3", reps: "10/cada", technique: "Passo longo, tronco levemente inclinado", cadence: "2–3s / 1s", strategy: "Glúteo dominante" },
      { name: "Extensora", sets: "3", reps: "12", technique: "Segura 1s no topo", cadence: "2s / 3s", strategy: "Reduz volume" },
      { name: "Flexora", sets: "4", reps: "12", technique: "Quadril fixo, contrai forte", cadence: "2s / 3s", strategy: "Última com pausa 2s" },
      { name: "Desenvolvimento barra", sets: "3", reps: "12", technique: "Core travado, não arquear lombar", cadence: "1s / 2–3s", strategy: "Estabilidade" },
      { name: "Elevação lateral", sets: "3", reps: "15", technique: "Movimento curto, sem roubo", cadence: "1s / 4s", strategy: "Drop set final" },
      { name: "Rosca martelo", sets: "3", reps: "12", technique: "Pegada neutra firme", cadence: "2s / 3s", strategy: "Espessura" },
      { name: "Tríceps barra", sets: "3", reps: "12", technique: "Cotovelo fixo", cadence: "1s / 3s", strategy: "Definição" },
      { name: "Ab bicicleta", sets: "3", reps: "20", technique: "Controle total", cadence: "Controlado", strategy: "Core" },
      { name: "Ab supra", sets: "3", reps: "20", technique: "Contração limpa", cadence: "2s / 2s", strategy: "Core" },
    ],
  },
];

const PROGRESSION = [
  { situation: "Bateu topo das reps com execução limpa", action: "+2,5kg próxima sessão" },
  { situation: "Não bateu reps", action: "Mantém carga" },
  { situation: "Perdeu cadência", action: "Peso alto demais" },
  { situation: "Muito fácil", action: "Peso baixo" },
];

const FATLOSS_PROTOCOL = [
  { pillar: "Déficit calórico", guideline: "-300 a -400 kcal" },
  { pillar: "Proteína", guideline: "~2g/kg" },
  { pillar: "Cardio", guideline: "3x HIIT curto + 1 zona 2 opcional" },
  { pillar: "Treino", guideline: "Manter carga (NUNCA sacrificar força)" },
];

function MetricChip({ label, value, theme }: { label: string; value: string; theme: Theme }) {
  return (
    <div className={`rounded-2xl border px-3 py-2 ${theme.chipBorder} ${theme.chipBg}`}>
      <div className={`text-[0.68rem] uppercase tracking-[0.14em] ${theme.chipLabel}`}>{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function exerciseKey(workoutTitle: string, exerciseName: string) {
  return `${workoutTitle}__${exerciseName}`;
}

function ExerciseCard({
  exercise,
  workoutTitle,
  index,
  theme,
  weight,
  onWeightChange,
}: {
  exercise: Exercise;
  workoutTitle: string;
  index: number;
  theme: Theme;
  weight: string;
  onWeightChange: (value: string) => void;
}) {
  return (
    <article className={`overflow-hidden rounded-3xl border bg-[#10192c] shadow-[0_8px_30px_rgba(0,0,0,0.18)] ${theme.cardBorder}`}>
      <div className={`h-1.5 w-full bg-gradient-to-r ${theme.cardTop}`} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 rounded accent-cyan-400" />
          <div className="min-w-0 flex-1">
            <div className={`text-[0.72rem] font-semibold uppercase tracking-[0.16em] ${theme.accentLabel}`}>Exercício {index + 1}</div>
            <h3 className="mt-1 text-lg font-semibold leading-tight text-white">{exercise.name}</h3>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
              <MetricChip label="Séries" value={exercise.sets} theme={theme} />
              <MetricChip label="Reps" value={exercise.reps} theme={theme} />
              <MetricChip label="Técnica" value={exercise.technique} theme={theme} />
              <MetricChip label="Cadência" value={exercise.cadence} theme={theme} />
              <MetricChip label="Estratégia" value={exercise.strategy} theme={theme} />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-[#0d1422] p-3">
              <label className={`block text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${theme.chipLabel}`}>Peso atual</label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={weight}
                  onChange={(e) => onWeightChange(e.target.value)}
                  placeholder="Ex.: 40kg"
                  className={`w-full rounded-xl border bg-[#111a2a] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 ${theme.weightBorder} ${theme.weightFocus}`}
                />
                <span className="text-xs text-slate-400">salvo</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">Você pode atualizar esse campo a cada treino e ele fica salvo no seu navegador.</div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function TreinoPage() {
  const allExerciseKeys = useMemo(
    () => WORKOUTS.flatMap((workout) => workout.exercises.map((exercise) => exerciseKey(workout.title, exercise.name))),
    []
  );

  const [weights, setWeights] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string>;
      setWeights(parsed || {});
    } catch {}
  }, []);

  useEffect(() => {
    if (!Object.keys(weights).length) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
  }, [weights]);

  const filledCount = allExerciseKeys.filter((key) => (weights[key] || "").trim()).length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#13203a_0%,_#0b1220_45%,_#08101d_100%)] px-4 py-5 text-[#eaf2ff] sm:px-5">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[28px] border border-cyan-400/15 bg-[#0f1728]/95 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.28)] sm:p-6">
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Ironcore · treino de bolso
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Plano de treino atualizado para secar sem perder força</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            Estrutura objetiva pra abrir no celular e executar: cadência, técnica, estratégia, cardio e agora também o peso atual de cada exercício salvo no navegador.
          </p>
          <div className="mt-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100">
            Pesos preenchidos: {filledCount}/{allExerciseKeys.length}
          </div>
        </section>

        <div className="mt-5 space-y-5">
          {WORKOUTS.map((workout) => {
            const theme = THEMES[workout.theme];
            return (
              <section key={workout.title} className={`rounded-[28px] border bg-[#121b2d]/95 p-4 sm:p-5 ${theme.sectionBorder} ${theme.sectionGlow}`}>
                <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{workout.title}</h2>
                    <p className={`mt-1 text-sm ${theme.badgeText}`}>{workout.subtitle}</p>
                  </div>
                  <div className={`rounded-full border px-3 py-1.5 text-xs font-medium ${theme.countBadge} ${theme.countBadgeText}`}>
                    {workout.exercises.length} exercícios
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {workout.exercises.map((exercise, index) => {
                    const key = exerciseKey(workout.title, exercise.name);
                    return (
                      <ExerciseCard
                        key={`${workout.title}-${exercise.name}`}
                        exercise={exercise}
                        workoutTitle={workout.title}
                        index={index}
                        theme={theme}
                        weight={weights[key] || ""}
                        onWeightChange={(value) => setWeights((prev) => ({ ...prev, [key]: value }))}
                      />
                    );
                  })}
                </div>

                <div className="mt-4 rounded-3xl border border-white/10 bg-[#0d1422] px-4 py-4 text-sm leading-7 text-slate-200">
                  <strong className="text-white">🔥 Cardio:</strong> {workout.cardio}
                </div>
              </section>
            );
          })}

          <section className="grid gap-5 xl:grid-cols-2">
            <article className="rounded-[28px] border border-amber-300/15 bg-[#151d2d]/95 p-5">
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-amber-200/90">⚙️ Regra de progressão</div>
              <h2 className="mt-2 text-2xl font-semibold text-white">Simples, objetiva e sem achismo</h2>
              <div className="mt-4 grid gap-3">
                {PROGRESSION.map((item) => (
                  <div key={item.situation} className="rounded-2xl border border-white/10 bg-[#0d1422] px-4 py-4 text-sm leading-7 text-slate-200">
                    <div><strong className="text-white">Situação:</strong> {item.situation}</div>
                    <div className="mt-1"><strong className="text-white">Ação:</strong> {item.action}</div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[28px] border border-cyan-300/15 bg-[#151d2d]/95 p-5">
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-cyan-200/90">🧠 Protocolo pra secar flanco</div>
              <h2 className="mt-2 text-2xl font-semibold text-white">Sem perder força</h2>
              <div className="mt-4 grid gap-3">
                {FATLOSS_PROTOCOL.map((item) => (
                  <div key={item.pillar} className="rounded-2xl border border-white/10 bg-[#0d1422] px-4 py-4 text-sm leading-7 text-slate-200">
                    <div><strong className="text-white">{item.pillar}:</strong> {item.guideline}</div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
