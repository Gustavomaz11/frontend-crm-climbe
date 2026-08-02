import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, Mail, Phone, Save, ShieldCheck, UserRound } from "lucide-react";

import { AppPageShell } from "@/components/layout/AppPageShell";
import { UserAvatar } from "@/components/UserAvatar";
import { useAtualizarFotoPerfil, useAtualizarMeuPerfil, useMeuPerfil } from "@/services";
import { useAuthStore } from "@/store/useAuthStore";

const inputClass = "h-10 w-full rounded-lg border border-border/30 bg-background/55 px-3 text-[13px] outline-none transition-colors focus:border-accent/50";

export default function Perfil() {
  const { data: perfil, isLoading } = useMeuPerfil();
  const atualizarPerfil = useAtualizarMeuPerfil();
  const atualizarFoto = useAtualizarFotoPerfil();
  const setBasicUserData = useAuthStore((state) => state.setBasicUserData);
  const fileRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({ nomeCompleto: "", email: "", cpf: "", contato: "" });

  useEffect(() => {
    if (!perfil) return;
    setForm({
      nomeCompleto: perfil.nomeCompleto || "",
      email: perfil.email || "",
      cpf: perfil.cpf || "",
      contato: perfil.contato || "",
    });
  }, [perfil]);

  function sincronizarSessao(usuario: typeof perfil) {
    if (!usuario) return;
    setBasicUserData({
      id: usuario.id,
      nomeCompleto: usuario.nomeCompleto,
      email: usuario.email,
      fotoPerfil: usuario.fotoPerfil,
      cargoNome: usuario.cargo,
    });
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    try {
      const usuario = await atualizarPerfil.mutateAsync(form);
      sincronizarSessao(usuario);
      setFeedback("Perfil atualizado com sucesso.");
    } catch {
      setFeedback("Não foi possível atualizar o perfil. Confira os dados informados.");
    }
  }

  async function selecionarFoto(event: React.ChangeEvent<HTMLInputElement>) {
    const foto = event.target.files?.[0];
    if (!foto) return;
    setFeedback(null);
    try {
      const usuario = await atualizarFoto.mutateAsync(foto);
      sincronizarSessao(usuario);
      setFeedback("Foto de perfil atualizada.");
    } catch {
      setFeedback("Não foi possível enviar a foto. Use JPG, PNG, GIF ou BMP.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <AppPageShell>
      <div className="mx-auto w-full max-w-5xl px-6 py-7">
        <div className="mb-6">
          <h1 className="text-[24px] font-bold tracking-tight">Meu perfil</h1>
          <p className="mt-1 text-[12px] text-muted-foreground/55">Atualize suas informações pessoais e sua foto.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-xl border border-border/25 bg-card/40 p-16 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando perfil...
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
            <section className="rounded-xl border border-border/25 bg-card/45 p-6 text-center">
              <UserAvatar
                name={perfil?.nomeCompleto}
                photoUrl={perfil?.fotoPerfil}
                openProfileOnClick={false}
                className="mx-auto h-24 w-24 rounded-2xl"
                initialsClassName="text-2xl"
              />
              <h2 className="mt-4 text-[16px] font-semibold">{perfil?.nomeCompleto}</h2>
              <p className="mt-1 text-[11px] text-muted-foreground/55">{perfil?.cargo}</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={selecionarFoto} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={atualizarFoto.isPending}
                className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-accent/25 bg-accent/10 px-3 text-[12px] font-medium text-accent hover:bg-accent/15 disabled:opacity-50"
              >
                {atualizarFoto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Alterar foto
              </button>
              <div className="mt-6 rounded-lg border border-border/20 bg-background/35 p-3 text-left">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="h-4 w-4 text-accent" /> Cargo administrado pelo sistema</div>
              </div>
            </section>

            <form onSubmit={salvar} className="rounded-xl border border-border/25 bg-card/45 p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground"><UserRound className="h-3.5 w-3.5" /> Nome completo</span>
                  <input required className={inputClass} value={form.nomeCompleto} onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })} />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground"><Mail className="h-3.5 w-3.5" /> E-mail</span>
                  <input required type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </label>
                <label className="space-y-2">
                  <span className="text-[11px] font-medium text-muted-foreground">CPF</span>
                  <input required className={inputClass} value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                </label>
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground"><Phone className="h-3.5 w-3.5" /> Telefone para contato</span>
                  <input required className={inputClass} value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-[11px] font-medium text-muted-foreground">Cargo</span>
                  <input disabled className={`${inputClass} cursor-not-allowed opacity-60`} value={perfil?.cargo || "Sem cargo"} />
                </label>
              </div>
              {feedback && <p className="mt-5 flex items-center gap-2 text-[12px] text-accent"><Check className="h-4 w-4" />{feedback}</p>}
              <div className="mt-6 flex justify-end">
                <button disabled={atualizarPerfil.isPending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-[12px] font-semibold text-accent-foreground disabled:opacity-50">
                  {atualizarPerfil.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar alterações
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppPageShell>
  );
}
