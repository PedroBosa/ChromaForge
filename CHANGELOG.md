# Registro de Alterações (Changelog)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato baseia-se em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado
- Proposta de exportação em lote para formato JSON Tokens Figma / Tokens Studio.
- Proposta de testes automatizados com cobertura unitária para a matriz APCA e transformações D65.

## [1.0.0] - 2026-11-09

### Adicionado
- Estúdio colorimétrico nativo em espaço OKLCH (*Oklab Cylindrical*) com uniformidade perceptiva calculada em ponto flutuante de 64 bits.
- Pipeline de conversão bidirecional sRGB $\leftrightarrow$ Linear sRGB (IEC 61966-2-1) $\leftrightarrow$ CIE XYZ (D65) $\leftrightarrow$ Oklab $\leftrightarrow$ OKLCH conforme especificação de Björn Ottosson (2020).
- Algoritmo de mapeamento e contenção de gamut (*gamut clipping*) com busca binária em 24 iterações no canal de Croma ($C$), preservando Luminosidade ($L$) e Matiz ($H$) com tolerância $\epsilon \le 10^{-4}$.
- Detecção e teste de pertencimento para os espaços de cores sRGB e Display P3 wide gamut.
- Avaliação de contraste óptico duplo: WCAG 2.1 (razões de luminância linear relativa) e APCA 0.98G-4g (*Accessible Perceptual Contrast Algorithm*, rascunho WCAG 3.0 Silver) com modelagem de luz dispersa (*flare*) e polaridades BoW e WoB.
- Gerador paramétrico de rampas cromáticas em 11 passos (50 a 950) com interpolação de luminosidade via curvas cúbicas de Bézier resolvidas por Newton-Raphson e envelope de croma parabólico.
- Editor interativo de curvas de Bézier em SVG com manipuladores de controle arrastáveis e presets (*S-Curve*, *Linear*, *Ease-In*, *Ease-Out*, *Steep*).
- Matriz de contraste óptico cruzado $11 \times 11$ com inspetor visual de pares tipográficos em tempo real.
- Diagrama 2D de cromaticidade em canvas acelerado no plano Oklab $(a, b)$ com suporte a telas de alta densidade (Retina).
- Compilador universal de design tokens para Tailwind CSS v4 (`@theme`), Tailwind CSS v3 (`tailwind.config.js`), variáveis CSS customizadas com fallback sRGB, W3C Design Tokens Community Group (JSON) e constantes tipadas em TypeScript.
- Persistência de estado local via `localStorage` e serialização para compartilhamento instantâneo via parâmetros de URL.
- Configuração de integração contínua (CI) e esteira de publicação para GitHub Pages.

[Não lançado]: https://github.com/PedroBosa/ChromaForge/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/PedroBosa/ChromaForge/releases/tag/v1.0.0
