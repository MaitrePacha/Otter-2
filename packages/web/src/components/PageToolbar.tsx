import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

type PageToolbarContextType = {
  target: HTMLElement | null
  setTarget: (element: HTMLElement | null) => void
}

const PageToolbarContext = createContext<PageToolbarContextType | null>(null)

/**
 * Holds the page toolbar: the row under the top bar, stuck while scrolling,
 * where every page puts its buttons (filters, Select, Share, Add…).
 */
export const PageToolbarProvider = ({ children }: { children: ReactNode }) => {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const value = useMemo(() => ({ setTarget, target }), [target])

  return (
    <PageToolbarContext.Provider value={value}>
      {children}
    </PageToolbarContext.Provider>
  )
}

/** Where the toolbar is drawn, once, in the app layout */
export const PageToolbarSlot = () => {
  const context = useContext(PageToolbarContext)

  return <div className="otter-page-toolbar" ref={context?.setTarget} />
}

/** Renders its children in the page toolbar, centred on one row */
export const PageToolbar = ({ children }: { children: ReactNode }) => {
  const context = useContext(PageToolbarContext)

  if (!context?.target) {
    return null
  }

  return createPortal(
    <div className="otter-page-toolbar-row">{children}</div>,
    context.target,
  )
}
