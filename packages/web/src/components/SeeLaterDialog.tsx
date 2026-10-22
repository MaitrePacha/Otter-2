import { EyeIcon, PlusIcon, StarIcon, TrashIcon } from '@phosphor-icons/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'
import type { Bookmark } from '@/types/db'
import { updateBookmark } from '@/utils/fetching/bookmarks'
import { getTagsOptions } from '@/utils/fetching/tags'
import { getErrorMessage } from '@/utils/get-error-message'
import { Button } from './Button'
import { Dialog, DialogContent } from './Dialog'
import { Flex } from './Flex'
import { Input } from './Input'

// The form a link's href takes once the browser has parsed it
const toHref = (url: string) => {
  try {
    return new URL(url).href
  } catch {
    return url
  }
}

/**
 * Remembers which See later bookmark's title was clicked, and when the user
 * comes back to Otter (the page turns visible again, as it does when the
 * bookmark's tab is closed) asks what to do with it. The page must have been
 * hidden in between, so a link opened in a background tab asks nothing.
 */
export const useSeeLaterReturn = (items: Bookmark[]) => {
  const openedRef = useRef<{ bookmark: Bookmark; wasHidden: boolean } | null>(
    null,
  )
  const [returned, setReturned] = useState<Bookmark | null>(null)

  useEffect(() => {
    const handleVisibilityChange = () => {
      const opened = openedRef.current

      if (!opened) {
        return
      }

      if (document.visibilityState === 'hidden') {
        opened.wasHidden = true
      } else if (opened.wasHidden) {
        openedRef.current = null
        setReturned(opened.bookmark)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Left or middle click on a bookmark title
  const handleLinkClick = (event: MouseEvent) => {
    const href = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      'a.link-feed-title',
    )?.href
    const bookmark = href
      ? items.find((item) => item.url && toHref(item.url) === href)
      : undefined

    if (bookmark) {
      openedRef.current = { bookmark, wasHidden: false }
    }
  }

  return {
    clear: () => setReturned(null),
    handleLinkClick,
    returned,
  }
}

interface SeeLaterDialogProps {
  bookmark: Bookmark | null
  onClose: () => void
}

/**
 * Trash, star or make public the bookmark just seen, or tag it: trashing and
 * tagging take it off the See later list
 */
export const SeeLaterDialog = ({ bookmark, onClose }: SeeLaterDialogProps) => {
  const queryClient = useQueryClient()
  const tagListId = useId()
  const { data: tags } = useQuery(getTagsOptions())
  const [tag, setTag] = useState('')
  const [isPending, setIsPending] = useState(false)
  // Star and public stay open to change, so the dialog shows their state
  const [current, setCurrent] = useState<Bookmark | null>(bookmark)

  useEffect(() => {
    setCurrent(bookmark)
    setTag('')
  }, [bookmark])

  const update = async (
    data: Partial<Bookmark>,
    message: string,
    close: boolean,
  ): Promise<void> => {
    if (!current) {
      return
    }

    setIsPending(true)
    try {
      await updateBookmark(current.id, data)
      setCurrent({ ...current, ...data })
      await queryClient.invalidateQueries()
      toast.success(message, { description: current.title ?? undefined })
      if (close) {
        onClose()
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsPending(false)
    }
  }

  const trimmedTag = tag.trim()

  const tagBookmark = () => {
    if (current && trimmedTag) {
      update(
        {
          see_later: false,
          tags: [...new Set([...(current.tags ?? []), trimmedTag])],
        },
        `Tagged ${trimmedTag}`,
        true,
      )
    }
  }

  return (
    <Dialog
      open={Boolean(bookmark)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        title="Done with it?"
        width="s"
        // The small size is as wide as the sidebar on large screens; widen it
        // there for the tag field. Phones keep the full-screen dialog.
        style={{ '--sidebar-width': '24rem' } as CSSProperties}
      >
        <Flex direction="column" gap="m">
          {/* Long titles and bare URLs wrap, up to three lines */}
          <p className="mt-2xs line-clamp-3 text-step--1 text-theme10 [overflow-wrap:anywhere]">
            {current?.title ?? current?.url}
          </p>
          <div className="grid grid-cols-3 gap-2xs [&_svg]:shrink-0">
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() =>
                update(
                  { see_later: false, status: 'inactive' },
                  'Moved to the trash',
                  true,
                )
              }
            >
              <TrashIcon size={18} weight="duotone" /> Trash
            </Button>
            <Button
              variant="outline"
              disabled={isPending}
              aria-pressed={current?.star}
              onClick={() =>
                update(
                  { star: !current?.star },
                  current?.star ? 'Unstarred' : 'Starred',
                  false,
                )
              }
            >
              <StarIcon size={18} weight={current?.star ? 'fill' : 'duotone'} />
              {current?.star ? 'Unstar' : 'Star'}
            </Button>
            <Button
              variant="outline"
              disabled={isPending}
              aria-pressed={current?.public}
              onClick={() =>
                update(
                  { public: !current?.public },
                  current?.public ? 'Made private' : 'Made public',
                  false,
                )
              }
            >
              <EyeIcon
                size={18}
                weight={current?.public ? 'fill' : 'duotone'}
              />
              {current?.public ? 'Private' : 'Public'}
            </Button>
          </div>
          <form
            className="flex items-center gap-2xs"
            onSubmit={(event) => {
              event.preventDefault()
              tagBookmark()
            }}
          >
            <Input
              className="min-w-0 flex-1"
              aria-label="Tag"
              list={tagListId}
              onChange={(event) => setTag(event.target.value)}
              placeholder="Tag (collection:tag)"
              value={tag}
            />
            <datalist id={tagListId}>
              {tags?.map(({ tag: suggestion }) =>
                suggestion ? (
                  <option key={suggestion} value={suggestion} />
                ) : null,
              )}
            </datalist>
            <Button
              type="submit"
              disabled={isPending || !trimmedTag}
              aria-label="Add tag"
              title="Add tag"
            >
              <PlusIcon size={18} weight="bold" />
            </Button>
          </form>
        </Flex>
      </DialogContent>
    </Dialog>
  )
}
