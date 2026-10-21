import switchOffSfx from '@mrmartineau/kit/sounds/switch-off.mp3'
import switchOnSfx from '@mrmartineau/kit/sounds/switch-on.mp3'
import useSound from '@mrmartineau/use-sound'
import { PlusCircleIcon, XCircleIcon } from '@phosphor-icons/react'
import { useCanGoBack, useLocation, useRouter } from '@tanstack/react-router'
import { cn } from '@/utils/classnames'
import { ROUTE_HOME, ROUTE_NEW_BOOKMARK } from '../constants'
import { Link } from './Link'
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip'

export const FabAdd = () => {
  const location = useLocation()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const [playSwitchOn] = useSound(switchOnSfx)
  const [playSwitchOff] = useSound(switchOffSfx)

  // On the add form the button closes it instead
  if (location.pathname === ROUTE_NEW_BOOKMARK) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={ROUTE_HOME}
            variant="fab"
            aria-label="Close the form"
            onClick={(event) => {
              playSwitchOff()
              if (canGoBack) {
                event.preventDefault()
                router.history.back()
              }
            }}
          >
            <XCircleIcon size="24" weight="duotone" color="currentColor" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>Close</TooltipContent>
      </Tooltip>
    )
  }

  const disableFab = location.pathname.includes('edit')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={ROUTE_NEW_BOOKMARK}
          variant="fab"
          aria-label="Add new bookmark"
          onClick={(event) => {
            if (disableFab) {
              event.preventDefault()
            } else {
              playSwitchOn()
            }
          }}
          className={cn(disableFab && 'pointer-events-none opacity-30')}
        >
          <PlusCircleIcon size="24" weight="duotone" color="currentColor" />
        </Link>
      </TooltipTrigger>
      <TooltipContent>Add new bookmark</TooltipContent>
    </Tooltip>
  )
}
