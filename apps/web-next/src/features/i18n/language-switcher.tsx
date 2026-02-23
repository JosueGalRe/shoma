import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage?.startsWith("es") ? "es" : "en";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-9 rounded-xl" size="sm" variant="outline">
          {current.toUpperCase()}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup
          onValueChange={(nextValue) => {
            void i18n.changeLanguage(nextValue);
          }}
          value={current}
        >
          <DropdownMenuRadioItem value="en">{t($ => $.language.english)}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="es">{t($ => $.language.spanish)}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
