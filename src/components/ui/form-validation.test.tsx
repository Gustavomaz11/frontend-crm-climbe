import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormValidation } from "./form-validation";

describe("required field feedback", () => {
  it("blocks empty and whitespace-only values, describes each error and focuses the first field", () => {
    const submit = vi.fn((event) => event.preventDefault());
    render(<FormValidation as="form" onSubmit={submit}>
      <label>Nome *<input required defaultValue="   " /></label>
      <label>Empresa *<select required defaultValue=""><option value="">Selecione</option><option value="1">Climb</option></select></label>
      <button>Enviar</button>
    </FormValidation>);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Enviar"));
    const name = screen.getByRole("textbox");
    expect(submit).not.toHaveBeenCalled();
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute("data-field-error", "true");
    expect(name).toHaveAccessibleDescription("Por favor, preencha “Nome” para continuar.");
    expect(screen.getByRole("combobox")).toHaveAccessibleDescription("Por favor, selecione uma opção em “Empresa” para continuar.");
  });

  it("clears only corrected fields immediately and submits after all required values are valid", () => {
    const submit = vi.fn((event) => event.preventDefault());
    render(<FormValidation as="form" onSubmit={submit}>
      <label>Nome *<input required /></label>
      <label>E-mail *<input required type="email" /></label>
      <button>Salvar</button>
    </FormValidation>);
    fireEvent.click(screen.getByText("Salvar"));
    const [name, email] = screen.getAllByRole("textbox");
    fireEvent.change(name, { target: { value: "Ana" } });
    expect(name).not.toHaveAttribute("data-field-error");
    expect(email).toHaveAttribute("data-field-error", "true");
    fireEvent.change(email, { target: { value: "ana@climbe.com.br" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(email).not.toHaveAttribute("aria-invalid");
    fireEvent.click(screen.getByText("Salvar"));
    expect(submit).toHaveBeenCalledOnce();
  });

  it("also handles keyboard form submission", () => {
    const submit = vi.fn();
    const { container } = render(<FormValidation as="form" onSubmit={submit}><input required aria-label="Nome" /></FormValidation>);
    fireEvent.submit(container.querySelector("form")!);
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("preencha “Nome”");
  });

  it("blocks dialog save buttons but permits cancel actions", () => {
    const save = vi.fn();
    const cancel = vi.fn();
    render(<FormValidation as="section"><label>Título *<input required /></label>
      <button type="button" data-validate-submit onClick={save}>Salvar</button>
      <button type="button" onClick={cancel}>Cancelar</button>
    </FormValidation>);
    fireEvent.click(screen.getByText("Cancelar"));
    expect(cancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Salvar"));
    expect(save).not.toHaveBeenCalled();
    fireEvent.input(screen.getByRole("textbox"), { target: { value: "Reunião" } });
    fireEvent.click(screen.getByText("Salvar"));
    expect(save).toHaveBeenCalledOnce();
  });

  it("clears group feedback after a selection or when a conditional requirement is removed", () => {
    const GroupForm = () => {
      const [selected, setSelected] = useState(false);
      const [required, setRequired] = useState(true);
      return <FormValidation><div tabIndex={-1} role="group" data-field-label="Empresas" data-required-value={required ? (selected ? "1" : "") : undefined}>
        <button onClick={() => setSelected((current) => !current)}>Escolher empresa</button>
      </div><button onClick={() => setRequired(false)}>Tornar opcional</button><button data-validate-submit>Salvar</button></FormValidation>;
    };
    render(<GroupForm />);
    fireEvent.click(screen.getByText("Salvar"));
    expect(screen.getByRole("group")).toHaveAttribute("data-field-error", "true");
    fireEvent.click(screen.getByText("Escolher empresa"));
    expect(screen.getByRole("group")).not.toHaveAttribute("data-field-error");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Escolher empresa"));
    fireEvent.click(screen.getByText("Salvar"));
    expect(screen.getByRole("group")).toHaveAttribute("data-field-error", "true");
    fireEvent.click(screen.getByText("Tornar opcional"));
    expect(screen.getByRole("group")).not.toHaveAttribute("data-field-error");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ignores disabled fields and optional empty fields", () => {
    const save = vi.fn();
    render(<FormValidation><input required disabled /><input type="email" aria-label="E-mail opcional" /><button data-validate-submit onClick={save}>Salvar</button></FormValidation>);
    fireEvent.click(screen.getByText("Salvar"));
    expect(save).toHaveBeenCalledOnce();
  });

  it("uses a clear upload message and clears feedback when a file is dropped", () => {
    const Upload = () => {
      const [hasFile, setHasFile] = useState(false);
      return <FormValidation><div role="button" tabIndex={0} data-required-value={hasFile ? "file" : ""}
        data-required-message="Por favor, escolha um arquivo para enviar o documento." onDrop={() => setHasFile(true)}>Arquivo *</div>
        <button data-validate-submit>Enviar arquivo</button></FormValidation>;
    };
    render(<Upload />);
    fireEvent.click(screen.getByText("Enviar arquivo"));
    expect(screen.getByRole("alert")).toHaveTextContent("Por favor, escolha um arquivo para enviar o documento.");
    fireEvent.drop(screen.getByText("Arquivo *"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Arquivo *")).not.toHaveAttribute("data-field-error");
  });

  it("keeps nested forms independent", () => {
    const save = vi.fn();
    render(<FormValidation><input required aria-label="Campo externo" />
      <FormValidation as="form" onSubmit={(event) => { event.preventDefault(); save(); }}><input required defaultValue="Preenchido" /><button>Salvar interno</button></FormValidation>
    </FormValidation>);
    fireEvent.click(screen.getByText("Salvar interno"));
    expect(save).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("preserves browser format and range constraints", () => {
    render(<FormValidation><label>E-mail<input type="email" defaultValue="incorreto" /></label>
      <label>Prazo *<input type="date" required min="2026-10-08" defaultValue="2026-10-07" /></label><button data-validate-submit>Salvar</button></FormValidation>);
    fireEvent.click(screen.getByText("Salvar"));
    expect(screen.getByRole("alert")).toHaveTextContent("um e-mail válido");
    expect(screen.getByRole("alert")).toHaveTextContent("igual ou maior que 2026-10-08");
  });
});
