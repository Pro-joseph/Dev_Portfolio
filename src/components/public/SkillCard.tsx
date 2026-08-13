import { createElement } from "react";
import { SkillCategory } from "@/lib/types";
import { categoryIcon } from "@/lib/icons";

export default function SkillCard({ category }: { category: SkillCategory }) {
  return (
    <div className="bg-white p-8 rounded-jumbo shadow-sm ring-1 ring-line transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-accent/5 border border-accent/20 flex items-center justify-center text-accent">
            {createElement(categoryIcon(category.name), { className: "text-xl" })}
          </span>
          <h3 className="text-xl font-bold font-heading tracking-tight">{category.name}</h3>
        </div>
        <span className="font-mono text-[10px] text-secondary/60 group-hover:text-accent transition-colors">
          {category.skills.length} ITEMS
        </span>
      </div>
      <div className="aspect-square rounded-xl overflow-hidden mb-6 bg-elevated dot-grid flex items-center justify-center">
        <span className="font-mono text-5xl font-bold text-secondary/15">
          {category.name.slice(0, 3).toUpperCase()}
        </span>
      </div>
      <ul className="space-y-3 text-secondary font-mono text-sm">
        {category.skills.map((skill) => (
          <li key={skill.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-primary font-medium">{skill.name}</span>
              {skill.proficiency != null && (
                <span className="text-secondary/50 text-xs">{skill.proficiency}%</span>
              )}
            </div>
            {skill.proficiency != null && (
              <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent/70 group-hover:bg-accent transition-colors"
                  style={{ width: `${skill.proficiency}%` }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}