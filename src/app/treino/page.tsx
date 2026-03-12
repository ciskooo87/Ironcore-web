type Exercise = {
  name: string;
  details: string;
  query: string;
};

type WorkoutSection = {
  title: string;
  badge: string;
  exercises: Exercise[];
  extraTitle?: string;
  extraExercises?: Exercise[];
};

const WORKOUTS: WorkoutSection[] = [
  {
    title: "✅ SEGUNDA — TREINO A (pesado)",
    badge: "Descanso: 60–90s · Meta: força + crescimento",
    exercises: [
      { name: "Supino máquina", details: "4×8–10 (40–60 kg)", query: "supino máquina execucao correta" },
      { name: "Puxada alta", details: "4×8–10 (45–60 kg)", query: "puxada alta execucao correta" },
      { name: "Remada baixa", details: "4×10 (50–65 kg)", query: "remada baixa execucao correta" },
      { name: "Goblet squat", details: "4×10 (20–32 kg)", query: "goblet squat execucao correta" },
      { name: "Cadeira extensora", details: "3×12 (40–55 kg)", query: "cadeira extensora execucao correta" },
      { name: "Elevação lateral", details: "3×12–15 (6–10 kg)", query: "elevação lateral execucao correta" },
      { name: "Abdominal infra", details: "3×12–15 (peso corporal)", query: "abdominal infra execucao correta" },
    ],
    extraTitle: "+ Extra Segunda (Peito + Bíceps)",
    extraExercises: [
      { name: "Crucifixo inclinado halteres", details: "3×12 (10–16 kg)", query: "crucifixo inclinado execucao correta" },
      { name: "Rosca direta barra", details: "3×10–12 (20–30 kg)", query: "rosca direta execucao correta" },
    ],
  },
  {
    title: "✅ QUINTA — TREINO B (volume)",
    badge: "Descanso: 45–60s · Meta: pump + definição",
    exercises: [
      { name: "Supino máquina", details: "3×12 (35–50 kg)", query: "supino máquina execucao correta" },
      { name: "Puxada alta", details: "3×12 (40–55 kg)", query: "puxada alta execucao correta" },
      { name: "Cadeira extensora", details: "3×15 (35–45 kg)", query: "cadeira extensora execucao correta" },
      { name: "Desenvolvimento halteres", details: "3×10–12 (8–14 kg)", query: "desenvolvimento execucao correta" },
      { name: "Stiff halteres", details: "3×12 (18–30 kg)", query: "stiff execucao correta" },
      { name: "Abdução quadril", details: "3×20 (leve–moderada)", query: "abdução execucao correta" },
      { name: "Prancha inclinada", details: "3×45s", query: "prancha execucao correta" },
    ],
    extraTitle: "+ Extra Quinta (Peito + Bíceps)",
    extraExercises: [
      { name: "Supino inclinado halteres", details: "3×10 (16–24 kg)", query: "supino inclinado execucao correta" },
      { name: "Rosca martelo alternada", details: "3×12 (10–16 kg)", query: "rosca martelo execucao correta" },
    ],
  },
];

function videoSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function ExerciseItem({ exercise }: { exercise: Exercise }) {
  return (
    <li className="border-b border-dashed border-[#2b3f63] py-2 last:border-b-0">
      <label className="flex items-center gap-2.5">
        <input type="checkbox" className="mr-2 shrink-0 scale-110 accent-cyan-400" />
        <a
          className="whitespace-nowrap rounded-full border border-[#2f4f7b] px-2.5 py-1 text-[0.78rem] text-[#9dd5ff] no-underline"
          target="_blank"
          rel="noopener noreferrer"
          href={videoSearchUrl(exercise.query)}
        >
          ▶ Ver execução
        </a>
        <span className="leading-5">{exercise.name} — {exercise.details}</span>
      </label>
    </li>
  );
}

export default function TreinoPage() {
  return (
    <main className="min-h-screen bg-[#0b1220] px-[18px] py-[18px] text-[#eaf2ff]">
      <div className="mx-auto max-w-[920px]">
        <h1 className="mb-2 text-[1.4rem] font-semibold">💥 Ironcore — Treino de Bolso</h1>
        <div className="text-[0.92rem] text-[#9fb3d9]">Curto · direto · abrir e executar</div>

        {WORKOUTS.map((workout) => (
          <section key={workout.title} className="my-3 rounded-[14px] border border-[#263656] bg-[#121b2d] p-[14px]">
            <h2 className="mb-2 text-xl font-semibold">{workout.title}</h2>
            <div className="mt-1 inline-block rounded-full border border-[#2f4f7b] bg-[#1c2a46] px-2.5 py-0.5 text-[0.8rem] text-[#9dd5ff]">
              {workout.badge}
            </div>

            <ul className="mt-2.5 list-none p-0">
              {workout.exercises.map((exercise) => (
                <ExerciseItem key={`${workout.title}-${exercise.name}`} exercise={exercise} />
              ))}
            </ul>

            {workout.extraTitle && workout.extraExercises?.length ? (
              <>
                <h3 className="mt-[14px] text-lg font-medium">{workout.extraTitle}</h3>
                <ul className="mt-2.5 list-none p-0">
                  {workout.extraExercises.map((exercise) => (
                    <ExerciseItem key={`${workout.extraTitle}-${exercise.name}`} exercise={exercise} />
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
}
