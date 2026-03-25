import type { JSX, ParentComponent } from "solid-js";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  actions?: JSX.Element;
  class?: string;
}

export const SectionCard: ParentComponent<SectionCardProps> = (props) => {
  return (
    <section class={`panel animate-floatin p-5 ${props.class ?? ""}`}>
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <p class="font-display text-lg font-semibold text-dawn-100">{props.title}</p>
          {props.subtitle ? <p class="mt-1 text-sm text-slate-300/80">{props.subtitle}</p> : null}
        </div>
        {props.actions}
      </div>
      {props.children}
    </section>
  );
};
