'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import type { ActionState } from '@/lib/actions';
import type { FieldType } from '@/lib/objects';

export interface FormFieldProps {
  name: string;
  label: string;
  type: FieldType;
  section: string;
  required?: boolean;
  full?: boolean;
  help?: string;
  options?: { value: string; label: string }[];
}

type FormValue = string | number | boolean | null | undefined;

export function RecordForm({
  fields,
  sections,
  values,
  action,
  cancelHref,
  submitLabel = 'Save',
}: {
  fields: FormFieldProps[];
  sections: string[];
  values: Record<string, FormValue>;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  cancelHref: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="card">
      {state.error && (
        <div role="alert" className="m-4 mb-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {sections.map((section) => {
        const sectionFields = fields.filter((f) => f.section === section);
        if (!sectionFields.length) return null;
        return (
          <fieldset key={section} className="border-b border-line px-5 py-5 last:border-b-0">
            <legend className="sr-only">{section}</legend>
            <h3 className="mb-4 text-sm font-semibold text-ink">{section}</h3>
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              {sectionFields.map((f) => (
                <div key={f.name} className={f.full ? 'md:col-span-2' : undefined}>
                  <Input field={f} value={values[f.name]} />
                </div>
              ))}
            </div>
          </fieldset>
        );
      })}
      <div className="sticky bottom-0 flex justify-end gap-2 rounded-b-xl border-t border-line bg-slate-50/95 px-5 py-3 backdrop-blur">
        <Link href={cancelHref} className="btn">
          Cancel
        </Link>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Input({ field, value }: { field: FormFieldProps; value: FormValue }) {
  const id = `f-${field.name}`;
  const str = value === null || value === undefined ? '' : String(value);
  const label = (
    <label htmlFor={id} className="field-label">
      {field.required && <span className="mr-0.5 text-red-600">*</span>}
      {field.label}
    </label>
  );
  const help = field.help ? <p className="mt-1 text-xs text-muted">{field.help}</p> : null;

  if (field.type === 'checkbox') {
    return (
      <div className="flex items-center gap-2 pt-5">
        <input id={id} name={field.name} type="checkbox" defaultChecked={Boolean(value)} className="h-4 w-4 rounded border-line accent-brand-600" />
        <label htmlFor={id} className="text-sm text-ink">
          {field.label}
        </label>
      </div>
    );
  }

  if (field.type === 'picklist' || field.type === 'lookup') {
    const options = field.options ?? [];
    const hasValue = str === '' || options.some((o) => o.value === str);
    return (
      <>
        {label}
        <select id={id} name={field.name} defaultValue={str} required={field.required} className="input">
          {!field.required || str === '' ? <option value="">{field.type === 'lookup' ? '— None —' : '— None —'}</option> : null}
          {!hasValue && <option value={str}>{str}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {help}
      </>
    );
  }

  if (field.type === 'textarea') {
    return (
      <>
        {label}
        <textarea id={id} name={field.name} defaultValue={str} required={field.required} rows={4} className="input" />
        {help}
      </>
    );
  }

  const inputType =
    field.type === 'email'
      ? 'email'
      : field.type === 'phone'
        ? 'tel'
        : field.type === 'date'
          ? 'date'
          : field.type === 'number' || field.type === 'currency' || field.type === 'percent'
            ? 'number'
            : 'text';

  return (
    <>
      {label}
      <input
        id={id}
        name={field.name}
        type={inputType}
        defaultValue={str}
        required={field.required}
        step={field.type === 'currency' ? '0.01' : field.type === 'number' || field.type === 'percent' ? 'any' : undefined}
        min={field.type === 'percent' ? 0 : undefined}
        max={field.type === 'percent' ? 100 : undefined}
        inputMode={field.type === 'url' ? 'url' : undefined}
        className="input"
      />
      {help}
    </>
  );
}
