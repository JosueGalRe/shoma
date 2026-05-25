export interface AnimatedIconMode {
  id: string
  iconUrl: string
  iconUrlActive?: string
  videoUrlIntro?: string
  videoUrlActive?: string
}

export interface AnimatedModeIconProps {
  mode: AnimatedIconMode
  isExpanded: boolean
}
