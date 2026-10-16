import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ChevronRight, Clock, MapPin, X } from "lucide-react";
import type { Reuniao } from "@/services/useReunioes";
import { ReuniaoDetalhes } from "./ReuniaoDetalhes";
import { reuniaoCliente, reuniaoHorario } from "./reuniaoPresentation";

export interface DiaReunioesAberto {
  data: string;
  reuniaoId?: number;
}

interface Props extends DiaReunioesAberto {
  reunioes: Reuniao[];
  onClose: () => void;
}

export const ReunioesDiaModal = ({ data, reuniaoId, reunioes, onClose }: Props) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [selectedId, setSelectedId] = useState<number | null>(reuniaoId ?? null);
  const selected = reunioes.find((reuniao) => reuniao.id === selectedId);
  const dayLabel = new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");

  useEffect(() => {
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  return createPortal(<dialog ref={dialog} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} className="m-auto w-[calc(100%_-_24px)] max-w-2xl overflow-hidden rounded-2xl border border-border/40 bg-card p-0 text-foreground shadow-2xl backdrop:bg-background/80 backdrop:backdrop-blur-md">
    <div className="flex max-h-[85vh] flex-col">
      <header className="flex shrink-0 items-start gap-3 border-b border-border/25 p-5">
        {selected && <button type="button" onClick={() => setSelectedId(null)} aria-label="Voltar à lista de reuniões" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/20 hover:text-foreground"><ArrowLeft className="h-4 w-4" /></button>}
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-accent">{selected ? `Reunião · ${dayLabel}` : "Agenda do dia"}</p>
          <h2 id={titleId} className="break-words text-base font-semibold">{selected?.titulo ?? `Reuniões em ${dayLabel}`}</h2>
          {!selected && <p className="mt-1 text-xs text-muted-foreground">Selecione uma reunião para ver os detalhes.</p>}
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar reuniões do dia" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/20 hover:text-foreground"><X className="h-4 w-4" /></button>
      </header>
      <div className="min-h-0 overflow-y-auto p-5">
        {selected ? <ReuniaoDetalhes key={selected.id} reuniao={selected} /> : <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{reunioes.length} {reunioes.length === 1 ? "reunião" : "reuniões"} neste dia</p>
          {reunioes.map((reuniao) => <button key={reuniao.id} type="button" onClick={() => setSelectedId(reuniao.id)} className="group flex w-full items-center gap-3 rounded-xl border border-border/30 bg-background/40 p-4 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            <div className="min-w-0 flex-1 space-y-2">
              <p className="break-words text-sm font-semibold">{reuniao.titulo}</p>
              <p className="flex items-center gap-1.5 text-xs text-accent"><Clock className="h-3.5 w-3.5 shrink-0" />{reuniaoHorario(reuniao)}</p>
              <p className="text-xs text-muted-foreground">{reuniaoCliente(reuniao)} · {reuniao.presencial ? "Presencial" : "Virtual"}</p>
              {reuniao.local && <p className="flex items-start gap-1.5 break-words text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{reuniao.local}</p>}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-accent" />
          </button>)}
          {!reunioes.length && <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma reunião neste dia.</p>}
        </div>}
      </div>
    </div>
  </dialog>, document.body);
};
