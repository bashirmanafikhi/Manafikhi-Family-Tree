interface AvatarProps {
  firstName: string
  lastName?: string | null
  profileImage?: string | null
  gender?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-24 h-24 text-3xl',
}

export function Avatar({
  firstName,
  lastName,
  profileImage,
  gender,
  size = 'md',
  className = '',
}: AvatarProps) {
  const initials = firstName.charAt(0)
  const isMale = gender === 'MALE'

  const gradientClass = isMale
    ? 'from-[#0d5c63] to-[#14919b]'
    : 'from-[#e07a5f] to-[#f2a98e]'

  if (profileImage) {
    return (
      <div className={`rounded-full overflow-hidden flex-shrink-0 ${sizeClasses[size]} ${className}`}>
        <img
          src={`/${profileImage}`}
          alt={`${firstName} ${lastName || ''}`}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-medium bg-gradient-to-br ${gradientClass} ${sizeClasses[size]} ${className}`}
    >
      {initials}
    </div>
  )
}