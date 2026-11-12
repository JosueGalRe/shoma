import { create } from '@stylexjs/stylex'

import { font } from './tokens/font.stylex'

/**
 * Figma text styles, 1:1 by name. Sizes in rem (16px base) so they follow the user's font size;
 * line heights are the faces' intrinsic ratios Figma used and tracking is the file's 6-8%.
 */
export const text = create({
  body1: { fontFamily: font.body, fontSize: '1.125rem', fontWeight: 400, letterSpacing: '0.06em', lineHeight: 1.2 },
  body1Medium: { fontFamily: font.body, fontSize: '1.125rem', fontWeight: 500, letterSpacing: '0.06em', lineHeight: 1.2 },
  body2: { fontFamily: font.body, fontSize: '1rem', fontWeight: 400, letterSpacing: '0.06em', lineHeight: 1.2 },
  body2Medium: { fontFamily: font.body, fontSize: '1rem', fontWeight: 500, letterSpacing: '0.06em', lineHeight: 1.2 },
  body3: { fontFamily: font.body, fontSize: '0.875rem', fontWeight: 400, letterSpacing: '0.06em', lineHeight: 1.2 },
  body3Medium: { fontFamily: font.body, fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.06em', lineHeight: 1.2 },
  body4: { fontFamily: font.body, fontSize: '0.8125rem', fontWeight: 400, letterSpacing: '0.06em', lineHeight: 1.2 },
  body4Medium: { fontFamily: font.body, fontSize: '0.8125rem', fontWeight: 500, letterSpacing: '0.06em', lineHeight: 1.2 },
  heading1: { fontFamily: font.body, fontSize: '2rem', fontWeight: 400, letterSpacing: '0.06em', lineHeight: 1.2 },
  heading1Bold: { fontFamily: font.body, fontSize: '1.625rem', fontWeight: 600, letterSpacing: '0.06em', lineHeight: 1.2 },
  heading2: { fontFamily: font.body, fontSize: '1.4375rem', fontWeight: 400, letterSpacing: '0.08em', lineHeight: 1.2 },
  heading2Medium: { fontFamily: font.body, fontSize: '1.4375rem', fontWeight: 500, letterSpacing: '0.06em', lineHeight: 1.2 },
  heading3: { fontFamily: font.body, fontSize: '1.25rem', fontWeight: 400, letterSpacing: '0.06em', lineHeight: 1.2 },
  heading3Medium: { fontFamily: font.body, fontSize: '1.25rem', fontWeight: 500, letterSpacing: '0.06em', lineHeight: 1.2 },
  marcellus11: { fontFamily: font.display, fontSize: '0.6875rem', fontWeight: 400, lineHeight: 1.25 },
  marcellus13: { fontFamily: font.display, fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.25 },
  marcellus16: { fontFamily: font.display, fontSize: '1rem', fontWeight: 400, letterSpacing: '0.08em', lineHeight: 1.25 },
  marcellus19: { fontFamily: font.display, fontSize: '1.1875rem', fontWeight: 400, lineHeight: 1.25 },
  marcellus23: { fontFamily: font.display, fontSize: '1.4375rem', fontWeight: 400, lineHeight: 1.25 },
  marcellus28: { fontFamily: font.display, fontSize: '1.75rem', fontWeight: 400, lineHeight: 1.25 },
  marcellus33: { fontFamily: font.display, fontSize: '2.0625rem', fontWeight: 400, lineHeight: 1.25 },
})
