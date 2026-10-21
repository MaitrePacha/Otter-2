import { createFileRoute } from '@tanstack/react-router'
import { CodeBlock } from '@/components/CodeBlock'
import { UpdateInfoForm } from '@/components/UpdateInfoForm'
import { useUser } from '@/components/UserProvider'
import { SIDEBAR_SECTIONS, type SidebarSection } from '@/types/db'
import { getSession } from '@/utils/fetching/user'

export const Route = createFileRoute('/_app/settings/account')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Account settings',
      },
    ],
  }),
  loader: async () => {
    const session = await getSession()
    return session?.user ?? null
  },
})

const SECTION_LABELS: Record<SidebarSection, string> = {
  collections: 'Collections',
  dashboard: 'Dashboard',
  journal: 'Journal',
  media: 'Media',
  public: 'Public',
  seeLater: 'See later',
  stars: 'Stars',
  tags: 'Tags',
  toots: 'Toots (Mastodon)',
  top: 'Top links',
  tweets: 'Tweets',
  types: 'Types',
}

const SidebarSectionsSetting = () => {
  const { profile, handleUpdateUISettings } = useUser()
  const hidden = profile?.settings_hidden_sections ?? []

  return (
    <fieldset className="flex flex-wrap gap-x-m gap-y-2xs">
      <legend className="mb-2xs">Show in the sidebar</legend>
      {SIDEBAR_SECTIONS.map((section) => (
        <label key={section} className="flex items-center gap-2xs">
          <input
            type="checkbox"
            className="size-5 shrink-0 cursor-pointer accent-accent9"
            checked={!hidden.includes(section)}
            onChange={(event) =>
              handleUpdateUISettings({
                payload: event.target.checked
                  ? hidden.filter((item) => item !== section)
                  : [...hidden, section],
                type: 'settings_hidden_sections',
              })
            }
          />
          {SECTION_LABELS[section]}
        </label>
      ))}
    </fieldset>
  )
}

function RouteComponent() {
  const user = Route.useLoaderData()

  return (
    <article className="flow">
      <h3>User info</h3>
      Account ID: <CodeBlock>{user?.id}</CodeBlock>
      <h3>Update account</h3>
      <UpdateInfoForm user={user} />
      <h3>Preferences</h3>
      <SidebarSectionsSetting />
    </article>
  )
}
