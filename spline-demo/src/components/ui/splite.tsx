'use client'

import { Suspense, lazy } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          {/* The original markup used a bare `.loader` class, which this
              project never defines — the fallback rendered as nothing at
              all while the ~1MB Spline runtime downloaded. */}
          <div
            role="status"
            aria-label="Loading 3D scene"
            className="size-8 animate-spin rounded-full border-2 border-neutral-700 border-t-neutral-200"
          />
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  )
}
