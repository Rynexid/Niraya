import { useState } from 'react'
import { PackageIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const sizeStyles = {
  sm: 'size-10',
  md: 'size-14',
  lg: 'size-20',
  fill: 'aspect-[4/3] w-full',
  square: 'aspect-square w-full',
} as const

type ProductThumbnailProps = {
  src?: string
  alt: string
  size?: keyof typeof sizeStyles
  className?: string
}

/**
 * Product image with a neutral fallback. `fill`/`square` are used inside
 * product cards; the fixed sizes are used in cart rows and summaries. A broken
 * remote image falls back to the icon instead of showing a broken image.
 */
export function ProductThumbnail({
  src,
  alt,
  size = 'md',
  className,
}: ProductThumbnailProps) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted',
        sizeStyles[size],
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <PackageIcon
          aria-hidden="true"
          className="size-1/3 text-muted-foreground"
        />
      )}
    </div>
  )
}
