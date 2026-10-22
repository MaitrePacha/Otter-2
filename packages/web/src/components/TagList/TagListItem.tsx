import {
  CheckCircleIcon,
  CheckFatIcon,
  HashIcon,
  TrashIcon,
  XCircleIcon,
} from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import type { MetaTag } from '@/utils/fetching/meta'

import { cn } from '../../utils/classnames'
import { IconButton } from '../IconButton'
import { SidebarLink } from '../SidebarLink'
import { useUser } from '../UserProvider'

interface PinUnpinTagProps {
  tag: string
  pinned: boolean
}

const PinUnpinTag = ({ tag, pinned }: PinUnpinTagProps) => {
  const { handleUpdateUISettings } = useUser()

  const handleTogglePinnedTag = () => {
    if (pinned) {
      handleUpdateUISettings({
        payload: tag,
        type: 'pinnedTagRemove',
      })
    } else {
      handleUpdateUISettings({ payload: tag, type: 'pinnedTagAdd' })
    }
  }
  return (
    <IconButton
      variant="taglist"
      size="s"
      onClick={handleTogglePinnedTag}
      className="pinButton"
    >
      {pinned ? (
        <XCircleIcon aria-label="pin" weight="duotone" size={18} />
      ) : (
        <CheckCircleIcon aria-label="pin" weight="duotone" size={18} />
      )}
    </IconButton>
  )
}

/**
 * Shown on hover in place of the count. The first click arms it (the trash
 * turns into a check), the second deletes the tag from every bookmark, as
 * Settings > Manage tags does. Leaving the row disarms it.
 */
const DeleteTag = ({
  tag,
  isArmed,
  onArm,
}: {
  tag: string
  isArmed: boolean
  onArm: () => void
}) => {
  const queryClient = useQueryClient()
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    if (!isArmed) {
      onArm()
      return
    }

    setIsPending(true)
    const response = await fetch('/api/tags', {
      body: JSON.stringify({ tag }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'DELETE',
    })
    setIsPending(false)

    if (response.ok) {
      toast.success(`Deleted ${tag}`)
      await queryClient.invalidateQueries()
    } else {
      toast.error(`Could not delete ${tag}`)
    }
  }

  return (
    <IconButton
      size="s"
      onClick={handleClick}
      disabled={isPending}
      className="tagListItem-delete"
      aria-label={isArmed ? `Confirm deleting ${tag}` : `Delete ${tag}`}
      title={isArmed ? 'Click again to delete' : 'Delete tag'}
    >
      {isArmed ? (
        <CheckFatIcon weight="regular" size={14} />
      ) : (
        <TrashIcon weight="duotone" size={16} />
      )}
    </IconButton>
  )
}

interface TagListItemProps extends MetaTag {
  pinned: boolean
}

export const TagListItem = ({ tag, count, pinned }: TagListItemProps) => {
  const [isArmed, setIsArmed] = useState(false)
  // Untagged is a filter, not a tag that can be deleted
  const canDelete = tag && tag !== 'Untagged'

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: leaving the row only disarms the delete button
    <div
      className={cn('tagListItem', isArmed && 'is-armed')}
      onMouseLeave={() => setIsArmed(false)}
    >
      <SidebarLink
        href={`/tag/${tag}`}
        count={count || 0}
        activePath={`/tag/${tag}`}
      >
        {pinned ? (
          <CheckCircleIcon aria-label="Pinned" size={18} weight="fill" />
        ) : (
          <HashIcon aria-label="tag" size={18} weight="duotone" />
        )}
        {tag}
      </SidebarLink>
      {tag ? <PinUnpinTag pinned={pinned} tag={tag} /> : null}
      {canDelete ? (
        <DeleteTag tag={tag} isArmed={isArmed} onArm={() => setIsArmed(true)} />
      ) : null}
    </div>
  )
}
