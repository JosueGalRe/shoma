import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

import { BottomSheetShowcase } from './bottom-sheet-showcase'
import { ButtonShowcase } from './button-showcase'
import { FormControlsShowcase } from './form-controls-showcase'
import { IconButtonShowcase } from './icon-button-showcase'
import { OtpFieldShowcase } from './otp-field-showcase'
import { SelectShowcase } from './select-showcase'
import { TabsShowcase } from './tabs-showcase'
import { TextFieldShowcase } from './text-field-showcase'
import { ToastShowcase } from './toast-showcase'

export function UiKitPage() {
  return (
    <main {...props(styles.page)}>
      <h1 {...props(text.heading1, styles.title)}>@shoma/ui</h1>

      <ButtonShowcase />

      <IconButtonShowcase />

      <TextFieldShowcase />

      <OtpFieldShowcase />

      <ToastShowcase />

      <BottomSheetShowcase />

      <FormControlsShowcase />

      <TabsShowcase />

      <SelectShowcase />
    </main>
  )
}

const styles = create({
  page: {
    backgroundColor: color.background,
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
