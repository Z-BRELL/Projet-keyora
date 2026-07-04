import { fr } from './fr';

export function useTranslation() {
  // Pour un support multi-langue futur, on pourrait introduire un contexte ici
  // Actuellement, retourne uniquement le français (fr)
  const t = (path: string, options?: Record<string, string | number>) => {
    const keys = path.split('.');
    let value: any = fr;
    
    for (const key of keys) {
      if (value === undefined) break;
      value = value[key as keyof typeof value];
    }
    
    if (value === undefined) {
      console.warn(`Translation missing for key: ${path}`);
      return path;
    }

    let text = value as string;
    
    if (options) {
      Object.entries(options).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }
    
    return text;
  };

  return { t };
}
