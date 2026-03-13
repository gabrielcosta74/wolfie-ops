"use client";

import { useMemo, useState } from "react";
import { startTeacherReviewBatch } from "../actions";
import type { ReviewSubthemeOption, ReviewThemeOption } from "@/lib/teacher-review";

type Props = {
  themes: ReviewThemeOption[];
  subthemes: ReviewSubthemeOption[];
};

export function ReviewLauncher({ themes, subthemes }: Props) {
  const [themeId, setThemeId] = useState<string>(themes[0] ? String(themes[0].id) : "");
  const [subthemeId, setSubthemeId] = useState<string>("");

  const selectedTheme = useMemo(
    () => themes.find((theme) => String(theme.id) === themeId) ?? null,
    [themeId, themes]
  );

  const filteredSubthemes = useMemo(
    () => subthemes.filter((subtheme) => String(subtheme.themeId) === themeId),
    [subthemes, themeId]
  );

  const selectedSubtheme = useMemo(
    () => filteredSubthemes.find((subtheme) => String(subtheme.id) === subthemeId) ?? null,
    [filteredSubthemes, subthemeId]
  );

  return (
    <form action={startTeacherReviewBatch} className="st-form st-review-launcher">
      <div className="st-review-launcher-grid">
        <div className="st-field">
          <label className="st-label st-label-required" htmlFor="review-theme">
            Tema
          </label>
          <select
            id="review-theme"
            name="theme_id"
            className="st-select"
            required
            value={themeId}
            onChange={(event) => {
              setThemeId(event.target.value);
              setSubthemeId("");
            }}
          >
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
          <span className="st-hint">Escolhe o tema que queres rever nesta sessão de 20 perguntas.</span>
        </div>

        <div className="st-field">
          <label className="st-label" htmlFor="review-subtheme">
            Subtema
          </label>
          <select
            id="review-subtheme"
            name="subtheme_id"
            className="st-select"
            value={subthemeId}
            onChange={(event) => setSubthemeId(event.target.value)}
          >
            <option value="">Todos os subtemas deste tema</option>
            {filteredSubthemes.map((subtheme) => (
              <option key={subtheme.id} value={subtheme.id}>
                {subtheme.name}
              </option>
            ))}
          </select>
          <span className="st-hint">Se quiseres, restringe a amostra a um subtema concreto.</span>
        </div>
      </div>

      <input type="hidden" name="theme_name" value={selectedTheme?.name ?? ""} />
      <input type="hidden" name="subtheme_name" value={selectedSubtheme?.name ?? ""} />

      <div className="st-review-launcher-panel">
        <div>
          <div className="st-review-launcher-title">Como funciona a amostra</div>
          <p className="st-page-subtitle" style={{ marginTop: 6 }}>
            O Wolfie vai gerar uma seleção curta e variada, misturando níveis de dificuldade e perguntas de estilos
            diferentes para não te mostrar sempre o mesmo tipo.
          </p>
        </div>

        <div className="st-form-actions st-form-actions--inline">
          <button type="submit" className="st-btn st-btn--primary st-btn--wide">
            Gerar amostra de 20 perguntas
          </button>
        </div>
      </div>
    </form>
  );
}
