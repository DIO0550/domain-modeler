type InputProps = Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}>;

type CheckboxProps = Readonly<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}>;

type SelectProps = Readonly<Omit<InputProps, "autoFocus"> & { options: readonly string[] }>;

function Input({ label, value, onChange, disabled, autoFocus }: InputProps) {
  return <label>{label}<input aria-label={label} value={value} disabled={disabled} autoFocus={autoFocus}
    onChange={(event) => onChange(event.target.value)} /></label>;
}

function Checkbox({ label, checked, onChange, disabled }: CheckboxProps) {
  return <label className="state-machine-screen__checkbox"><input type="checkbox" checked={checked} disabled={disabled}
    onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}

function Select({ label, value, options, onChange, disabled }: SelectProps) {
  return <label>{label}<select aria-label={label} value={value} disabled={disabled}
    onChange={(event) => onChange(event.target.value)}>
    {options.map((option) => <option key={option} value={option}>{option}</option>)}
  </select></label>;
}

/** ステートマシンの追加・編集フォームで使う入力部品。 */
export const StateMachineForm = { Input, Checkbox, Select } as const;
