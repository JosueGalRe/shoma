import type { resources } from "./resources";

type TranslationResources = (typeof resources)["en"]["translation"];

export function typedSelector<TValue>(selector: (translations: TranslationResources) => TValue) {
  return selector;
}
