// Converte imagens em data URL para que a proposta em HTML seja um arquivo
// único, que funciona offline e sobrevive ao reenvio por e-mail ou WhatsApp.

const cache = new Map<string, string>();

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

/** Busca uma imagem servida pela própria aplicação e devolve em data URL. */
export async function urlToDataUrl(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached) return cached;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Não foi possível carregar ${url}`);
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao converter a imagem"));
    reader.readAsDataURL(blob);
  });
  cache.set(url, dataUrl);
  return dataUrl;
}

export const O2_LOGO_URL = "/logo-o2-white.png";

/** Logo da O2 em data URL. Devolve undefined se falhar — o render cai no wordmark. */
export async function loadO2Logo(): Promise<string | undefined> {
  try {
    return await urlToDataUrl(O2_LOGO_URL);
  } catch {
    return undefined;
  }
}
