import { tv } from 'tailwind-variants'

export const animatedModeIconStyles = tv({
  slots: {
    image: 'h-full w-full object-contain drop-shadow-md',
    imageFallback: 'absolute inset-0 h-full w-full object-contain drop-shadow-md',
    wrapper: 'relative h-full w-full',
    video: 'relative z-10 h-full w-full object-contain',
  },
})
