export const validationFieldSelector = "input, select, textarea, [data-required-value], [data-validation-message]";

type NativeField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const isNativeField = (field: HTMLElement): field is NativeField =>
  field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement;

const labelText = (label: Element | null) => {
  if (!label) return "";
  const copy = label.cloneNode(true) as Element;
  copy.querySelectorAll("input, select, textarea, button, small, svg").forEach((child) => child.remove());
  return copy.textContent?.replace(/\*/g, "").replace(/\s+/g, " ").trim() || "";
};

const nearbyLabel = (field: HTMLElement) => {
  let container = field.parentElement;
  while (container && !container.hasAttribute("data-form-validation")) {
    const label = container.querySelector(":scope > label, :scope > span, :scope > p, :scope > h3");
    const text = labelText(label);
    if (text) return text;
    container = container.parentElement;
  }
  return "";
};

export const getFieldLabel = (field: HTMLElement) => {
  const labelledBy = field.getAttribute("aria-labelledby")?.split(/\s+/)
    .map((id) => labelText(document.getElementById(id))).join(" ");
  const nativeLabel = isNativeField(field) ? field.labels?.[0] : null;
  return (field.dataset.fieldLabel || labelledBy || field.getAttribute("aria-label")
    || labelText(nativeLabel) || labelText(field.closest("label"))
    || nearbyLabel(field)
    || field.getAttribute("placeholder") || "este campo").replace(/\*/g, "").trim();
};

export const getFieldError = (field: HTMLElement): string | null => {
  if (!field.isConnected || field.matches(":disabled") || field.closest("[data-validation-disabled='true']")) return null;
  if (isNativeField(field) && !field.willValidate) return null;

  const label = getFieldLabel(field);
  const missing = field.hasAttribute("data-required-value")
    ? !field.dataset.requiredValue?.trim()
    : isNativeField(field) && field.required && (field.validity.valueMissing || !field.value.trim());

  if (missing) {
    if (field.dataset.requiredMessage) return field.dataset.requiredMessage;
    const selection = field instanceof HTMLSelectElement || field.getAttribute("role") === "combobox"
      || field.hasAttribute("data-required-value");
    return `Por favor, ${selection ? "selecione uma opção em" : "preencha"} “${label}” para continuar.`;
  }
  if (field.dataset.validationMessage) return field.dataset.validationMessage;
  if (!isNativeField(field) || field.validity.valid) return null;
  if (field.validity.typeMismatch) return `Confira “${label}” e informe ${field instanceof HTMLInputElement && field.type === "email" ? "um e-mail válido" : "um valor válido"}.`;
  if (field.validity.rangeUnderflow) return `Informe um valor igual ou maior que ${field.getAttribute("min")} em “${label}”.`;
  if (field.validity.rangeOverflow) return `Informe um valor igual ou menor que ${field.getAttribute("max")} em “${label}”.`;
  return `Confira o valor de “${label}” para continuar.`;
};
