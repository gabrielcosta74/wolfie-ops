# Landing Page — Plano Visual e Copywriting

> Estado: **planeado, por implementar**
> Criado: 2026-03-13

---

## Objetivo

Transformar a landing page do Wolfie numa página que:
1. Explica claramente o que é a app (AI tutor para Exame Nacional de Matemática A)
2. Vende o sonho — melhores notas, mais tempo livre, sem gastar fortunas em explicadores
3. Usa imagens reais para contar uma história emocional em 3 atos

O **design atual fica igual** (dark theme, blobs, Inter font, framer-motion). Só se adicionam novas secções com imagens e copy melhorado.

---

## Narrativa em 3 Atos

```
ACT 1 — A DOR
"Isso sou eu. Estou a sofrer com isto."

ACT 2 — A TRANSFORMAÇÃO
"É assim que funciona. Parece fácil."

ACT 3 — O SONHO
"É isto que quero. A minha vida depois do Wolfie."
```

---

## Estrutura Completa da Página

```
[NAV]
[HERO]                   ← copy já atualizado ✓
[PHONE 3D]               ← já existe ✓
[FEATURE CHIPS]          ← já existe ✓
─────────────────────────────────────
NOVA SECÇÃO 1 — A DOR
─────────────────────────────────────
MARKETING COPY           ← copy já atualizado ✓
─────────────────────────────────────
NOVA SECÇÃO 2 — O EXPLICADOR
NOVA SECÇÃO 3 — OS HOBBIES (grid 3 fotos)
NOVA SECÇÃO 4 — O DINHEIRO (comparativo)
─────────────────────────────────────
[CTA — Professores]      ← já existe ✓
[FOOTER]                 ← já existe ✓
```

---

## Copy já implementado (Hero + Marketing)

### Hero
- **H1:** "A Matemática A / finalmente explicada. / Passo a passo."
- **Sub (azul):** "Sem pagar centenas de euros a explicadores. Disponível 24 horas."
- **Desc:** "Preparado especificamente para o Exame Nacional de Matemática A. 7.111 exercícios do currículo oficial, tutor de IA que explica cada erro do zero — e não te deixa desistir."

### Feature Chips (3)
1. **Explicador 24 Horas** — "Sem pagar centenas a explicadores. Sempre disponível, mesmo às 11 da noite."
2. **Explica PORQUÊ Erraste** — "Não só a resposta certa — o raciocínio completo, do zero, sem julgamentos."
3. **Exames Reais. Nota Real.** — "Simula o exame de Junho com correção automática por IA."

### Marketing Section
- **H2:** "Não és mau a matemática. / Só nunca tiveste / um bom explicador."
- **Body:** Dor específica → solução → "Sem mensalidades de 80€" → "Estudas menos tempo. Absorves o dobro. Chegas a Junho preparado."

---

## Novas Secções a Implementar

---

### SECÇÃO 1 — "A Dor"

**Posição:** Entre os feature chips e o marketing copy atual.

**Layout:** Split — imagem à esquerda, texto à direita. Em mobile: texto em cima, imagem em baixo.

**Imagem:**
- Aluno do secundário (16–18 anos), sozinho, secretária cheia de livros
- Caneta na mão parada, olhar perdido ou frustrado
- Luz de quarto à noite — candeeiro de secretária
- Tom escuro para caber no dark theme
- **Unsplash query:** `student desk night frustrated studying`
- Tratar com overlay `rgba(0,0,0,0.3)` + `border-radius: 24px`

**Copy:**
```
EYEBROW (azul, uppercase small)
Somos honestos.

H2
Já tentaste estudar.
E não resultou.

Body (muted)
Passas horas a fazer exercícios que não percebes.
Repetes os mesmos erros. Olhas para o livro
e nada fica.

Não é falta de esforço.
É falta de alguém que explique mesmo.
```

---

### SECÇÃO 2 — "O Explicador"

**Posição:** A seguir ao marketing copy.

**Layout:** Split inverso — texto à esquerda, imagem à direita. Fundo glass escuro.

**Imagem:**
- Aluno relaxado na cama ou sofá, à noite
- Telemóvel na mão, expressão de alívio/concentração leve
- Luz suave, pode ter AirPods
- **Unsplash query:** `teenager phone night relaxed` ou `student mobile learning night`
- Tom azulado/escuro

