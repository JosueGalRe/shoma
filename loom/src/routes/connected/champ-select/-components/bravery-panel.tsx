import { FadeImage } from '@shoma/ui/fade-image'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { BRAVERY_SPLASH_URL } from '@/features/champ-select/arena'

// Arena's Valentía once locked, as the client shows it: no skins, since the champion is revealed at the loading screen,
// But its art and what it gives
export function BraveryPanel() {
  const { t } = useTranslation()

  return (
    <div {...props(styles.root)}>
      <FadeImage src={BRAVERY_SPLASH_URL} style={styles.art} />

      <p {...props(text.marcellus16, styles.title)}>{t('champSelect.bravery')}</p>

      <p {...props(text.body3, styles.body)}>{t('champSelect.braveryLocked')}</p>
    </div>
  )
}

const styles = create({
  // The splash's emblem sits in its middle third, so the sides can go on a narrow screen
  art: {
    aspectRatio: '16 / 9',
    objectFit: 'cover',
    width: '100%',
  },
  body: {
    color: color.text,
    margin: 0,
    paddingInline: 24,
    textAlign: 'center',
  },
  root: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: 16,
    justifyContent: 'center',
    minHeight: 0,
  },
  title: {
    color: color.text,
    margin: 0,
    textTransform: 'uppercase',
  },
})
