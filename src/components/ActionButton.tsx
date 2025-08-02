export const ActionButton = ({
  title,
  onClick,
  onFocus,
  children,
  disabled,
  id,
}: {
  title?: string
  id?: string
  onClick?: React.MouseEventHandler
  onFocus?: React.FocusEventHandler
  children: React.ReactNode
  disabled?: boolean
}) => {
  return (
    <button
      id={id}
      disabled={disabled}
      title={title}
      className="actionButton"
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {children}
    </button>
  )
}
