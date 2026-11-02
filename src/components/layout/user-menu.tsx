import { ChevronDownIcon } from 'lucide-react'

import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

/**
 * Account dropdown. "Sign out" is a placeholder; no real authentication or
 * session management exists in this stage.
 */
export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 px-2">
          <Avatar className="size-6">
            <AvatarFallback>AU</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium">Admin User</span>
          <ChevronDownIcon aria-hidden="true" className="size-3.5 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Admin User</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            toast('Sign out is a UI placeholder', {
              description: 'Real authentication will be added in a later stage.',
            })
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
