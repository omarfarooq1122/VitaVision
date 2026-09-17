import { Check, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type AppSelectOption = {
  value: string;
  label: string;
};

export function AppSelect({
  id,
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
  capitalize = false,
  disabled = false,
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly AppSelectOption[];
  ariaLabel?: string;
  className?: string;
  capitalize?: boolean;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn("group", capitalize && "capitalize", className)}
      >
        <SelectValue />
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-primary"
          aria-hidden="true"
        />
      </SelectTrigger>
      <SelectContent position="popper" sideOffset={6}>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={capitalize ? "capitalize" : undefined}
          >
            <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <span className="truncate">{option.label}</span>
              {option.value === value ? (
                <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
              ) : null}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}