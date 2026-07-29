// Stepper 4 étapes — parcours RDV (design Stitch)
const STEPS = ["Service", "Formalité", "Créneau", "Confirmation"];

export function Stepper({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center justify-center">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  active
                    ? "bg-primary text-on-primary"
                    : done
                      ? "bg-primary-container text-on-primary"
                      : "border-2 border-outline-variant bg-white text-outline"
                }`}
              >
                {done ? "✓" : n}
              </div>
              <span className={`mt-1 text-xs ${active ? "font-semibold text-primary" : "text-outline"}`}>
                {label}
              </span>
            </div>
            {n < STEPS.length && (
              <div className={`mx-2 mb-5 h-0.5 w-8 sm:w-16 ${done ? "bg-primary-container" : "bg-outline-variant"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
