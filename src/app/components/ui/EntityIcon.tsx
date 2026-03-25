import { Show, createSignal } from "solid-js";
import { getInitials } from "@/app/utils/media";

interface EntityIconProps {
  src?: string;
  alt: string;
  label: string;
  shape?: "circle" | "square";
  sizeClass?: string;
}

export function EntityIcon(props: EntityIconProps) {
  const [broken, setBroken] = createSignal(false);
  const shapeClass = () => (props.shape === "circle" ? "rounded-full" : "rounded-2xl");
  const sizeClass = () => props.sizeClass ?? "h-12 w-12";

  return (
    <Show
      when={props.src && !broken()}
      fallback={
        <div
          class={`${sizeClass()} ${shapeClass()} flex shrink-0 items-center justify-center border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300`}
          aria-label={props.alt}
        >
          {getInitials(props.label)}
        </div>
      }
    >
      <img
        src={props.src}
        alt={props.alt}
        loading="lazy"
        class={`${sizeClass()} ${shapeClass()} shrink-0 border border-white/10 bg-black/20 object-cover`}
        onError={() => setBroken(true)}
      />
    </Show>
  );
}