**Copy:**
```
EYEBROW (azul)
O teu novo explicador

H2
Às 11 da noite,
quando tens uma dúvida,
o Wolfie está lá.

Body (muted)
Não precisas de marcar sessão.
Não precisas de explicar do início.
Perguntas. Ele explica. Repete
quantas vezes precisares —
sem julgamentos, sem pressa.

É assim que se aprende de verdade.
```

---

### SECÇÃO 3 — "Os Hobbies" (a mais importante)

**Posição:** A seguir à Secção 2.

**Layout:**
- Texto centrado em cima (eyebrow + H2 grande + sub)
- Grid de 3 fotos lado a lado em baixo
- Em mobile: 1 coluna, fotos empilhadas

**Copy:**
```
EYEBROW (azul, centrado)
A tua vida com o Wolfie

H2 (centrado, grande, branco)
Melhores notas.
Mais tempo para o que
realmente importa.

Sub (centrado, muted)
Quando deixas de perder tardes inteiras a estudar
matéria que não fica, sobra tempo para viver.
```

**Grid de 3 fotos:**

| # | O que mostrar | Caption | Unsplash query |
|---|---|---|---|
| 1 | Jovem com prancha de surf, pôr do sol, Portugal | *"Para o surf"* | `surf portugal sunset teenager` |
| 2 | Grupo de jovens a rir, fora de casa | *"Para os amigos"* | `friends laughing young outdoor` |
| 3 | Jovem com guitarra ou a jogar futebol | *"Para o que gostas"* | `teenager guitar` ou `young football` |

**Tratamento visual das fotos:**
- `border-radius: 20px`
- Overlay suave `rgba(0,0,0,0.18)`
- `hover: transform: scale(1.03), transition: 0.3s`
- Caption em branco, bold, no canto inferior esquerdo de cada foto
- Altura fixa: ~300px desktop, ~220px mobile

---

### SECÇÃO 4 — "O Dinheiro"

**Posição:** A seguir à Secção 3.

**Layout:** Centrado. Sem foto — visual comparativo feito em CSS (dois cards lado a lado).

**Copy:**
```
EYEBROW (azul, centrado)
Faz as contas

H2 (centrado)
Um explicador custa
80€ por hora.
O Wolfie não.

Body (muted, centrado, pequeno)
Disponível a qualquer hora, em qualquer lugar.
Sem deslocações. Sem faltar a sessões.
Sem gastar uma fortuna para tirar uma boa nota.
```

**Comparativo visual (2 cards CSS, sem foto):**

```
┌─────────────────────┐    ┌─────────────────────┐
│  Explicador         │    │  Wolfie             │
│  particular         │    │                     │
│                     │    │                     │
│  ~80€ / hora        │    │  Alguns €/mês       │
│  Horário fixo       │    │  24h / 7 dias       │
│  1–2x por semana    │    │  Sempre disponível  │
│  ~600€+ por ano     │    │  Fração disso       │
│                     │    │                     │
│  [card cinzento]    │    │  [card accent blue] │
└─────────────────────┘    └─────────────────────┘
```

Card esquerdo: `background: rgba(255,255,255,0.04)`, border muted
Card direito: `background: rgba(91,106,240,0.12)`, border accent blue, badge "✓ Wolfie"

---

## Hierarquia Emocional Completa

```
1. HERO          → O que é + promessa principal
2. PHONE         → Produto em ação
3. CHIPS         → 3 diferenciadores chave (24h, explica porquê, exames reais)
4. DOR           → Empatia — "reconheces-te aqui?"
5. MARKETING     → Reframe — "não és mau, eram as ferramentas"
6. EXPLICADOR    → Mecanismo — "é assim que funciona"
7. HOBBIES       → Sonho — "é assim que fica a tua vida"
8. DINHEIRO      → Objeção removida — "e ainda poupas dinheiro"
9. CTA           → Professores/comunidade
```

---

## Notas Técnicas de Implementação

- Usar `next/image` com `fill` + `object-fit: cover` para todas as fotos
- Imagens de Unsplash: usar URL direto inicialmente, substituir por fotos próprias quando disponível
- Manter `framer-motion` para animações de entrada (`fadeUp`, `stagger`) — consistente com o resto
- As novas secções usam as classes CSS já existentes onde possível (`lp-marketing`, etc.) e novas classes prefixadas `lp-` para as novas secções
- Secção hobbies: considerar `overflow: hidden` no container para evitar scroll horizontal em mobile

---

## Ficheiros a Modificar

| Ficheiro | O que muda |
|---|---|
| `app/page.tsx` | Adicionar as 4 novas secções |
| `app/landing.css` | Adicionar classes para as novas secções |
