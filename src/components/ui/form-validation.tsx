import { useId, useLayoutEffect, useRef, useState, type FormEvent, type HTMLAttributes, type MouseEvent, type Ref } from "react";
import { getFieldError, validationFieldSelector } from "./field-validation";

interface FormValidationProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "form";
}

interface FieldError {
  field: HTMLElement;
  message: string;
}

/** Uses the browser's constraints, including fields submitted by dialog buttons. */
export const FormValidation = ({ as: Element = "div", children, onSubmitCapture, onClickCapture, onInputCapture, onChangeCapture, ...props }: FormValidationProps) => {
  const scopeRef = useRef<HTMLElement>(null);
  const errorId = useId();
  const [errors, setErrors] = useState<FieldError[]>([]);
  const owns = (field: HTMLElement) => field.closest("[data-form-validation]") === scopeRef.current;

  const clearResolvedErrors = () => setErrors((current) => {
    const remaining = current.flatMap(({ field }) => {
      const message = owns(field) ? getFieldError(field) : null;
      return message ? [{ field, message }] : [];
    });
    return remaining.length === current.length && remaining.every((error, index) => error.message === current[index].message)
      ? current : remaining;
  });

  useLayoutEffect(() => {
    clearResolvedErrors();
  });

  useLayoutEffect(() => {
    const originalAttributes = errors.map(({ field }, index) => {
      const invalid = field.getAttribute("aria-invalid");
      const description = field.getAttribute("aria-describedby");
      field.setAttribute("data-field-error", "true");
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", [description, `${errorId}-${index}`].filter(Boolean).join(" "));
      return { field, invalid, description };
    });
    return () => originalAttributes.forEach(({ field, invalid, description }) => {
      field.removeAttribute("data-field-error");
      if (invalid === null) field.removeAttribute("aria-invalid");
      else field.setAttribute("aria-invalid", invalid);
      if (description === null) field.removeAttribute("aria-describedby");
      else field.setAttribute("aria-describedby", description);
    });
  }, [errors, errorId]);

  const validate = (event: FormEvent<HTMLElement> | MouseEvent<HTMLElement>) => {
    if (!scopeRef.current) return;
    const nextErrors = Array.from(scopeRef.current.querySelectorAll<HTMLElement>(validationFieldSelector))
      .filter(owns).flatMap((field) => {
        const message = getFieldError(field);
        return message ? [{ field, message }] : [];
      });
    setErrors(nextErrors);
    if (!nextErrors.length) return;
    event.preventDefault();
    event.stopPropagation();
    nextErrors[0].field.focus();
    nextErrors[0].field.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  };

  return (
    <Element
      {...props}
      ref={scopeRef as Ref<HTMLDivElement & HTMLFormElement>}
      data-form-validation="true"
      {...(Element === "form" ? { noValidate: true } : {})}
      onSubmitCapture={(event) => {
        if (owns(event.target as HTMLElement)) validate(event);
        if (!event.isPropagationStopped()) onSubmitCapture?.(event);
      }}
      onClickCapture={(event) => {
        const submit = (event.target as HTMLElement).closest("[data-validate-submit]");
        if (submit && owns(submit as HTMLElement)) validate(event);
        if (!event.isPropagationStopped()) onClickCapture?.(event);
      }}
      onInputCapture={(event) => { clearResolvedErrors(); onInputCapture?.(event); }}
      onChangeCapture={(event) => { clearResolvedErrors(); onChangeCapture?.(event); }}
    >
      {children}
      {errors.length > 0 && (
        <div role="alert" className="form-validation-summary">
          <p className="font-semibold">Falta pouco! Confira os campos destacados para continuar.</p>
          <ul className="mt-1 space-y-1">
            {errors.map(({ field, message }, index) => <li id={`${errorId}-${index}`} key={index}>
              <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => field.focus()}>{message}</button>
            </li>)}
          </ul>
        </div>
      )}
    </Element>
  );
};
