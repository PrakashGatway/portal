// src/components/ui/dropdown/Dropdown.tsx
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

interface DropdownContextType {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  toggleOpen: () => void
}

const DropdownContext = React.createContext<DropdownContextType | undefined>(undefined)

const useDropdownContext = () => {
  const context = React.useContext(DropdownContext)
  if (!context) {
    throw new Error("Dropdown components must be used within a <DropdownMenu>")
  }
  return context
}

interface DropdownMenuProps {
  children: React.ReactNode
  defaultOpen?: boolean
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  defaultOpen = false,
}) => {
  const [open, setOpen] = React.useState(defaultOpen)

  const toggleOpen = React.useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  React.useEffect(() => {
    if (open) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        // Check if click is outside the dropdown
        if (!target.closest('[data-dropdown-menu]')) {
          setOpen(false)
        }
      }

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen, toggleOpen }}>
      <div className="relative inline-block" data-dropdown-menu>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  className?: string
  asChild?: boolean
}

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, className = "", asChild = false, ...props }, ref) => {
    const { open } = useDropdownContext()

    if (asChild) {
      const child = React.Children.only(children) as React.ReactElement
      return React.cloneElement(child, {
        onClick: (e: React.MouseEvent) => {
          child.props.onClick?.(e)
          useDropdownContext().toggleOpen()
        },
        'aria-expanded': open,
        'aria-haspopup': true,
        'data-state': open ? 'open' : 'closed',
      })
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => useDropdownContext().toggleOpen()}
        className={`inline-flex items-center justify-center outline-none ${className}`}
        aria-expanded={open}
        aria-haspopup={true}
        data-state={open ? 'open' : 'closed'}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end"
  sideOffset?: number
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  className = "",
  align = "center",
  sideOffset = 4,
}) => {
  const { open } = useDropdownContext()

  const alignmentClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ 
            duration: 0.15,
            ease: "easeOut"
          }}
          className={`
            absolute z-50 
            mt-${sideOffset}
            min-w-[12rem] 
            rounded-xl 
            border border-gray-200 
            bg-white 
            p-1 
            shadow-lg 
            shadow-black/5
            backdrop-blur-sm
            dark:border-gray-700 
            dark:bg-gray-800
            dark:shadow-black/20
            ${alignmentClasses[align]}
            ${className}
          `}
          style={{ marginTop: `${sideOffset}px` }}
        >
          <div className="flex flex-col gap-0.5">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  destructive?: boolean
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  className = "",
  onClick,
  disabled = false,
  destructive = false,
}) => {
  const { setOpen } = useDropdownContext()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled && onClick) {
      onClick(e)
      setOpen(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`
        flex w-full items-center 
        rounded-lg px-3 py-2 
        text-sm font-medium
        transition-all duration-150
        outline-none
        ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        }
        ${
          destructive
            ? "text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 dark:focus:bg-red-900/20"
            : "text-gray-700 hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50 dark:focus:bg-gray-700/50"
        }
        ${className}
      `}
    >
      {children}
    </button>
  )
}

interface DropdownMenuSeparatorProps {
  className?: string
}

export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`my-1 h-px bg-gray-200 dark:bg-gray-700 ${className}`}
      role="separator"
      aria-orientation="horizontal"
    />
  )
}

interface DropdownMenuLabelProps {
  children: React.ReactNode
  className?: string
}

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${className}`}
    >
      {children}
    </div>
  )
}

interface DropdownMenuCheckboxItemProps {
  children: React.ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

export const DropdownMenuCheckboxItem: React.FC<DropdownMenuCheckboxItemProps> = ({
  children,
  checked,
  onCheckedChange,
  className = "",
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) {
          onCheckedChange(!checked)
        }
      }}
      disabled={disabled}
      className={`
        flex w-full items-center gap-2
        rounded-lg px-3 py-2 
        text-sm
        transition-all duration-150
        ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
        }
        ${className}
      `}
    >
      <div
        className={`
          flex h-4 w-4 items-center justify-center 
          rounded border
          transition-colors
          ${
            checked
              ? "border-blue-500 bg-blue-500 text-white"
              : "border-gray-300 dark:border-gray-600"
          }
        `}
      >
        {checked && (
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-gray-700 dark:text-gray-200">{children}</span>
    </button>
  )
}

interface DropdownMenuRadioGroupProps {
  children: React.ReactNode
  value: string
  onValueChange: (value: string) => void
}

export const DropdownMenuRadioGroup: React.FC<DropdownMenuRadioGroupProps> = ({
  children,
  value,
  onValueChange,
}) => {
  return (
    <div className="flex flex-col gap-0.5">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            checked: child.props.value === value,
            onCheckedChange: () => onValueChange(child.props.value),
          })
        }
        return child
      })}
    </div>
  )
}

// Export types
export type {
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuSeparatorProps,
  DropdownMenuLabelProps,
  DropdownMenuCheckboxItemProps,
  DropdownMenuRadioGroupProps,
}