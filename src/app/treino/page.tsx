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

function ExerciseItem({ exercise }: { exercise: Exercise }) {
  return (
    <li className="border-b border-dashed border-[#2b3f63] py-2 last:border-b-0">
      <div className="flex items-start gap-2.5">
        <input type="checkbox" className="mt-1 mr-2 shrink-0 scale-110 accent-cyan-400" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <a
              className="whitespace-nowrap rounded-full border border-[#2f4f7b] px-2.5 py-1 text-[0.78rem] text-[#9dd5ff] no-underline"
              target="_blank"
              rel="noopener noreferrer"
              href={videoSearchUrl(exercise.query)}
            >
              ▶ Ver execução
            </a>
            <span className="leading-5"><strong>{exercise.name}</strong></span>
          </div>
          <div className="mt-1 text-sm leading-6 text-[#c8d7f2]">
            <span><strong>Aparelho:</strong> {exercise.equipment}</span>
            <span> · <strong>Séries:</strong> {exercise.sets}</span>
            <span> · <strong>Reps:</strong> {exercise.reps}</span>
            <span> · <strong>Peso:</strong> {exercise.estimatedWeight}</span>
            <span> · <strong>Descanso:</strong> {exercise.rest}</span>
          </div>
        </div>
      </div>
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
            <h2 className="mb-1 text-xl font-semibold">{workout.title}</h2>
            <div className="mb-2 inline-block rounded-full border border-[#2f4f7b] bg-[#1c2a46] px-2.5 py-0.5 text-[0.8rem] text-[#9dd5ff]">
              {workout.subtitle}
            </div>

            <ul className="mt-2.5 list-none p-0">
              {workout.exercises.map((exercise) => (
                <ExerciseItem key={`${workout.title}-${exercise.name}`} exercise={exercise} />
              ))}
            </ul>
          </section>
        ))}

        <section className="my-3 rounded-[14px] border border-[#263656] bg-[#121b2d] p-[14px]">
          <h2 className="mb-2 text-xl font-semibold">📈 Regra de Progressão</h2>
          <p className="text-[#c8d7f2]">
            Quando conseguir fazer todas as reps com boa forma, aumenta 2,5kg no próximo treino. Simples assim.
          </p>
        </section>
      </div>
    </main>
  );
}
