import { createElement } from "react";
import { SkillCategory } from "@/lib/types";
import { categoryIcon, skillIcon } from "@/lib/icons";
import type { Dictionary } from "@/lib/i18n";

export default function SkillCard({
  category,
  t,
}: {
  category: SkillCategory;
  t: Dictionary;
}) {
  return (
    <div className="bg-white p-8 rounded-jumbo shadow-sm ring-1 ring-line transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-accent/5 border border-accent/20 flex items-center justify-center text-accent">
            {createElement(categoryIcon(category.name), { className: "text-xl" })}
          </span>
          <h3 className="text-xl font-bold font-heading tracking-tight">{category.name}</h3>
        </div>
        <span className="font-mono text-xs text-secondary/60 group-hover:text-accent transition-colors">
          {String(category.skills.length).padStart(2, "0")} {t.skillCard.items}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mt-auto">
        {category.skills.map((skill) => (
          <span
            key={skill.id}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-elevated border border-line text-sm font-medium text-primary transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
          >
            {createElement(skillIcon(skill.name), { className: "text-xs text-secondary group-hover:text-accent" })}
            {skill.name}
          </span>
        ))}
      </div>
    </div>
  );
}
