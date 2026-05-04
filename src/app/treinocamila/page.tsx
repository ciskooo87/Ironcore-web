type Exercise = {
  name: string;
  sets: string;
  reps: string;
  load: string;
  rest: string;
};

type Workout = {
  title: string;
  subtitle: string;
  theme: ThemeKey;
  exercises: Exercise[];
};

type ThemeKey = "rose" | "cyan" | "amber";

type Theme = {
  sectionBorder: string;
  glow: string;
  accent: string;
  chipBorder: string;
  chipBg: string;
  chipText: string;
};

const THEMES: Record<ThemeKey, Theme> = {
  rose: {
    sectionBorder: "border-rose-400/15",
    glow: "shadow-[0_10px_40px_rgba(244,63,94,0.08)]",
    accent: "text-rose-200",
    chipBorder: "border-rose-300/10",
    chipBg: "bg-rose-300/[0.05]",
    chipText: "text-rose-100/80",
  },
  cyan: {
    sectionBorder: "border-cyan-400/15",
    glow: "shadow-[0_10px_40px_rgba(34,211,238,0.08)]",
    accent: "text-cyan-200",
    chipBorder: "border-cyan-300/10",
    chipBg: "bg-cyan-300/[0.05]",
    chipText: "text-cyan-100/80",
  },
  amber: {
    sectionBorder: "border-amber-400/15",
    glow: "shadow-[0_10px_40px_rgba(251,191,36,0.08)]",
    accent: "text-amber-200",
    chipBorder: "border-amber-300/10",
    chipBg: "bg-amber-300/[0.05]",
    chipText: "text-amber-100/80",
  },
};

const WORKOUTS: Workout[] = [
  {
    title: "TREINO A",
    subtitle: "Glúteo e pernas",
    theme: "rose",
    exercises: [
      { name: "Agachamento Sumô", sets: "4", reps: "8-10", load: "25-30kg", rest: "75s" },
      { name: "Extensão de pernas", sets: "4", reps: "12-15", load: "20-25kg", rest: "60s" },
      { name: "Stiff Romeno", sets: "4", reps: "10-12", load: "25-35kg", rest: "75s" },
      { name: "Abdução", sets: "3", reps: "15-20", load: "20-25kg", rest: "60s" },
      { name: "Hip Thrust", sets: "4", reps: "12", load: "30-40kg", rest: "75s" },
      { name: "Abdominal Supra", sets: "4", reps: "20", load: "Corporal", rest: "45s" },
      { name: "Dead Bug", sets: "3", reps: "12/lado", load: "Corporal", rest: "45s" },
    ],
  },
  {
    title: "TREINO B",
    subtitle: "Superior e core",
    theme: "cyan",
    exercises: [
      { name: "Puxada frontal", sets: "4", reps: "10-12", load: "25-30kg", rest: "75s" },
      { name: "Remada baixa", sets: "4", reps: "10-12/lado", load: "15-20kg", rest: "75s" },
      { name: "Supino Inclinado", sets: "3", reps: "12-15", load: "6-8kg cada", rest: "60s" },
      { name: "Face Pull", sets: "3", reps: "15", load: "10kg", rest: "60s" },
      { name: "Tríceps Polia", sets: "3", reps: "12-15", load: "10-15kg", rest: "60s" },
      { name: "Abdominal Bicicleta", sets: "4", reps: "20/lado", load: "Corporal", rest: "45s" },
      { name: "Prancha frontal", sets: "3", reps: "45s", load: "Corporal", rest: "45s" },
    ],
  },
  {
    title: "TREINO C",
    subtitle: "Glúteo e perna",
    theme: "amber",
    exercises: [
      { name: "Flexão de pernas", sets: "4", reps: "12-15", load: "20-25kg", rest: "60s" },
      { name: "Agachamento Búlgaro", sets: "4", reps: "10/lado", load: "10-15kg halteres", rest: "75s" },
      { name: "Adução", sets: "3", reps: "15-20", load: "20-25kg", rest: "60s" },
      { name: "Elevação Pélvica", sets: "4", reps: "12", load: "30-40kg", rest: "75s" },
      { name: "Kickback Glúteo", sets: "3", reps: "15/lado", load: "5-10kg", rest: "60s" },
      { name: "Abdominal Infra", sets: "4", reps: "12-15", load: "Corporal", rest: "45s" },
      { name: "Prancha Lateral", sets: "3", reps: "40s/lado", load: "Corporal", rest: "45s" },
    ],
  },
];

const RULES = [
  "Aquecimento (Treinos A e C): 3 min de Carioca (passada lateral coordenada).",
  "Cardio Final (Treinos B e C): 10 séries de 30s correndo forte / 60s andando leve.",
  "Progressão: Se terminar as repetições com facilidade, aumente 1-2kg no próximo treino.",
];

const DIET = [
  "Mínimo 1,8g a 2g de proteína por kg (140g+ diárias) para garantir o ganho de massa magra enquanto perde gordura.",
  "Mantenha a hidratação em dia.",
  "Use déficit calórico leve para secar o shape com qualidade.",
];

function StatChip({ label, value, theme }: { label: string; value: string; theme: Theme }) {
  return (
    <div className={`rounded-2xl border px-3 py-2 ${theme.chipBorder} ${theme.chipBg}`}>
      <div className={`text-[0.68rem] uppercase tracking-[0.14em] ${theme.chipText}`}>{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

export default function TreinoCamilaPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#13203a_0%,_#0b1220_45%,_#08101d_100%)] px-4 py-5 text-[#eaf2ff] sm:px-5">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[28px] border border-cyan-400/15 bg-[#0f1728]/95 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.28)] sm:p-6">
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Ironcore · treino Camila
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Plano de treino atualizado</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            Estrutura objetiva para glúteo, perna, superior e core com progressão simples, cardio definido e diretriz nutricional clara.
          </p>
        </section>

        <section className="mt-5 rounded-[28px] border border-white/10 bg-[#111a2b]/95 p-5">
          <div className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-cyan-200/90">Regras gerais de execução</div>
          <div className="mt-4 grid gap-3">
            {RULES.map((rule) => (
              <div key={rule} className="rounded-2xl border border-white/10 bg-[#0d1422] px-4 py-4 text-sm leading-7 text-slate-200">
                {rule}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 space-y-5">
          {WORKOUTS.map((workout) => {
            const theme = THEMES[workout.theme];
            return (
              <section key={workout.title} className={`rounded-[28px] border bg-[#121b2d]/95 p-4 sm:p-5 ${theme.sectionBorder} ${theme.glow}`}>
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-2xl font-semibold text-white">{workout.title}</h2>
                  <p className={`mt-1 text-sm ${theme.accent}`}>{workout.subtitle}</p>
                </div>

                <div className="mt-4 grid gap-3">
                  {workout.exercises.map((exercise) => (
                    <article key={`${workout.title}-${exercise.name}`} className="rounded-3xl border border-white/10 bg-[#10192c] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
                      <h3 className="text-lg font-semibold text-white">{exercise.name}</h3>
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-4">
                        <StatChip label="Séries" value={exercise.sets} theme={theme} />
                        <StatChip label="Reps" value={exercise.reps} theme={theme} />
                        <StatChip label="Carga" value={exercise.load} theme={theme} />
                        <StatChip label="Descanso" value={exercise.rest} theme={theme} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-5 rounded-[28px] border border-emerald-400/15 bg-[#111a2b]/95 p-5">
          <div className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-emerald-200/90">Dieta</div>
          <div className="mt-4 grid gap-3">
            {DIET.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-[#0d1422] px-4 py-4 text-sm leading-7 text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
