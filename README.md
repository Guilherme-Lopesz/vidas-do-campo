# 🐄 Vidas do Campo

> **Simulador de manejo neonatal bovino e ovino** — Salve bezerros e cordeiros, tome decisões clínicas reais e reduza a mortalidade neonatal da sua fazenda virtual.

<p align="center">
  <img src="https://img.shields.io/badge/tecnologia-HTML%20%7C%20CSS%20%7C%20JavaScript-4a9c6d?style=flat-square" />
  <img src="https://img.shields.io/badge/plataforma-Mobile%20%7C%20Desktop-5eba85?style=flat-square" />
  <img src="https://img.shields.io/badge/idioma-Português%20BR-88d4a8?style=flat-square" />
  <img src="https://img.shields.io/badge/dependências-zero-c8f0da?style=flat-square" />
</p>

---

## 📖 Sobre o Projeto

**Vidas do Campo** é um jogo educativo de simulação veterinária desenvolvido como ferramenta de capacitação para produtores rurais e estudantes de medicina veterinária e zootecnia. O jogador assume o papel de responsável técnico de uma fazenda e deve tomar decisões clínicas corretas ao longo de **7 etapas** que cobrem todo o ciclo perinatal de bovinos e ovinos.

Cada decisão afeta diretamente a **taxa de sobrevivência neonatal** do rebanho — o principal indicador do jogo. Erros custam corações e reduzem a sobrevivência; acertos geram pontos, dinheiro virtual e melhoram os indicadores da fazenda.

---

## ✨ Funcionalidades

### 🎮 Mecânicas de Jogo
- **7 Etapas temáticas** cobrindo o ciclo perinatal completo
- **Quiz adaptativo** com 5 questões por etapa, selecionadas por dificuldade
- **2 Minijogos interativos** por etapa (um a cada 2 questões)
- **Sistema de corações** (5 vidas) com penalidade por erros
- **Streak de acertos** — 3 ou mais acertos seguidos dobram os pontos
- **Pistas opcionais** com custo de −40% na pontuação da questão
- **Cronômetro global** registrado no ranking final
- **Modo Bovinos** (iniciante) e **Modo Ovinos** (avançado) com dificuldades distintas

### 🏥 Conteúdo Clínico
- **Banco de questões** com 3 níveis de dificuldade (Fácil, Médio, Caso Clínico)
- **Casos clínicos narrativos** por etapa (Modo Ovinos) com cenário, achados, diagnóstico e tratamento
- **Dica do Veterinário** ao final de cada etapa com informação técnica aprofundada
- **Feedback imediato** com explicação clínica a cada resposta

### 🎯 Sistema de Pontuação
| Acerto | Pontos Base |
|--------|-------------|
| Fácil  | 100 pts     |
| Médio  | 150 pts     |
| Caso Clínico | 250 pts |

- Com streak ≥ 3: **pontos dobrados**
- Com pista usada: **60% dos pontos base**
- Minijogo vencido: **+200 pts + R$ 100**

### 🏆 Ranking
- Top 10 fazendas salvas localmente via `localStorage`
- Classificação por pontuação com exibição de espécie, data e taxa de sobrevivência

---

## 🗺️ Etapas do Jogo

| # | Tema | Impacto na Sobrevivência |
|---|------|--------------------------|
| 🌸 1 | **Gestação e Pré-Parto** | +20% se pré-parto correto |
| 🍼 2 | **Colostro: Primeiras Horas** | +30% colostro nas 2h / −40% sem colostro |
| 🌡️ 3 | **Hipotermia e Neonatos** | +15% aquecimento precoce |
| 🦠 4 | **Infecções Neonatais** | −50% onfalite com umbigo desinfetado |
| 🌿 5 | **Nutrição Lactante** | Crias 30% mais pesadas ao desmame |
| 💉 6 | **Vacinação e Prevenção** | +25% imunidade neonatal |
| 📊 7 | **Gestão e Indicadores** | Meta: TMN < 5% |

---

## 🎲 Minijogos

Cada etapa conta com dois minijogos práticos que simulam procedimentos reais de campo:

