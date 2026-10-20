import {
  ArrowCounterClockwiseIcon,
  ChecksIcon,
  DownloadIcon,
  EyeIcon,
  EyeSlashIcon,
  MinusCircleIcon,
  PencilSimpleIcon,
  PlusCircleIcon,
  StarIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import type { BatchAction } from 'worker/bookmarks/batch'
import { Button } from '@/components/Button'
import type { Bookmark, BookmarkType } from '@/types/db'
import {
  batchUpdateBookmarks,
  updateBookmark,
} from '@/utils/fetching/bookmarks'
import { scrapeBookmarkUpdate } from '@/utils/fetching/scrape'
import { getTagsOptions } from '@/utils/fetching/tags'
import { getErrorMessage } from '@/utils/get-error-message'
import { Flex } from './Flex'
import { Input } from './Input'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'

const BOOKMARK_TYPES: BookmarkType[] = [
  'link',
  'article',
  'video',
  'audio',
  'recipe',
  'image',
  'document',
  'product',
  'game',
  'note',
  'event',
  'place',
]

interface BulkActionBarProps {
  selectedBookmarks: Bookmark[]
  totalCount: number
  /** In the trash the actions are restore and permanent delete */
  isTrash?: boolean
  onSelectAll: () => void
  onClear: () => void
}

export const BulkActionBar = ({
  selectedBookmarks,
  totalCount,
  isTrash = false,
  onSelectAll,
  onClear,
}: BulkActionBarProps) => {
  const queryClient = useQueryClient()
  const selectedIds = selectedBookmarks.map((bookmark) => bookmark.id)
  const tagListId = useId()
  const [tag, setTag] = useState('')
  const { data: tags } = useQuery(getTagsOptions())
  const { isPending, mutate } = useMutation({
    mutationFn: (action: BatchAction) =>
      batchUpdateBookmarks(selectedIds, action),
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
    onSuccess: async ({ data }, action) => {
      toast.success(
        `Updated ${data.updated} bookmark${data.updated === 1 ? '' : 's'}`,
      )
      if (['trash', 'restore', 'delete'].includes(action.type)) {
        onClear()
      }
      await queryClient.invalidateQueries()
    },
  })
  // Scraping runs one bookmark at a time from the browser: each page is a
  // separate fetch, so the Worker never scrapes many pages in one request
  const { isPending: isScraping, mutate: scrape } = useMutation({
    mutationFn: async () => {
      const targets = selectedBookmarks.filter((bookmark) => bookmark.url)
      const toastId = toast.loading(`Scraping 0/${targets.length}…`)
      let updated = 0
      let failed = 0

      for (const [index, bookmark] of targets.entries()) {
        toast.loading(`Scraping ${index + 1}/${targets.length}…`, {
          id: toastId,
        })
        try {
          const update = await scrapeBookmarkUpdate(bookmark.url as string)

          if (Object.keys(update).length) {
            await updateBookmark(bookmark.id, update)
            updated++
          }
        } catch {
          failed++
        }
      }

      return { failed, toastId, updated }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries()
    },
    onSuccess: ({ failed, toastId, updated }) => {
      const message = `Scraped ${updated} bookmark${updated === 1 ? '' : 's'}`

      if (failed) {
        toast.warning(`${message}, ${failed} failed`, { id: toastId })
      } else {
        toast.success(message, { id: toastId })
      }
    },
  })
  const isDisabled = isPending || isScraping || selectedIds.length === 0
  const trimmedTag = tag.trim()
  const isAllSelected = totalCount > 0 && selectedIds.length === totalCount

  // Each toggle offers whatever the selection is not entirely already
  const isAllStarred =
    selectedBookmarks.length > 0 &&
    selectedBookmarks.every((bookmark) => bookmark.star)
  const isAllPublic =
    selectedBookmarks.length > 0 &&
    selectedBookmarks.every((bookmark) => bookmark.public)

  const handleRemove = (field: 'description' | 'image') => {
    const count = selectedIds.length

    if (
      confirm(
        `Remove the ${field} of ${count} bookmark${count === 1 ? '' : 's'}? This cannot be undone.`,
      )
    ) {
      mutate({
        type: field === 'description' ? 'clearDescription' : 'clearImage',
      })
    }
  }

  const handleDelete = () => {
    const count = selectedIds.length

    if (
      confirm(
        `Permanently delete ${count} bookmark${count === 1 ? '' : 's'}? This cannot be undone.`,
      )
    ) {
      mutate({ type: 'delete' })
    }
  }

  // Icon-only buttons keep the row short; title doubles as the tooltip
  return (
    <>
      <span className="px-2xs text-step--2 text-theme11">
        {selectedIds.length} selected
      </span>
      <Button
        size="xs"
        variant="ghost"
        onClick={isAllSelected ? onClear : onSelectAll}
        aria-pressed={isAllSelected}
        aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
        title={isAllSelected ? 'Deselect all' : `Select all (${totalCount})`}
      >
        <ChecksIcon size={16} weight={isAllSelected ? 'bold' : 'regular'} />
      </Button>
      {isTrash ? (
        <>
          <Button
            size="xs"
            variant="ghost"
            disabled={isDisabled}
            onClick={() => mutate({ type: 'restore' })}
            aria-label="Un-delete"
            title="Un-delete"
          >
            <ArrowCounterClockwiseIcon size={16} weight="duotone" />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={isDisabled}
            onClick={handleDelete}
            aria-label="Permanently delete"
            title="Permanently delete"
          >
            <TrashIcon size={16} weight="duotone" />
          </Button>
        </>
      ) : (
        <>
          <Button
            size="xs"
            variant="ghost"
            disabled={isDisabled}
            onClick={() => mutate({ type: 'star', value: !isAllStarred })}
            aria-label={isAllStarred ? 'Unstar' : 'Star'}
            title={isAllStarred ? 'Unstar' : 'Star'}
          >
            <StarIcon size={16} weight={isAllStarred ? 'fill' : 'duotone'} />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={isDisabled}
            onClick={() => mutate({ type: 'public', value: !isAllPublic })}
            aria-label={isAllPublic ? 'Make private' : 'Make public'}
            title={isAllPublic ? 'Make private' : 'Make public'}
          >
            {isAllPublic ? (
              <EyeSlashIcon size={16} weight="duotone" />
            ) : (
              <EyeIcon size={16} weight="duotone" />
            )}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={isDisabled}
            onClick={() => scrape()}
            aria-label="Scrape"
            title="Scrape: update the description and image from each page"
          >
            <DownloadIcon size={16} weight="duotone" />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={isDisabled}
            onClick={() => mutate({ type: 'trash' })}
            aria-label="Trash"
            title="Trash"
          >
            <TrashIcon size={16} weight="duotone" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="xs"
                variant="ghost"
                disabled={isDisabled}
                aria-label="Edit tags, type…"
                title="Edit tags, type…"
              >
                <PencilSimpleIcon size={16} weight="duotone" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto" collisionPadding={16}>
              <Flex gap="2xs" direction="column">
                <Flex gap="3xs" align="center">
                  <Input
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
                  {/* No gap between the add and remove buttons */}
                  <Flex align="center">
                    <Button
                      size="2xs"
                      variant="ghost"
                      disabled={isDisabled || !trimmedTag}
                      onClick={() =>
                        mutate({ tag: trimmedTag, type: 'addTag' })
                      }
                      aria-label="Add tag"
                      title="Add tag"
                    >
                      <PlusCircleIcon size={16} weight="duotone" />
                    </Button>
                    <Button
                      size="2xs"
                      variant="ghost"
                      disabled={isDisabled || !trimmedTag}
                      onClick={() =>
                        mutate({ tag: trimmedTag, type: 'removeTag' })
                      }
                      aria-label="Remove tag"
                      title="Remove tag"
                    >
                      <MinusCircleIcon size={16} weight="duotone" />
                    </Button>
                  </Flex>
                </Flex>
                <Flex gap="3xs">
                  <select
                    aria-label="Set type"
                    className="input-base focus w-auto text-step--2"
                    disabled={isDisabled}
                    onChange={(event) =>
                      mutate({
                        type: 'setType',
                        value: event.target.value as BookmarkType,
                      })
                    }
                    value=""
                  >
                    <option value="" disabled hidden>
                      Set type…
                    </option>
                    {BOOKMARK_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Remove"
                    className="input-base focus w-auto text-step--2"
                    disabled={isDisabled}
                    onChange={(event) =>
                      handleRemove(
                        event.target.value as 'description' | 'image',
                      )
                    }
                    value=""
                  >
                    <option value="" disabled hidden>
                      Remove…
                    </option>
                    <option value="description">Description</option>
                    <option value="image">Image</option>
                  </select>
                </Flex>
              </Flex>
            </PopoverContent>
          </Popover>
        </>
      )}
    </>
  )
}
