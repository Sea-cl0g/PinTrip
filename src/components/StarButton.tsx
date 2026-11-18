import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type StarButtonProps = {
  count: number
  isLiked: boolean
  onClick: () => void
}

export function StarButton({ count, isLiked, onClick }: StarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={isLiked ? "いいねを解除" : "いいねする"}
      aria-pressed={isLiked}
      onClick={onClick}
      className="tabular-nums"
    >
      <Star aria-hidden="true" className={cn(isLiked && "fill-current")} />
      <span>{count}</span>
    </Button>
  )
}
