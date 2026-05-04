import { describe, expect, it } from 'bun:test'

import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '../../src/i18n/translations/en'
import es from '../../src/i18n/translations/es'

const resources = {
  en: { translation: en },
  es: { translation: es },
}

async function createTestI18n() {
  const i18n = createInstance()
  await i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

  return i18n
}

describe('i18n language switching and connected copy', () => {
  it('switches from English to Spanish', async () => {
    const i18n = await createTestI18n()

    expect(i18n.t('connection.title')).toBe('Connect to Mimic')

    await i18n.changeLanguage('es')

    expect(i18n.t('connection.title')).toBe('Conectar con Mimic')
  })

  it('resolves current queue and ready-check copy', async () => {
    const i18n = await createTestI18n()

    expect(i18n.t('queue.searching')).toBe('Searching')

    await i18n.changeLanguage('es')

    expect(i18n.t('queue.searching')).toBe('Buscando')
    expect(i18n.t('readyCheck.accept')).toBe('Aceptar partida')
  })
})
