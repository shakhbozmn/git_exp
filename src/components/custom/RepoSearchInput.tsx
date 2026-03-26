import * as React from "react"
import { XIcon, SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface RepoSearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  onClear: () => void
  isLoading: boolean
  label: string
  placeholder?: string
  className?: string
}

export function RepoSearchInput({
  value,
  onChange,
  onSearch,
  onClear,
  isLoading,
  label,
  placeholder = "owner/repo",
  className,
}: RepoSearchInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch()
    }
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="pr-8"
          />
          {value && (
            <button
              type="button"
              onClick={onClear}
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:pointer-events-none"
              aria-label="Clear"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>
        <Button onClick={onSearch} disabled={isLoading || !value.trim()}>
          {isLoading ? <Spinner /> : <SearchIcon className="size-4" />}
          <span className="sr-only">Search</span>
        </Button>
      </div>
    </div>
  )
}
