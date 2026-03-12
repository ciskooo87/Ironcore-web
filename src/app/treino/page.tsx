type Exercise = {
  name: string;
  equipment: string;
  sets: string;
  reps: string;
  estimatedWeight: string;
  rest: string;
  query: string;
};

type WorkoutSection = {
  title: string;
  subtitle: string;
  exercises: Exercise[];
};

const WORKOUTS: WorkoutSection[] = [
  {
    title: "📅 TREINO A — Segunda",
    subtitle: "Peito + Tríceps + Abdômen",
    exercises: [
      { name: "Supino reto com barra", equipment: "Rack + barra", sets: "4", reps: "8–10", estimatedWeight: "40kg", rest: "90s", query: "supino reto com barra execução correta" },
      { name: "Supino inclinado com barra", equipment: "Rack + banco ajustável", sets: "3", reps: "10", estimatedWeight: "30kg", rest: "75s", query: "supino inclinado com barra execução correta" },
      { name: "Peck deck (peitoral)", equipment: "Movement W2", sets: "3", reps: "12", estimatedWeight: "20kg", rest: "60s", query: "peck deck peitoral execução correta" },
      { name: "Tríceps polia alta", equipment: "Movement W2", sets: "4", reps: "12", estimatedWeight: "15kg", rest: "60s", query: "tríceps polia alta execução correta" },
      { name: "Tríceps testa com barra", equipment: "Rack + barra", sets: "3", reps: "10", estimatedWeight: "20kg", rest: "60s", query: "tríceps testa com barra execução correta" },
      { name: "Abdominal no banco romano", equipment: "Banco GHD", sets: "4", reps: "20", estimatedWeight: "Peso corporal", rest: "45s", query: "abdominal banco romano execução correta" },
      { name: "Elevação de pernas", equipment: "Banco romano", sets: "3", reps: "15", estimatedWeight: "Peso corporal", rest: "45s", query: "elevação de pernas banco romano execução correta" },
    ],
  },
  {
    title: "📅 TREINO B — Quarta",
    subtitle: "Costas + Bíceps + Abdômen",
    exercises: [
      { name: "Polia alta (lat pulldown)", equipment: "Movement W2", sets: "4", reps: "10–12", estimatedWeight: "30kg", rest: "75s", query: "lat pulldown polia alta execução correta" },
      { name: "Remada baixa na polia", equipment: "Movement W2", sets: "4", reps: "10–12", estimatedWeight: "25kg", rest: "75s", query: "remada baixa na polia execução correta" },
      { name: "Rosca bíceps com barra", equipment: "Rack + barra", sets: "4", reps: "10", estimatedWeight: "20kg", rest: "60s", query: "rosca bíceps com barra execução correta" },
      { name: "Rosca na polia baixa", equipment: "Movement W2", sets: "3", reps: "12", estimatedWeight: "15kg", rest: "60s", query: "rosca na polia baixa execução correta" },
      { name: "Abdominal supra", equipment: "Banco romano", sets: "4", reps: "20", estimatedWeight: "Peso corporal", rest: "45s", query: "abdominal supra banco romano execução correta" },
      { name: "Abdominal infra (elevação)", equipment: "Banco romano", sets: "3", reps: "15", estimatedWeight: "Peso corporal", rest: "45s", query: "abdominal infra elevação execução correta" },
    ],
  },
  {
    title: "📅 TREINO C — Sexta",
    subtitle: "Pernas + Ombro + Braço completo",
    exercises: [
      { name: "Extensão de pernas", equipment: "Cadeira extensora", sets: "4", reps: "12", estimatedWeight: "25kg", rest: "60s", query: "cadeira extensora execução correta" },
      { name: "Flexão de pernas", equipment: "Cadeira flexora", sets: "4", reps: "12", estimatedWeight: "20kg", rest: "60s", query: "cadeira flexora execução correta" },
      { name: "Desenvolvimento ombro (polia)", equipment: "Movement W2", sets: "3", reps: "12", estimatedWeight: "15kg", rest: "60s", query: "desenvolvimento ombro polia execução correta" },
      { name: "Rosca martelo na polia", equipment: "Movement W2", sets: "3", reps: "12", estimatedWeight: "15kg", rest: "60s", query: "rosca martelo na polia execução correta" },
      { name: "Tríceps polia (corda)", equipment: "Movement W2", sets: "3", reps: "12", estimatedWeight: "15kg", rest: "60s", query: "tríceps polia corda execução correta" },
      { name: "Prancha", equipment: "Chão", sets: "3", reps: "40s", estimatedWeight: "Peso corporal", rest: "45s", query: "prancha execução correta" },
    ],
  },
];

function videoSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="text-[0.68rem] uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function ExerciseCard({ exercise, index }: { exercise: Exercise; index: number }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#10192c] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
      <div className="flex items-start gap-3">
        <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 rounded accent-cyan-400" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-cyan-300/90">Exercício {index + 1}</div>
              <h3 className="mt-1 text-lg font-semibold leading-tight text-white">{exercise.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{exercise.equipment}</p>
            </div>
            <a
              className="shrink-0 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-200 no-underline transition hover:bg-cyan-400/15"
              target="_blank"
              rel="noopener noreferrer"
              href={videoSearchUrl(exercise.query)}
            >
              ▶ Ver vídeo
            </a>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricChip label="Séries" value={exercise.sets} />
            <MetricChip label="Reps" value={exercise.reps} />
            <MetricChip label="Peso" value={exercise.estimatedWeight} />
            <MetricChip label="Descanso" value={exercise.rest} />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function TreinoPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#13203a_0%,_#0b1220_45%,_#08101d_100%)] px-4 py-5 text-[#eaf2ff] sm:px-5">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[28px] border border-cyan-400/15 bg-[#0f1728]/95 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.28)] sm:p-6">
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Ironcore · treino de bolso
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Curto, direto e pronto pra executar</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Organizei do jeito mais limpo pra abrir no celular, bater o olho e começar. Cada exercício virou card com vídeo, carga, reps e descanso sem poluição.
          </p>
        </section>

        <div className="mt-5 space-y-5">
          {WORKOUTS.map((workout) => (
            <section key={workout.title} className="rounded-[28px] border border-white/10 bg-[#121b2d]/95 p-4 sm:p-5">
              <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{workout.title}</h2>
                  <p className="mt-1 text-sm text-cyan-200">{workout.subtitle}</p>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                  {workout.exercises.length} exercícios
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {workout.exercises.map((exercise, index) => (
                  <ExerciseCard key={`${workout.title}-${exercise.name}`} exercise={exercise} index={index} />
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-[28px] border border-amber-300/15 bg-[#151d2d]/95 p-5">
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-amber-200/90">Regra de progressão</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Subiu fácil? Sobe carga.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
              Quando conseguir fazer todas as reps com boa forma, aumenta <strong className="text-white">2,5kg</strong> no próximo treino. Simples, objetivo e sem inventar moda.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
