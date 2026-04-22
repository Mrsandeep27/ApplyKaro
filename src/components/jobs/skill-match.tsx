import { Check, X } from 'lucide-react';

export function SkillMatch({
  matching = [],
  missing = [],
  bonus = [],
}: {
  matching?: string[];
  missing?: string[];
  bonus?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {matching.map((s) => (
        <span key={`m-${s}`} className="chip-green">
          <Check className="w-3 h-3" /> {s}
        </span>
      ))}
      {missing.map((s) => (
        <span key={`x-${s}`} className="chip-red">
          <X className="w-3 h-3" /> {s}
        </span>
      ))}
      {bonus.map((s) => (
        <span key={`b-${s}`} className="chip-blue">
          + {s}
        </span>
      ))}
    </div>
  );
}
