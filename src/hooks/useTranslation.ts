import { useMemo } from 'react';
import { getCurrentLanguage, getMessages, type Language } from '../locales';

export function useTranslation() {
  const lang = getCurrentLanguage();
  const messages = useMemo(() => getMessages(lang), [lang]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let result: any = messages;

    for (const k of keys) {
      result = result?.[k];
      if (result === undefined || result === null) {
        return key;
      }
    }

    return typeof result === 'string' ? result : key;
  };

  return { t, lang };
}

export type { Language };