| Minijogo | Etapa | Descrição |
|----------|-------|-----------|
| 🌾 Escolha o Alimento | 1 | Selecione os alimentos corretos para a gestante |
| ⚖️ Avalie o Escore Corporal | 1 | Estime o ECC pela silhueta do animal |
| ⏱️ Corrida do Colostro | 2 | Toque rápido para fornecer colostro a tempo |
| 🌡️ Temperatura Certa | 2 | Aqueça o colostro sem destruir anticorpos |
| 🐑 Para Onde Levar? | 3 | Decida o destino do cordeiro hipotérmico |
| 🌡️ Leia o Termômetro | 3 | Interprete a temperatura retal e grau de hipotermia |
| 🧴 Mergulho no Iodo | 4 | Aplique iodo 10% corretamente no umbigo |
| 🏠 Prepare a Baia | 4 | Selecione os itens de higiene necessários |
| 🌿 Monte o Cocho | 5 | Monte a dieta correta para a lactante |
| ✅❌ Certo ou Errado? | 5–7 | Avalie práticas de manejo em série |
| 📅 Calendário Vacinal | 6 | Marque o momento correto de vacinação |
| 💉 Onde Aplicar? | 6 | Identifique o local correto de aplicação |
| 📊 Calcule a TMN | 7 | Calcule a Taxa de Mortalidade Neonatal |

---

## 🛠️ Tecnologias

O projeto é intencionalmente **sem dependências externas** — funciona com HTML, CSS e JavaScript puros, o que garante compatibilidade universal e carregamento instantâneo.

```
index.html   — Estrutura e telas do app
style.css    — Design system completo (variáveis CSS, animações, responsividade)
script.js    — Lógica do jogo, banco de questões, minijogos e casos clínicos
```

**APIs Web utilizadas:**
- `Web Audio API` — efeitos sonoros gerados programaticamente (sem arquivos de áudio)
- `localStorage` — persistência do ranking entre sessões
- `CSS Custom Properties` — sistema de temas e layout responsivo dinâmico
- `getBoundingClientRect()` — cálculo dinâmico da altura do HUD para layout mobile

---

## 📱 Responsividade

O layout se adapta automaticamente a qualquer dispositivo:

- **Mobile** (< 480px): HUD compacto, scroll nativo suavizado com `-webkit-overflow-scrolling: touch`, suporte a `safe-area-inset` para notch e barra de gestos
- **Tablet** (480–768px): layout centralizado com sombra lateral
- **Desktop** (> 768px): aparência de app mobile centralizado com `border-radius` e `box-shadow`

A altura do HUD é **medida em tempo real** pelo JavaScript (`getBoundingClientRect`) e aplicada como variável CSS `--hud-h` em todas as telas — garantindo que nenhum conteúdo fique escondido atrás do cabeçalho em nenhum dispositivo.

---

## 🚀 Como Usar

### Deploy direto (GitHub Pages)

1. Faça o fork ou clone deste repositório
2. Acesse **Settings → Pages**
3. Selecione a branch `main` como source
4. O jogo estará disponível em `https://seu-usuario.github.io/nome-do-repo`

### Rodar localmente

Não é necessário nenhum servidor ou build — basta abrir o arquivo diretamente:

```bash
git clone https://github.com/seu-usuario/vidas-do-campo.git
cd vidas-do-campo
# Abra index2.html no navegador
open index2.html       # macOS
start index2.html      # Windows
xdg-open index2.html   # Linux
```

> ⚠️ O `localStorage` (ranking) requer que o arquivo seja servido por um servidor HTTP. Use o Live Server do VS Code ou `python -m http.server 8000` para desenvolvimento local completo.

---

## 🎨 Design System

O projeto usa um sistema de design próprio baseado em paleta terrosa/rural:

```css
--earth1: #1a2e1a   /* fundo escuro */
--green2: #5eba85   /* verde principal */
--amber2: #f5c842   /* destaque amarelo */
--red:    #d94040   /* erro/perigo */
--purple: #7c3aad   /* minijogos */
```

**Tipografia:**
- `Fredoka One` — títulos e elementos de destaque
- `Nunito` — corpo do texto, botões e interface

---

## 📚 Conteúdo Técnico-Veterinário

Todo o conteúdo clínico foi elaborado com base em protocolos veterinários estabelecidos para manejo perinatal de ruminantes:

- **Bovinos:** gestação ~285 dias, ECC ideal 3,0–3,5 no parto, colostro nas primeiras 2h, TMN meta < 5%
- **Ovinos:** gestação ~150 dias, colostro 50 ml/kg nas primeiras 6h, hipotermia < 37°C retal, TMN meta < 8%
- **Doenças abordadas:** toxemia da prenhez, hipotermia neonatal, onfalite, septicemia, enterotoxemia (*Clostridium perfringens* tipo C/D), cetose pós-parto, diarreia neonatal

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sugestões de melhoria:

- Novos bancos de questões (caprinos, suínos)
- Mais minijogos interativos
- Modo multiplayer (ranking online)
- Acessibilidade (ARIA, navegação por teclado)
- Internacionalização (inglês/espanhol)

```bash
# Fork → clone → branch → pull request
git checkout -b feature/nova-funcionalidade
git commit -m "feat: descrição da melhoria"
git push origin feature/nova-funcionalidade
```

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

<p align="center">
  Feito com 🐄 para produtores rurais e estudantes de veterinária
</p>
