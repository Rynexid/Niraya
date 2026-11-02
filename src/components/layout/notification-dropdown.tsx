import { BellIcon } from 'lucide-react'

import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

/**
 * Notification dropdown. Items are placeholders; no notification backend
 * exists in this stage.
 */
export function NotificationDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label="Notifications"
        >
          <BellIcon className="size-4" aria-hidden="true" />
          <span
            className="absolute right-[-2px] top-[-2px] size-2.5 rounded-full bg-destructive"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => toast('Opening order #1024…')}
          className="gap-2"
        >
          <BellIcon className="size-4 shrink-0" aria-hidden="true" />
          New order #1024
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => toast('Checking stock…')}
          className="gap-2"
        >
          <BellIcon className="size-4 shrink-0" aria-hidden="true" />
          Low stock alert: Espresso beans
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => toast('Marked all as read')}
          className="gap-2 text-muted-foreground"
        >
          Mark all as read
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
