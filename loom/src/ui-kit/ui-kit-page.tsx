import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

import { AvatarShowcase } from './avatar-showcase'
import { BackgroundShowcase } from './background-showcase'
import { BottomNavShowcase } from './bottom-nav-showcase'
import { BottomSheetShowcase } from './bottom-sheet-showcase'
import { ButtonShowcase } from './button-showcase'
import { ChipShowcase } from './chip-showcase'
import { FormControlsShowcase } from './form-controls-showcase'
import { IconButtonShowcase } from './icon-button-showcase'
import { IconsShowcase } from './icons-showcase'
import { MessageBubbleShowcase } from './message-bubble-showcase'
import { ModalShowcase } from './modal-showcase'
import { OtpFieldShowcase } from './otp-field-showcase'
import { ScrollAreaShowcase } from './scroll-area-showcase'
import { SelectShowcase } from './select-showcase'
import { SlotsShowcase } from './slots-showcase'
import { StepperShowcase } from './stepper-showcase'
import { TabsShowcase } from './tabs-showcase'
import { TextFieldShowcase } from './text-field-showcase'
import { ToastShowcase } from './toast-showcase'

export function UiKitPage() {
  return (
    <main {...props(styles.page)}>
      <h1 {...props(text.heading1, styles.title)}>@shoma/ui</h1>

      <BackgroundShowcase />

      <IconsShowcase />

      <ButtonShowcase />

      <IconButtonShowcase />

      <TextFieldShowcase />

      <OtpFieldShowcase />

      <ToastShowcase />

      <BottomSheetShowcase />

      <FormControlsShowcase />

      <TabsShowcase />

      <BottomNavShowcase />

      <SelectShowcase />

      <ModalShowcase />

      <SlotsShowcase />

      <AvatarShowcase />

      <ChipShowcase />

      <StepperShowcase />

      <ScrollAreaShowcase />

      <MessageBubbleShowcase />
    </main>
  )
}

const styles = create({
  page: {
    boxSizing: 'border-box',
    color: color.text,
    display: 'flex',
    flexDirection: 'column',
    gap: 48,
    minHeight: '100dvh',
    padding: 24,
  },
  title: {
    margin: 0,
  },
})
