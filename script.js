/* ===== VIDAS DO CAMPO - script.js ===== */

/* ───────────────────────────────────────
   ESTADO GLOBAL
─────────────────────────────────────── */
const G = {
    farm: '', species: 'Bovinos',
    money: 0, score: 0, hearts: 5,
    survival: 100, streak: 0,
    stationIdx: 0, questionIdx: 0,
    mgWins: 0, mgTotal: 0,
    hintUsed: false, timerRef: null,
    currentQ: null, answered: false,
    stationHits: 0, stationMoneyEarned: 0,
    prevScreen: 'screen-splash',
    muted: false,
    isBovino: true,
    // minigame a cada 2 questões
    mgSchedule: [],   // índices das questões onde ocorre minigame (0-indexed, após a questão)
    mgQueue: [],      // fila de minigames da estação
    mgQueueIdx: 0,
};

let difficultyBias = [1, 1, 2];

/* ───────────────────────────────────────
   ESTAÇÕES
─────────────────────────────────────── */
const STATIONS = [
    {
        id: 1, emoji: '🌸', title: 'Gestação e Pré-Parto',
        intro: 'A gestação é a base de tudo. Uma vaca ou ovelha bem nutrida no pré-parto gera crias mais fortes, com melhor imunidade e maior chance de sobrevivência. Negligenciar essa fase é o erro mais caro que um produtor pode cometer.',
        effects: [
            { icon: '📈', text: '+20% sobrevivência se pré-parto correto' },
            { icon: '⚠️', text: 'Erros aqui custam caro na próxima etapa' },
        ],
        vetTip: 'Vacas com escore corporal abaixo de 3,0 no parto têm 40% mais chances de parto difícil. Ovelhas com EC 2,0 têm sobrevivência neonatal reduzida em até 60%.',
    },
    {
        id: 2, emoji: '🍼', title: 'Colostro: Primeiras Horas',
        intro: 'O colostro é o único seguro de vida que uma cria recebe. Ele contém anticorpos que protegem o recém-nascido nas primeiras semanas de vida. A janela de absorção é pequena e não volta.',
        effects: [
            { icon: '🛡️', text: 'Colostro nas 2h: +30% sobrevivência' },
            { icon: '❌', text: 'Sem colostro: −40% sobrevivência automático' },
        ],
        vetTip: 'Cordeiros devem receber ao menos 50ml/kg de colostro nas primeiras 6 horas. Após 24h, a absorção de anticorpos é praticamente zero.',
    },
    {
        id: 3, emoji: '🌡️', title: 'Hipotermia e Neonatos',
        intro: 'Recém-nascidos perdem calor rapidamente. Um cordeiro molhado sob chuva fria entra em hipotermia em menos de 30 minutos. Reconhecer e agir rápido salva vidas.',
        effects: [
            { icon: '🔥', text: 'Aquecimento precoce: +15% sobrevivência' },
            { icon: '❄️', text: 'Hipotermia não tratada: morte em horas' },
        ],
        vetTip: 'Temperatura retal < 37°C em cordeiro = hipotermia. Prioridade: aquecer antes de alimentar. Oferecer colostro frio a animal hipotérmico pode ser fatal.',
    },
    {
        id: 4, emoji: '🦠', title: 'Infecções Neonatais',
        intro: 'Onfalite (infecção do umbigo), diarreia neonatal e septicemia são as principais causadoras de mortalidade na primeira semana de vida. Higiene no parto e desinfecção do umbigo são essenciais.',
        effects: [
            { icon: '🧴', text: 'Umbigo desinfetado: −50% onfalite' },
            { icon: '🚨', text: 'Diarreia não tratada: óbito em 24-48h' },
        ],
        vetTip: 'Use iodo 10% no umbigo logo após o parto. A baia de parto deve ser limpa e seca. Crias com diarreia perdem eletrólitos rapidamente — reidratação oral é prioridade.',
    },
    {
        id: 5, emoji: '🌿', title: 'Nutrição Lactante',
        intro: 'A fêmea em lactação tem demandas nutricionais 2-3x maiores que fora dela. Deficiências de energia e proteína comprometem a produção de leite e a saúde da cria.',
        effects: [
            { icon: '📊', text: 'Nutrição adequada: crias 30% mais pesadas ao desmame' },
            { icon: '⚡', text: 'Deficiência energética: cetose pós-parto' },
        ],
        vetTip: 'Ovelhas em lactação gemelar podem precisar de até 3x o nível de energia de mantença. Suplementação de propileno glicol previne cetose em animais de alto risco.',
    },
    {
        id: 6, emoji: '💉', title: 'Vacinação e Prevenção',
        intro: 'Protocolos vacinais corretos são a forma mais barata de manter o rebanho saudável. A imunidade passiva transferida via colostro depende da vacinação da mãe.',
        effects: [
            { icon: '✅', text: 'Vacinação pré-parto: +25% imunidade neonatal' },
            { icon: '💸', text: 'Falta de protocolo: surtos custam 10x mais' },
        ],
        vetTip: 'Clostridiais devem ser aplicadas 4-6 semanas antes do parto para garantir altos títulos de anticorpos no colostro. Reforço anual é obrigatório.',
    },
    {
        id: 7, emoji: '📊', title: 'Gestão e Indicadores',
        intro: 'Um fazendeiro de sucesso acompanha números. Taxa de natalidade, mortalidade neonatal e ganho de peso são os indicadores que revelam se o manejo está funcionando ou não.',
        effects: [
            { icon: '📋', text: 'Registro correto: decisões melhores' },
            { icon: '🎯', text: 'Meta: mortalidade neonatal < 5%' },
        ],
        vetTip: 'A taxa de mortalidade neonatal aceitável em bovinos é de 2-5%. Em ovinos pode chegar a 10-15% em sistemas extensivos, mas com manejo intensivo pode cair abaixo de 5%.',
    },
];

/* ───────────────────────────────────────
   BANCO DE PERGUNTAS
─────────────────────────────────────── */
const ALL_QUESTIONS = [
    // --- ESTAÇÃO 1: Gestação e Pré-Parto ---
    { station: 1, d: 1, species: 'all',
      q: '🐄 Qual é o período de gestação de uma vaca?',
      opts: ['270 dias', '285 dias', '310 dias', '250 dias'],
      correct: 1, hint: 'É próximo a 9 meses humanos, mas um pouco mais.',
      explain: 'A gestação bovina dura em média 285 dias (≈ 9,5 meses).' },

    { station: 1, d: 1, species: 'all',
      q: '🐑 Quanto tempo dura a gestação de uma ovelha?',
      opts: ['120 dias', '150 dias', '180 dias', '200 dias'],
      correct: 1, hint: 'É bem menor que a de uma vaca.',
      explain: 'A gestação ovina dura em média 150 dias (5 meses).' },

    { station: 1, d: 2, species: 'all',
      q: '📊 O Escore de Condição Corporal (ECC) ideal para uma vaca no parto é:',
      opts: ['1,5 – 2,0', '2,0 – 2,5', '3,0 – 3,5', '4,5 – 5,0'],
      correct: 2, hint: 'A escala vai de 1 (magra) a 5 (obesa).',
      explain: 'ECC 3,0–3,5 no parto é ideal. Animais muito magros ou muito gordos têm mais partos difíceis e complicações metabólicas.' },

    { station: 1, d: 2, species: 'Ovinos',
      q: '🐑 Uma ovelha com ECC 2,0 no pré-parto está em risco de:',
      opts: ['Parto gemelar espontâneo', 'Toxemia da prenhez (cetose)', 'Excesso de produção de colostro', 'Hipertensão arterial'],
      correct: 1, hint: 'Animais magros em gestação gemelar têm demanda energética altíssima.',
      explain: 'Toxemia da prenhez ocorre quando a demanda energética fetal supera a ingestão. Ovelhas magras com gestação dupla têm risco alto. Pode ser fatal.' },

    { station: 1, d: 3, species: 'Ovinos',
      q: '🩺 CASO CLÍNICO: Ovelha com ECC 1,8, prenhez gemelar, 2 semanas para o parto. Está apática, range os dentes, anda em círculos. Glicemia: 1,8 mmol/L. Diagnóstico mais provável?',
      opts: ['Listeriose', 'Toxemia da prenhez avançada', 'Hipocalcemia', 'Encefalite viral'],
      correct: 1, hint: 'Glicemia normal em ovelhas é 2,5–4,0 mmol/L. Hipoglicemia + gestação gemelar + ECC baixo = ?',
      explain: 'Toxemia da prenhez avançada. A hipoglicemia severa causa sintomas neurológicos. Tratamento: propileno glicol VO, glicose IV, cesariana em casos graves. Prognóstico reservado se não tratada rapidamente.' },

    { station: 1, d: 3, species: 'all',
      q: '🩺 DECISÃO CLÍNICA: Vaca com ECC 4,5 no pré-parto. Qual conduta é mais indicada?',
      opts: ['Aumentar suplementação para ter leite', 'Restringir energia e monitorar para evitar cetose pós-parto', 'Aplicar vitamina B12 semanal', 'Nenhuma ação necessária'],
      correct: 1, hint: 'Vacas muito gordas têm mobilização lipídica excessiva após o parto.',
      explain: 'Vacas obesas têm alto risco de esteatose hepática e cetose pós-parto. A estratégia é restringir energia gradualmente no pré-parto, nunca jejum abrupto.' },

    // --- ESTAÇÃO 2: Colostro ---
    { station: 2, d: 1, species: 'all',
      q: '🍼 Em quantas horas após o nascimento a cria deve receber colostro?',
      opts: ['Até 24 horas', 'Até 12 horas', 'Até 2 horas', 'Qualquer hora'],
      correct: 2, hint: 'A absorção de anticorpos é máxima nas primeiras horas.',
      explain: 'As primeiras 2 horas são críticas. Após 6h a absorção cai drasticamente. Após 24h é praticamente nula.' },

    { station: 2, d: 1, species: 'all',
      q: '🛡️ O que o colostro contém que o leite normal não tem em quantidade suficiente?',
      opts: ['Gordura e calorias', 'Imunoglobulinas (anticorpos)', 'Vitamina C', 'Lactose'],
      correct: 1, hint: 'É a principal fonte de imunidade para o recém-nascido.',
      explain: 'O colostro é rico em imunoglobulinas (IgG, IgM, IgA), que protegem o neonato antes de seu sistema imune estar maduro.' },

    { station: 2, d: 2, species: 'Ovinos',
      q: '🐑 A quantidade mínima de colostro que um cordeiro deve ingerir nas primeiras 6 horas é:',
      opts: ['10 ml/kg', '50 ml/kg', '200 ml/kg', '5 ml/kg'],
      correct: 1, hint: 'Para um cordeiro de 4 kg, seriam 200 ml no total.',
      explain: '50 ml/kg nas primeiras 6 horas é o mínimo para garantir transferência passiva adequada de imunidade.' },

    { station: 2, d: 2, species: 'all',
      q: '🌡️ A temperatura ideal para oferecer colostro a um neonato é:',
      opts: ['Frio direto da geladeira (4°C)', 'Temperatura corporal (37–39°C)', 'Temperatura ambiente (25°C)', 'Quente (50°C)'],
      correct: 1, hint: 'Pense na temperatura natural do leite saindo da mãe.',
      explain: 'Colostro deve ser aquecido a 37–39°C. Frio pode induzir hipotermia; acima de 45°C destrói as imunoglobulinas.' },

    { station: 2, d: 3, species: 'Ovinos',
      q: '🩺 CASO: Cordeiro nascido há 4 horas, não mamou (ovelha rejeitou). ECC da mãe: 2,5. Temperatura retal do cordeiro: 36,5°C. Sua primeira ação deve ser:',
      opts: ['Oferecer colostro em mamadeira imediatamente', 'Aquecer o cordeiro primeiro, depois oferecer colostro', 'Aplicar glucose IV e chamar veterinário', 'Forçar a ovelha a amamentar'],
      correct: 1, hint: 'Temperatura < 37°C = hipotermia. Alimentar animal hipotérmico tem risco de quê?',
      explain: 'AQUECIMENTO PRIMEIRO. Cordeiro hipotérmico tem motilidade gastrointestinal reduzida. Oferecer colostro pode causar timpanismo. Meta: aquecer até 37°C, depois alimentar.' },

    { station: 2, d: 3, species: 'all',
      q: '🩺 DECISÃO: Não há colostro da mãe disponível. Quais alternativas são aceitáveis, em ordem de preferência?',
      opts: [
        'Leite bovino pasteurizado → leite em pó → colostro congelado de doadora',
        'Colostro congelado de doadora → colostro bovino → substitutos comerciais',
        'Substituto comercial → leite de cabra → esperar a mãe produzir',
        'Água com açúcar → leite bovino → colostro congelado',
      ],
      correct: 1, hint: 'Colostro é insubstituível. O mais parecido vem primeiro.',
      explain: 'A ordem correta é: colostro congelado da mesma espécie → colostro bovino → substituto comercial de colostro. Leite normal e água com açúcar NÃO têm imunoglobulinas.' },

    // --- ESTAÇÃO 3: Hipotermia ---
    { station: 3, d: 1, species: 'all',
      q: '❄️ Temperatura retal abaixo de qual valor indica hipotermia em neonatos?',
      opts: ['39°C', '37°C', '35°C', '40°C'],
      correct: 1, hint: 'A temperatura normal de um recém-nascido ovino/bovino é 38,5–39,5°C.',
      explain: 'Temperatura retal < 37°C = hipotermia. Entre 37–38°C = normal baixo, atenção. Acima de 39,5°C = febre.' },

    { station: 3, d: 1, species: 'all',
      q: '🔥 Qual das opções NÃO é uma forma adequada de aquecer um neonato hipotérmico?',
      opts: ['Caixa com lâmpada de infravermelho', 'Mergulhar em água quente (39°C)', 'Dar colostro frio para "dar energia"', 'Secar com toalha e colocar em lugar aquecido'],
      correct: 2, hint: 'Uma das opções vai piorar a hipotermia.',
      explain: 'Colostro frio pode piorar a hipotermia e causar problemas gastrointestinais. SEMPRE aqueça primeiro.' },

    { station: 3, d: 2, species: 'Ovinos',
      q: '🐑 Cordeiro com temperatura retal de 25°C. Qual o protocolo correto?',
      opts: [
        'Alimentar com colostro em mamadeira e depois aquecer',
        'Aplicar glicose intraperitoneal e aquecer externamente',
        'Secar e colocar sob lâmpada, esperar melhorar sozinho',
        'Eutanásia humanitária imediata',
      ],
      correct: 1, hint: 'Temperatura < 27°C = hipotermia severa. Risco de hipoglicemia simultânea.',
      explain: 'Hipotermia severa (< 27°C) requer: glicose intraperitoneal (0,5 ml de glicose 20%/kg) + aquecimento externo. Abaixo de 37°C não há reflexo de sucção — mamadeira ineficaz.' },

    { station: 3, d: 3, species: 'Ovinos',
      q: '🩺 CASO CLÍNICO: Cordeiro de 1 dia, T° retal 33°C, sem reflexo de sucção. Como você trata? Coloque na ordem correta:',
      opts: [
        '1) Colostro → 2) Aquecimento → 3) Glicose IP → 4) Monitorar',
        '1) Aquecimento → 2) Glicose IP → 3) Colostro via sonda → 4) Monitorar',
        '1) Glicose IV → 2) Antibiótico → 3) Aquecimento → 4) Colostro',
        '1) Secar → 2) Colostro mamadeira → 3) Aquecimento → 4) Alta',
      ],
      correct: 1, hint: 'Sem reflexo de sucção → mamadeira não funciona → precisa de sonda.',
      explain: 'Protocolo: 1) Aquecer (meta: > 37°C) 2) Glicose intraperitoneal se T < 37°C 3) Colostro via sonda esofágica (sem sucção = sonda) 4) Monitorar cada 2h.' },

    // --- ESTAÇÃO 4: Infecções Neonatais ---
    { station: 4, d: 1, species: 'all',
      q: '🧴 Como se chama a infecção do coto umbilical?',
      opts: ['Mastite', 'Onfalite', 'Pneumonia neonatal', 'Cetose'],
      correct: 1, hint: 'O nome vem de "onfalo" = umbigo em grego.',
      explain: 'Onfalite é a infecção do umbigo. Pode evoluir para septicemia se não tratada. Prevenção: iodo 10% logo após o parto.' },

    { station: 4, d: 1, species: 'all',
      q: '💊 Qual produto deve ser usado na desinfecção do umbigo logo após o parto?',
      opts: ['Álcool 70%', 'Iodo 10%', 'Água oxigenada', 'Antibiótico tópico'],
      correct: 1, hint: 'É um antisséptico marrom muito comum nas fazendas.',
      explain: 'Iodo 10% (tintura de iodo) é o padrão. Mergulhe (não apenas passe) o umbigo na solução. Repita em 12h.' },

    { station: 4, d: 2, species: 'all',
      q: '💧 Cria com diarreia desde o 2° dia. Qual eletrólito É PRIORITÁRIO repor?',
      opts: ['Sódio e bicarbonato', 'Potássio e fósforo', 'Cálcio e magnésio', 'Zinco e cobre'],
      correct: 0, hint: 'A acidose metabólica e desidratação isotônica são as grandes ameaças.',
      explain: 'Sódio (reidratação) e bicarbonato (corrigir acidose metabólica) são as prioridades. Diarreia neonatal causa acidose + desidratação graves e rapidamente.' },

    { station: 4, d: 3, species: 'Ovinos',
      q: '🩺 CASO: Cordeiro, 3 dias de vida, distensão abdominal, fezes amarelo-esverdeadas, T° 40,2°C. Umbigo quente e espessado. O que fazer primeiro?',
      opts: [
        'Dar leite em pó e esperar',
        'Reidratação oral + antibioticoterapia + desinfecção do umbigo',
        'Apenas desinfectar o umbigo com iodo',
        'Eutanásia por mau prognóstico',
      ],
      correct: 1, hint: 'Onfalite + diarreia + febre = infecção sistêmica em curso.',
      explain: 'Quadro grave: onfalite evoluindo + diarreia. Ação imediata: reidratação oral/IV, antibioticoterapia (penicilina ou ampicilina) e tratamento local do umbigo. Encaminhar ao veterinário.' },

    { station: 4, d: 3, species: 'all',
      q: '🩺 DECISÃO: Qual dessas práticas ESTÁ ERRADA no manejo do parto?',
      opts: [
        'Limpar a baia com cal antes do parto',
        'Deixar a cria lamber a lama do chão da baia para "pegar imunidade"',
        'Secar a cria com toalha limpa logo após o nascimento',
        'Garantir colostro nas primeiras 2 horas',
      ],
      correct: 1, hint: 'Imunidade não vem de bactérias do ambiente — vem do colostro.',
      explain: 'A lama contém patógenos como Cryptosporidium, E. coli e Clostridium. A "imunidade de ambiente" é um mito perigoso. A imunidade real vem do colostro.' },

    // --- ESTAÇÃO 5: Nutrição Lactante ---
    { station: 5, d: 1, species: 'all',
      q: '🌿 A demanda nutricional de uma fêmea em pico de lactação é quantas vezes maior que em mantença?',
      opts: ['1,2x', '2–3x', '5x', 'Igual'],
      correct: 1, hint: 'Produzir leite consome muita energia.',
      explain: 'Em pico de lactação, a demanda de energia pode ser 2 a 3x maior. Ovelhas com gêmeos podem precisar de até 3x a energia de mantença.' },

    { station: 5, d: 2, species: 'all',
      q: '⚡ A cetose pós-parto é causada principalmente por:',
      opts: [
        'Excesso de proteína na dieta',
        'Balanço energético negativo (mais gasto que ingestão)',
        'Falta de água',
        'Excesso de energia na dieta',
      ],
      correct: 1, hint: 'O corpo começa a queimar gordura em excesso, produzindo corpos cetônicos.',
      explain: 'Balanço energético negativo força o animal a mobilizar gordura corporal. O excesso de corpos cetônicos causa cetose, com anorexia, queda de produção e neurológico.' },

    { station: 5, d: 3, species: 'Ovinos',
      q: '🩺 CASO: Ovelha 10 dias pós-parto com gêmeos, anorexia, hálito adocicado, ECC caindo. Qual o diagnóstico e tratamento correto?',
      opts: [
        'Hipocalcemia — tratar com gluconato de cálcio IV',
        'Cetose pós-parto — propileno glicol VO + suplementação energética',
        'Mastite — antibiótico intramamário',
        'Pneumonia — antibiótico sistêmico',
      ],
      correct: 1, hint: 'Hálito adocicado = corpos cetônicos. Ovelha magra com gêmeos = balanço energético negativo.',
      explain: 'Cetose pós-parto: tratamento padrão é propileno glicol 60–100 mL 2x/dia VO por 3–5 dias + melhorar qualidade da dieta. Casos graves: glicose IV. Gluconato de cálcio é para hipocalcemia.' },

    // --- ESTAÇÃO 6: Vacinação ---
    { station: 6, d: 1, species: 'all',
      q: '💉 Com que antecedência vacinar a mãe antes do parto para garantir colostro com anticorpos?',
      opts: ['Na véspera do parto', '4–6 semanas antes do parto', '6 meses antes', 'Não precisa vacinar a mãe'],
      correct: 1, hint: 'O corpo precisa de tempo para produzir anticorpos suficientes.',
      explain: '4–6 semanas antes do parto é o prazo ideal. Vacinas clostridiais exigem esse tempo para que os anticorpos se concentrem no colostro.' },

    { station: 6, d: 2, species: 'all',
      q: '🦠 Qual família de doenças é mais importante vacinar em pequenos ruminantes?',
      opts: ['Rotavírus', 'Clostridiais (enterotoxemia, tétano, gangrena)', 'Brucelose', 'Parvovirose'],
      correct: 1, hint: 'Causam mortes súbitas em cordeiros e cabritos.',
      explain: 'Clostridiais (Clostridium perfringens tipo C e D, Cl. tetani, Cl. septicum) são responsáveis por mortes súbitas em neonatos. Vacinação da mãe é fundamental.' },

    { station: 6, d: 3, species: 'Ovinos',
      q: '🩺 CASO: Cordeiro de 3 semanas, morte súbita sem sinais prévios. Necropsia: hemorragias intestinais, conteúdo intestinal hemorrágico. Ovelha não foi vacinada. Suspeita?',
      opts: [
        'Diarreia por E. coli',
        'Enterotoxemia (Clostridium perfringens tipo C/D)',
        'Coccidiose aguda',
        'Hipoglicemia neonatal tardia',
      ],
      correct: 1, hint: 'Morte súbita + hemorragia intestinal + mãe sem vacina = clostridial.',
      explain: 'Enterotoxemia por Cl. perfringens tipo C/D. "Doença do cordeiro gordo" — paradoxalmente acomete os mais bem nutridos. Toxina produzida no intestino mata rapidamente. Prevenção: vacina da mãe 4–6 semanas antes do parto.' },

    // --- ESTAÇÃO 7: Gestão ---
    { station: 7, d: 1, species: 'all',
      q: '📊 Qual a meta de taxa de mortalidade neonatal em ovinos bem manejados?',
      opts: ['< 30%', '< 15%', '< 5%', '0%'],
      correct: 2, hint: 'Com manejo intensivo e atenção ao parto, é possível chegar bem abaixo.',
      explain: 'Com manejo intensivo (supervisão do parto, colostro, temperatura), mortalidade neonatal ovina pode ser < 5%. Em extensivo sem manejo, pode passar de 20%.' },

    { station: 7, d: 2, species: 'all',
      q: '📋 Qual indicador é mais útil para avaliar a saúde do rebanho no período neonatal?',
      opts: [
        'Preço médio do kg de carne',
        'Taxa de mortalidade neonatal (TMN)',
        'Número de vacinas aplicadas',
        'Peso médio da mãe',
      ],
      correct: 1, hint: 'É um indicador direto de eficiência do manejo ao redor do parto.',
      explain: 'A TMN é o principal indicador de qualidade do manejo perinatal. Metas: bovinos < 5%, ovinos manejados < 8%. Acima disso, há algo errado no protocolo.' },

    { station: 7, d: 3, species: 'all',
      q: '🩺 ANÁLISE: Fazenda com 200 ovelhas, 310 cordeiros nascidos, 47 mortes neonatais. TMN = ___. Classifique o manejo:',
      opts: [
        'TMN = 15,2% → Manejo aceitável',
        'TMN = 15,2% → Manejo inadequado, revisão urgente',
        'TMN = 15,2% → Dentro da meta ovina',
        'TMN = 8% → Excelente manejo',
      ],
      correct: 1, hint: 'Calcule: 47 mortes ÷ 310 nascidos × 100 = ? Compare com a meta.',
      explain: 'TMN = 47/310 × 100 = 15,2%. Meta para ovinos bem manejados: < 8%. 15,2% é RUIM — revisão urgente do protocolo de colostro, temperatura e higiene do parto.' },
];

/* ───────────────────────────────────────
   MINIGAMES — 1 a cada 2 questões
─────────────────────────────────────── */
const MINIGAMES_BY_STATION = {
    // Estação 1 — Pré-Parto
    1: [
        {
            id: 'feeding_choice', type: 'feeding_choice',
            title: '🌾 O Que Alimentar?',
            desc: 'Sua vaca gestante precisa de energia! Escolha os alimentos CORRETOS para o pré-parto.',
            survivalImpact: { win: 10, lose: -12 },
        },
        {
            id: 'bcs_check', type: 'bcs_check',
            title: '⚖️ Avalie o Escore Corporal',
            desc: 'Observe a silhueta da vaca e estime o Escore de Condição Corporal correto.',
            survivalImpact: { win: 8, lose: -10 },
        },
    ],
    // Estação 2 — Colostro
    2: [
        {
            id: 'colostrum_timing', type: 'colostrum_timing',
            title: '⏱️ Corrida do Colostro!',
            desc: 'A bezerra nasceu agora! Você tem apenas 2 horas para dar colostro. Toque RÁPIDO!',
            survivalImpact: { win: 12, lose: -15 },
        },
        {
            id: 'colostrum_temp', type: 'colostrum_temp',
            title: '🌡️ Temperatura Certa',
            desc: 'O colostro está gelado! Esquente na temperatura correta sem destruir os anticorpos.',
            survivalImpact: { win: 8, lose: -10 },
        },
    ],
    // Estação 3 — Hipotermia
    3: [
        {
            id: 'lamb_location', type: 'lamb_location',
            title: '🐑 Para Onde Levar?',
            desc: 'Cordeiro molhado acabou de nascer numa noite fria. Escolha o local CORRETO rapidamente!',
            survivalImpact: { win: 12, lose: -18 },
        },
        {
            id: 'thermometer', type: 'thermometer',
            title: '🌡️ Leia o Termômetro',
            desc: 'Meça a temperatura retal do cordeiro e identifique o grau de hipotermia.',
            survivalImpact: { win: 8, lose: -10 },
        },
    ],
    // Estação 4 — Infecções
    4: [
        {
            id: 'iodo_dip', type: 'iodo_dip',
            title: '🧴 Mergulho no Iodo!',
            desc: 'Mergulhe o umbigo do bezerro no iodo 10% corretamente. Não apenas passe — mergulhe!',
            survivalImpact: { win: 12, lose: -15 },
        },
        {
            id: 'baia_hygiene', type: 'baia_hygiene',
            title: '🏠 Prepare a Baia',
            desc: 'Selecione TODOS os itens necessários para higienizar a baia de parto.',
            survivalImpact: { win: 8, lose: -10 },
        },
    ],
    // Estação 5 — Nutrição
    5: [
        {
            id: 'trough_fill', type: 'trough_fill',
            title: '🌿 Monte o Cocho!',
            desc: 'Arraste os alimentos corretos para o cocho da vaca em lactação. Sem erros!',
            survivalImpact: { win: 10, lose: -12 },
        },
        {
            id: 'milk_production', type: 'erracerto',
            title: '✅❌ Nutrição: Certo ou Errado?',
            desc: 'Avalie as práticas nutricionais para fêmeas em lactação.',
            survivalImpact: { win: 8, lose: -10 },
            cases: [
                { pratica: '🐄 Reduzir proteína na dieta durante o pico de lactação', correto: false, explain: 'ERRADO. A proteína é essencial para a produção de leite. Reduzir compromete a produção e a saúde da cria.' },
                { pratica: '🐄 Oferecer sal mineral ad libitum (à vontade) para vacas em lactação', correto: true, explain: 'CORRETO. Minerais são críticos para produção de leite e saúde da vaca. Oferecer à vontade é a prática correta.' },
                { pratica: '🐑 Separar ovelha dos cordeiros para controlar a amamentação', correto: false, explain: 'ERRADO. A amamentação livre estimula a produção de leite. Separação reduz a lactação e enfraquece os cordeiros.' },
            ],
        },
    ],
    // Estação 6 — Vacinação
    6: [
        {
            id: 'vaccine_schedule', type: 'vaccine_schedule',
            title: '📅 Calendário Vacinal',
            desc: 'Marque o momento CORRETO no calendário para vacinar a ovelha antes do parto.',
            survivalImpact: { win: 10, lose: -12 },
        },
        {
            id: 'injection_site', type: 'injection_site',
            title: '💉 Onde Aplicar?',
            desc: 'Toque no LOCAL CORRETO do animal para aplicar a vacina subcutânea.',
            survivalImpact: { win: 8, lose: -10 },
        },
    ],
    // Estação 7 — Gestão
    7: [
        {
            id: 'tmn_calc', type: 'tmn_calc',
            title: '📊 Calcule a TMN',
            desc: 'Use os dados do rebanho para calcular a Taxa de Mortalidade Neonatal.',
            survivalImpact: { win: 10, lose: -12 },
        },
        {
            id: 'record_check', type: 'erracerto',
            title: '✅❌ Gestão: Certo ou Errado?',
            desc: 'Avalie as práticas de gestão e registro do rebanho.',
            survivalImpact: { win: 8, lose: -10 },
            cases: [
                { pratica: '📋 Registrar a data de nascimento, peso e identificação de cada cria', correto: true, explain: 'CORRETO. Registro individual é fundamental para acompanhar TMN, GMD e eficiência do manejo.' },
                { pratica: '📋 Descartar animais sem identificação para simplificar o manejo', correto: false, explain: 'ERRADO. Animais sem identificação devem ser identificados imediatamente. Descartar gera prejuízo e compromete a rastreabilidade.' },
                { pratica: '📋 Calcular a TMN anualmente para identificar problemas de manejo', correto: true, explain: 'CORRETO. A TMN anual revela tendências e aponta falhas no protocolo perinatal.' },
            ],
        },
    ],
};

/* ───────────────────────────────────────
   HELPERS
─────────────────────────────────────── */
function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        // Reset scroll position when leaving a screen
        s.scrollTop = 0;
    });
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('active');
        // Always start at top of new screen
        el.scrollTop = 0;
    }
    G.prevScreen = id;
    updateHUD();
}

function updateHUD() {
    document.getElementById('hud-farm').textContent = (G.farm || 'Fazenda');
    document.getElementById('hud-money').textContent = 'R$ ' + G.money;
    document.getElementById('hud-score').textContent = G.score + ' pts';
    document.getElementById('hud-station').textContent = (G.stationIdx + 1) + '/7';
    let h = '';
    for (let i = 0; i < 5; i++) h += (i < G.hearts ? '❤️' : '🖤');
    document.getElementById('hud-hearts').textContent = h;
    const pct = Math.max(0, Math.round(G.survival));
    const fill = document.getElementById('hud-survival');
    fill.style.width = pct + '%';
    fill.style.background = pct > 60 ? 'linear-gradient(90deg,var(--green2),var(--green1))' : pct > 30 ? 'linear-gradient(90deg,var(--amber2),var(--amber))' : 'linear-gradient(90deg,#d94040,#a02020)';
    document.getElementById('hud-survival-label').textContent = 'SOBREVIVÊNCIA ' + pct + '%';
}

function selectSpecies(s) {
    G.species = s;
    G.isBovino = s === 'Bovinos';
    difficultyBias = G.isBovino ? [1, 1, 2] : [2, 3, 3];
    document.getElementById('spec-bov').classList.toggle('selected', s === 'Bovinos');
    document.getElementById('spec-ovi').classList.toggle('selected', s === 'Ovinos');
    document.getElementById('mode-desc').innerHTML = G.isBovino
        ? '<strong>Modo Bovinos:</strong> Perguntas diretas, mais tempo, mais pistas. Ideal para iniciantes!'
        : '<strong>Modo Ovinos:</strong> Casos clínicos complexos, menos tempo, consequências maiores. Desafio real!';
}

function toggleMute() {
    G.muted = !G.muted;
    document.getElementById('btn-mute').textContent = G.muted ? '🔇' : '🔊';
}

function floatScore(pts, el) {
    const r = el ? el.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const div = document.createElement('div');
    div.className = 'score-float' + (pts < 0 ? ' negative' : '');
    div.textContent = (pts > 0 ? '+' : '') + pts + ' pts';
    div.style.left = (r.left + r.width / 2 - 30) + 'px';
    div.style.top = (r.top - 10) + 'px';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1100);

    if (pts > 0) {
        const colors = ['#5eba85', '#88d4a8', '#e8a020', '#f5c842', '#4a9c6d'];
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        for (let i = 0; i < 8; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const angle = (i / 8) * Math.PI * 2;
            const dist = 40 + Math.random() * 30;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist - 20;
            p.style.cssText = `
                left: ${cx}px; top: ${cy}px;
                width: ${4 + Math.random() * 4}px;
                height: ${4 + Math.random() * 4}px;
                background: ${colors[i % colors.length]};
                --tx: ${tx}px; --ty: ${ty}px;
                --dur: ${0.5 + Math.random() * 0.4}s;
            `;
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 900);
        }
    }
}

/* ───────────────────────────────────────
   SETUP & START
─────────────────────────────────────── */
function startGame() {
    const name = document.getElementById('input-farm').value.trim();
    G.farm = name || 'Fazenda Feliz';
    G.money = 0; G.score = 0; G.hearts = 5;
    G.survival = 100; G.streak = 0;
    G.stationIdx = 0; G.mgWins = 0; G.mgTotal = 0;
    loadStation();
}

function loadStation() {
    if (G.stationIdx >= STATIONS.length) { showFinal(); return; }
    const st = STATIONS[G.stationIdx];
    G.stationHits = 0; G.stationMoneyEarned = 0;
    document.getElementById('intro-badge').textContent = 'Etapa ' + st.id + ' de 7';
    document.getElementById('intro-emoji').textContent = st.emoji;
    document.getElementById('intro-title').textContent = st.title;
    document.getElementById('intro-text').textContent = st.intro;

    const fx = document.getElementById('intro-effects');
    fx.innerHTML = '';
    (st.effects || []).forEach(e => {
        const d = document.createElement('div');
        d.className = 'intro-effect-item';
        d.innerHTML = `<span>${e.icon}</span><span>${e.text}</span>`;
        fx.appendChild(d);
    });

    // Show station narrative if available
    const narratives = [
        '', '',
        'O sol nasce sobre o pasto e três vacas estão próximas ao parto. Você precisa garantir que tudo esteja preparado.',
        'São 4h da manhã. Uma bezerra acaba de nascer. A janela de colostro está aberta — cada minuto conta.',
        'Uma frente fria atingiu a fazenda. Dois cordeiros nasceram molhados durante a madrugada. Você precisa agir rápido.',
        'A baia do parto está úmida. Você nota que o umbigo de um bezerro está avermelhado. Decisão imediata necessária.',
        'Três crias foram desmamadas essa semana. A fêmea está em lactação plena. O que ela precisa para produzir bem?',
        'Período de vacinação. Você tem 40 ovelhas para protocolar antes do próximo ciclo de partos.',
        'Fim da temporada. Hora de avaliar se o rebanho melhorou — ou se algum protocolo precisa mudar.',
    ];
    const box = document.getElementById('narrative-event');
    const text = narratives[G.stationIdx + 1] || '';
    if (box) {
        if (text) { box.textContent = text; box.style.display = 'block'; }
        else { box.style.display = 'none'; }
    }

    switchScreen('screen-station-intro');
}

/* ───────────────────────────────────────
   QUIZ
─────────────────────────────────────── */
let stationQuestions = [];
let pendingMiniGame = null;

function startQuiz() {
    const station = STATIONS[G.stationIdx].id;
    let pool = ALL_QUESTIONS.filter(q => q.station === station && (q.species === 'all' || q.species === G.species));

    pool = pool.sort((a, b) => {
        const wa = difficultyBias.filter(x => x === a.d).length;
        const wb = difficultyBias.filter(x => x === b.d).length;
        return wb - wa || Math.random() - 0.5;
    });

    const selected = [];
    const byDiff = { 1: [], 2: [], 3: [] };
    pool.forEach(q => byDiff[q.d].push(q));

    difficultyBias.forEach(d => {
        if (byDiff[d].length && selected.length < 5) {
            const q = byDiff[d].shift();
            if (!selected.includes(q)) selected.push(q);
        }
    });

    [1, 2, 3].forEach(d => {
        while (selected.length < 5 && byDiff[d].length) {
            const q = byDiff[d].shift();
            if (!selected.includes(q)) selected.push(q);
        }
    });

    stationQuestions = selected.length ? selected : ALL_QUESTIONS.filter(q => q.species === 'all' || q.species === G.species).slice(0, 5);

    // Preparar fila de minigames — um a cada 2 questões
    // Inseridos após questão 2 e questão 4 (índices 1 e 3)
    G.mgSchedule = [1, 3]; // após responder questão de índice 1 e 3
    const stMGs = MINIGAMES_BY_STATION[station] || [];
    G.mgQueue = [...stMGs];
    G.mgQueueIdx = 0;
    pendingMiniGame = null;

    G.questionIdx = 0;
    G.hintUsed = false;
    renderQuestion();
    switchScreen('screen-quiz');
}

function renderQuestion() {
    if (G.questionIdx >= stationQuestions.length) {
        showReport();
        return;
    }
    const q = stationQuestions[G.questionIdx];
    G.currentQ = q;
    G.answered = false;
    G.hintUsed = false;

    // Reset scroll to top on every new question (critical for mobile)
    const quizScreen = document.getElementById('screen-quiz');
    if (quizScreen) quizScreen.scrollTop = 0;

    const dots = document.getElementById('progress-dots');
    dots.innerHTML = '';
    stationQuestions.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'q-dot' + (i === G.questionIdx ? ' active' : '');
        dots.appendChild(d);
    });
    document.getElementById('quiz-counter').textContent = (G.questionIdx + 1) + '/' + stationQuestions.length;

    const badge = document.getElementById('quiz-badge');
    const labels = { 1: 'Fácil', 2: 'Médio', 3: 'Clínico' };
    const classes = { 1: 'badge-easy', 2: 'badge-medium', 3: 'badge-hard badge-clinical' };
    badge.textContent = labels[q.d] || 'Fácil';
    badge.className = 'badge ' + (classes[q.d] || 'badge-easy');

    const streakBanner = document.getElementById('streak-banner');
    streakBanner.classList.toggle('show', G.streak >= 3);

    const svg = document.getElementById('quiz-svg');
    svg.textContent = '';
    if (q.img) svg.innerHTML = q.img;

    document.getElementById('quiz-question-text').textContent = q.q;

    document.getElementById('hint-text').classList.remove('show');
    document.getElementById('hint-text').textContent = '';
    document.getElementById('btn-hint').disabled = false;

    const opts = document.getElementById('quiz-options');
    opts.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    q.opts.forEach((o, i) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerHTML = `<span class="opt-letter">${letters[i]}</span>${o}`;
        btn.addEventListener('click', () => selectAnswer(i, btn));
        opts.appendChild(btn);
    });

    const fb = document.getElementById('feedback-box');
    fb.classList.remove('show');

    clearInterval(G.timerRef);
    const totalTime = G.isBovino ? 30 : 20;
    let timeLeft = totalTime;
    const bar = document.getElementById('quiz-timer');
    bar.style.width = '100%';
    bar.style.background = 'var(--green2)';
    G.timerRef = setInterval(() => {
        timeLeft -= 0.1;
        const pct = (timeLeft / totalTime) * 100;
        bar.style.width = pct + '%';
        if (pct < 30) bar.style.background = 'var(--red)';
        else if (pct < 60) bar.style.background = 'var(--amber)';
        if (timeLeft <= 0) {
            clearInterval(G.timerRef);
            if (!G.answered) timeoutAnswer();
        }
    }, 100);
}

function selectAnswer(idx, btn) {
    if (G.answered) return;
    G.answered = true;
    clearInterval(G.timerRef);

    const q = G.currentQ;
    const correct = idx === q.correct;
    const allBtns = document.querySelectorAll('.opt-btn');
    allBtns.forEach((b, i) => {
        if (i === q.correct) b.classList.add('correct');
        else if (i === idx && !correct) b.classList.add('wrong');
        b.disabled = true;
    });

    const dots = document.querySelectorAll('.q-dot');
    if (dots[G.questionIdx]) {
        dots[G.questionIdx].classList.remove('active');
        dots[G.questionIdx].classList.add(correct ? 'correct' : 'wrong');
    }

    const basePoints = { 1: 100, 2: 150, 3: 250 }[q.d] || 100;
    let pts = 0;
    if (correct) {
        pts = G.hintUsed ? Math.round(basePoints * 0.6) : basePoints;
        if (G.streak >= 3) pts *= 2;
        G.score += pts;
        G.money += Math.round(pts * 0.5);
        G.stationHits++;
        G.stationMoneyEarned += Math.round(pts * 0.5);
        G.streak++;
        G.survival = Math.min(100, G.survival + 3);
    } else {
        G.streak = 0;
        G.hearts = Math.max(0, G.hearts - 1);
        G.survival = Math.max(0, G.survival - (G.isBovino ? 8 : 15));
        if (G.hearts <= 0) { showGameOver(); return; }
    }

    floatScore(correct ? pts : -Math.round(basePoints * 0.3), btn);

    // Verificar se após essa questão vem um minigame
    const shouldMG = G.mgSchedule.includes(G.questionIdx) && G.mgQueueIdx < G.mgQueue.length;
    pendingMiniGame = shouldMG ? G.mgQueue[G.mgQueueIdx++] : null;

    const fb = document.getElementById('feedback-box');
    fb.classList.add('show');
    document.getElementById('feedback-title').textContent = correct ? '✓ Correto!' : '✗ Não foi dessa vez!';
    playSound(correct ? 'correct' : 'wrong');
    document.getElementById('feedback-desc').textContent = q.explain;

    // Alterar o botão "Continuar" para indicar minigame se for o caso
    const btnNext = document.getElementById('btn-next');
    if (pendingMiniGame) {
        btnNext.textContent = '🎮 Minijogo! →';
        btnNext.style.background = 'linear-gradient(135deg,#9d50d4,var(--purple))';
    } else {
        btnNext.textContent = 'Continuar →';
        btnNext.style.background = '';
    }

    updateHUD();
}

function timeoutAnswer() {
    if (G.answered) return;
    G.answered = true;
    G.streak = 0;
    G.survival = Math.max(0, G.survival - (G.isBovino ? 5 : 12));
    const q = G.currentQ;
    const allBtns = document.querySelectorAll('.opt-btn');
    allBtns.forEach((b, i) => { b.disabled = true; if (i === q.correct) b.classList.add('correct'); });

    const fb = document.getElementById('feedback-box');
    fb.classList.add('show');
    document.getElementById('feedback-title').textContent = '⏰ Tempo esgotado!';
    playSound('timeout');
    document.getElementById('feedback-desc').textContent = q.explain;

    const shouldMG = G.mgSchedule.includes(G.questionIdx) && G.mgQueueIdx < G.mgQueue.length;
    pendingMiniGame = shouldMG ? G.mgQueue[G.mgQueueIdx++] : null;

    const btnNext = document.getElementById('btn-next');
    if (pendingMiniGame) {
        btnNext.textContent = '🎮 Minijogo! →';
        btnNext.style.background = 'linear-gradient(135deg,#9d50d4,var(--purple))';
    } else {
        btnNext.textContent = 'Continuar →';
        btnNext.style.background = '';
    }

    updateHUD();
}

function useHint() {
    if (G.hintUsed || G.answered) return;
    G.hintUsed = true;
    document.getElementById('btn-hint').disabled = true;
    const hint = document.getElementById('hint-text');
    hint.textContent = '💡 ' + G.currentQ.hint;
    hint.classList.add('show');
}

function nextQuestion() {
    G.questionIdx++;

    if (pendingMiniGame) {
        const mg = pendingMiniGame;
        pendingMiniGame = null;
        showMinigame(mg);
    } else {
        renderQuestion();
    }
}

function showGameOver() {
    clearInterval(G.timerRef);
    alert('💔 Sem mais corações! Sua fazenda precisa de mais atenção.\n\nTente novamente para melhorar seu manejo!');
    location.reload();
}

/* ───────────────────────────────────────
   MINIGAMES
─────────────────────────────────────── */
let currentMG = null;
let mgState = {};

function showMinigame(mg) {
    G.mgTotal++;
    currentMG = mg;
    mgState = { score: 0, total: 0, done: false, timerRef: null };

    const badge = document.getElementById('mg-mode-badge');
    badge.textContent = G.isBovino ? 'Modo Bovino' : 'Modo Ovino';

    document.getElementById('mg-title').textContent = mg.title;
    document.getElementById('mg-desc').textContent = mg.desc;
    document.getElementById('mg-result').classList.remove('show');
    document.getElementById('mg-area').style.opacity = '1';
    document.getElementById('mg-area').innerHTML = '';
    document.getElementById('mg-progress-label').textContent = '';

    const timerBar = document.getElementById('mg-timer-bar');
    timerBar.style.width = '100%';
    timerBar.style.background = 'linear-gradient(90deg,#95d5b2,#f4d35e)';

    switchScreen('screen-minigame');

    switch (mg.type) {
        case 'feeding_choice': buildFeedingChoiceMG(); break;
        case 'bcs_check': buildBCSCheckMG(); break;
        case 'colostrum_timing': buildColostrumTimingMG(); break;
        case 'colostrum_temp': buildColostrumTempMG(); break;
        case 'lamb_location': buildLambLocationMG(); break;
        case 'thermometer': buildThermometerMG(); break;
        case 'iodo_dip': buildIodoDipMG(); break;
        case 'baia_hygiene': buildBaiaHygieneMG(); break;
        case 'trough_fill': buildTroughFillMG(); break;
        case 'vaccine_schedule': buildVaccineScheduleMG(); break;
        case 'injection_site': buildInjectionSiteMG(); break;
        case 'tmn_calc': buildTMNCalcMG(); break;
        case 'erracerto': buildErraCertoMG(mg.cases); break;
        default: buildFeedingChoiceMG();
    }
}

/* ── MG1: ESCOLHA O ALIMENTO ── */
function buildFeedingChoiceMG() {
    const area = document.getElementById('mg-area');
    document.getElementById('mg-progress-label').textContent = 'Toque nos alimentos CORRETOS para o pré-parto!';

    const foods = G.isBovino ? [
        { emoji: '🌾', label: 'Silagem de milho', correto: true },
        { emoji: '🍫', label: 'Chocolate', correto: false },
        { emoji: '🥩', label: 'Farelo de soja', correto: true },
        { emoji: '🍺', label: 'Cevada cervejeira', correto: false },
        { emoji: '🧂', label: 'Sal mineral', correto: true },
        { emoji: '🌿', label: 'Feno de qualidade', correto: true },
        { emoji: '🍬', label: 'Melaço excesso', correto: false },
        { emoji: '💧', label: 'Água limpa', correto: true },
    ] : [
        { emoji: '🌾', label: 'Feno de azevém', correto: true },
        { emoji: '🥩', label: 'Farelo de soja', correto: true },
        { emoji: '🧂', label: 'Sal mineral', correto: true },
        { emoji: '🍺', label: 'Grão úmido estragado', correto: false },
        { emoji: '🌿', label: 'Pastagem verde', correto: true },
        { emoji: '🍫', label: 'Ração de frango', correto: false },
        { emoji: '💊', label: 'Propileno glicol', correto: true },
        { emoji: '🌰', label: 'Grão de milho moído', correto: true },
    ];

    const correct = foods.filter(f => f.correto).length;
    let hits = 0;
    let errors = 0;

    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'mg-score-mini';
    scoreDiv.textContent = `✅ 0/${correct} corretos selecionados`;
    area.appendChild(scoreDiv);

    const grid = document.createElement('div');
    grid.className = 'mg-alvo-grid';
    area.appendChild(grid);

    foods.forEach(item => {
        const div = document.createElement('div');
        div.className = 'mg-alvo-item';
        div.innerHTML = `${item.emoji}<span>${item.label}</span>`;
        div.addEventListener('click', () => {
            if (div.classList.contains('disabled')) return;
            div.classList.add('disabled');
            if (item.correto) {
                hits++;
                div.classList.add('hit-correct');
            } else {
                errors++;
                div.classList.add('hit-wrong');
                G.survival = Math.max(0, G.survival - 2);
                updateHUD();
            }
            scoreDiv.textContent = `✅ ${hits}/${correct} | ❌ ${errors} erro(s)`;
            if (hits === correct) {
                clearInterval(mgState.timerRef);
                setTimeout(() => showMGResult(errors === 0, errors === 0
                    ? 'Perfeito! Você sabe alimentar o rebanho no pré-parto.'
                    : `${hits} alimentos corretos, mas ${errors} escolhas erradas afetam a saúde do animal!`), 500);
            }
        });
        grid.appendChild(div);
    });

    startMGTimer(35, () => showMGResult(hits >= correct * 0.7, `Tempo! ${hits}/${correct} alimentos corretos.`));
}

/* ── MG2: AVALIE ECC (escolha a silhueta) ── */
function buildBCSCheckMG() {
    const area = document.getElementById('mg-area');
    document.getElementById('mg-progress-label').textContent = G.isBovino
        ? 'Qual ECC está no intervalo IDEAL para o parto? (3,0–3,5)'
        : 'Qual ECC está no intervalo IDEAL para o parto? (3,0–3,5)';

    const caseDiv = document.createElement('div');
    caseDiv.className = 'mg-decision-case';
    caseDiv.innerHTML = `${G.isBovino ? '🐄' : '🐑'} Observe os escores e escolha o <strong>ideal para o parto</strong>:`;
    area.appendChild(caseDiv);

    const options = [
        { label: 'ECC 1,5 — muito magra', emoji: '💀', correto: false, explain: 'Muito baixo. Risco de parto difícil, cetose e colostro pobre em anticorpos.' },
        { label: 'ECC 2,5 — magra', emoji: '😟', correto: false, explain: 'Abaixo do ideal. Animal pode ter dificuldades no parto e produção de colostro comprometida.' },
        { label: 'ECC 3,0–3,5 — ideal', emoji: '✅', correto: true, explain: 'Perfeito! Escore ideal para o parto. Menos complicações e melhor qualidade de colostro.' },
        { label: 'ECC 4,5 — gorda', emoji: '⚠️', correto: false, explain: 'Muito alto. Risco de distócia, cetose e fígado gorduroso pós-parto.' },
    ];

    options.forEach(op => {
        const btn = document.createElement('button');
        btn.className = 'mg-diag-btn';
        btn.innerHTML = `<span style="font-size:1.3rem">${op.emoji}</span> ${op.label}`;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mg-diag-btn').forEach(b => b.disabled = true);
            btn.classList.add(op.correto ? 'selected-correct' : 'selected-wrong');
            if (!op.correto) {
                document.querySelectorAll('.mg-diag-btn').forEach(b => {
                    if (b.textContent.includes('3,0–3,5')) b.classList.add('selected-correct');
                });
            }
            clearInterval(mgState.timerRef);
            setTimeout(() => showMGResult(op.correto, op.explain), 800);
        });
        area.appendChild(btn);
    });

    startMGTimer(25, () => showMGResult(false, 'ECC 3,0–3,5 é o ideal para vacas e ovelhas no parto.'));
}

/* ── MG3: CORRIDA DO COLOSTRO (tap rápido) ── */
function buildColostrumTimingMG() {
    const area = document.getElementById('mg-area');
    document.getElementById('mg-progress-label').textContent = 'TOQUE rapidamente para oferecer colostro à cria!';

    const info = document.createElement('div');
    info.className = 'mg-decision-case';
    info.innerHTML = `${G.isBovino ? '🐄' : '🐑'} <strong>A cria acabou de nascer!</strong><br>Você tem 2 horas para dar colostro.<br>Toque no botão <strong>15 vezes</strong> antes do tempo acabar!`;
    area.appendChild(info);

    const progressDiv = document.createElement('div');
    progressDiv.className = 'mg-score-mini';
    progressDiv.textContent = '🍼 0 / 15 doses';
    area.appendChild(progressDiv);

    const bigBtn = document.createElement('button');
    bigBtn.className = 'mg-tap-btn';
    bigBtn.innerHTML = '🍼<br><span>DAR COLOSTRO!</span>';
    area.appendChild(bigBtn);

    let taps = 0;
    const needed = 15;
    bigBtn.addEventListener('click', () => {
        if (mgState.done) return;
        taps++;
        const pct = Math.round((taps / needed) * 100);
        progressDiv.textContent = `🍼 ${taps} / ${needed} doses`;
        bigBtn.style.transform = 'scale(0.92)';
        setTimeout(() => bigBtn.style.transform = '', 100);
        if (taps >= needed) {
            mgState.done = true;
            clearInterval(mgState.timerRef);
            showMGResult(true, 'Excelente! Você garantiu o colostro nas primeiras horas. Imunidade passiva transferida com sucesso!');
        }
    });

    startMGTimer(20, () => {
        if (!mgState.done) {
            mgState.done = true;
            showMGResult(false, `Tarde demais! Você deu ${taps}/${needed} doses. A janela de absorção de anticorpos está fechando.`);
        }
    });
}

/* ── MG4: TEMPERATURA DO COLOSTRO ── */
function buildColostrumTempMG() {
    const area = document.getElementById('mg-area');
    document.getElementById('mg-progress-label').textContent = 'Selecione a temperatura CORRETA para o colostro!';

    const info = document.createElement('div');
    info.className = 'mg-decision-case';
    info.innerHTML = `🌡️ O colostro está na geladeira a 4°C.<br>Você precisa aquecê-lo à temperatura ideal.<br>Qual é a temperatura correta?`;
    area.appendChild(info);

    const temps = [
        { label: '4°C — Gelado', correto: false, explain: 'Colostro frio pode causar hipotermia no neonato e problemas digestivos.' },
        { label: '25°C — Morno', correto: false, explain: 'Frio demais ainda. O colostro precisa estar na temperatura corporal do animal.' },
        { label: '37–39°C — Temperatura corporal', correto: true, explain: 'Correto! 37–39°C é a temperatura ideal — mesma que sairia diretamente da mãe.' },
        { label: '50°C — Quente', correto: false, explain: 'Perigoso! Acima de 45°C as imunoglobulinas são destruídas. O colostro perde seu valor imunológico.' },
    ];

    temps.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'mg-diag-btn';
        btn.innerHTML = `🌡️ ${t.label}`;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mg-diag-btn').forEach(b => b.disabled = true);
            btn.classList.add(t.correto ? 'selected-correct' : 'selected-wrong');
            if (!t.correto) {
                document.querySelectorAll('.mg-diag-btn').forEach(b => {
                    if (b.textContent.includes('37–39')) b.classList.add('selected-correct');
                });
            }
            clearInterval(mgState.timerRef);
            setTimeout(() => showMGResult(t.correto, t.explain), 800);
        });
        area.appendChild(btn);
    });

    startMGTimer(20, () => showMGResult(false, 'Temperatura ideal: 37–39°C. Nem gelado, nem quente demais.'));
}

/* ── MG5: PARA ONDE LEVAR O CORDEIRO ── */
function buildLambLocationMG() {
    const area = document.getElementById('mg-area');
    document.getElementById('mg-progress-label').textContent = 'Escolha o LOCAL CORRETO para o cordeiro hipotérmico!';

    const scenario = document.createElement('div');
    scenario.className = 'mg-decision-case';
    scenario.innerHTML = `🌧️ São 3h da manhã. Cordeiro recém-nascido, molhado, temperatura retal 35°C.<br><strong>Para onde você leva PRIMEIRO?</strong>`;
    area.appendChild(scenario);

    const locations = [
        { emoji: '🏟️', label: 'Deixar no pasto com a mãe', correto: false, explain: 'Errado. Noite fria + molhado = risco de hipotermia grave. A mãe lambe mas não aquece o suficiente.' },
        { emoji: '🏠', label: 'Baia seca e aquecida com lâmpada', correto: true, explain: 'Correto! Baia seca + lâmpada infravermelha é o ambiente ideal para reaquecimento seguro do neonato.' },
        { emoji: '🛁', label: 'Banho em água fria do córrego', correto: false, explain: 'Péssima ideia! Água fria agrava a hipotermia dramaticamente.' },
        { emoji: '🚗', label: 'Banco do carro com aquecedor', correto: false, explain: 'Subótimo. O calor do ar-condicionado pode ser irregular e estressar o animal. Baia controlada é melhor.' },
    ];

    locations.forEach(loc => {
        const btn = document.createElement('button');
        btn.className = 'mg-diag-btn';
        btn.innerHTML = `<span style="font-size:1.4rem">${loc.emoji}</span> ${loc.label}`;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mg-diag-btn').forEach(b => b.disabled = true);
            btn.classList.add(loc.correto ? 'selected-correct' : 'selected-wrong');
            if (!loc.correto) {
                document.querySelectorAll('.mg-diag-btn').forEach(b => {
                    if (b.textContent.includes('Baia seca')) b.classList.add('selected-correct');
                });
            }
            clearInterval(mgState.timerRef);
            setTimeout(() => showMGResult(loc.correto, loc.explain), 800);
        });
        area.appendChild(btn);
    });

    startMGTimer(G.isBovino ? 25 : 18, () => showMGResult(false, 'Baia seca e aquecida com lâmpada infravermelha é a resposta correta.'));
}

/* ── MG6: LER O TERMÔMETRO ── */
function buildThermometerMG() {
    const area = document.getElementById('mg-area');
    document.getElementById('mg-progress-label').textContent = 'O que indica esta temperatura?';

    // Gera temperatura aleatória
    const scenarios = [
        { temp: '36,2°C', label: 'Hipotermia moderada', correto: 0, opts: ['Hipotermia moderada', 'Temperatura normal', 'Febre', 'Hipotermia leve'] },
        { temp: '38,8°C', label: 'Normal', correto: 1, opts: ['Hipotermia', 'Normal', 'Febre leve', 'Hipotermia severa'] },
        { temp: '33,5°C', label: 'Hipotermia severa', correto: 2, opts: ['Normal baixo', 'Hipotermia moderada', 'Hipotermia severa', 'Febre'] },
        { temp: '40,4°C', label: 'Febre', correto: 3, opts: ['Normal', 'Normal alto', 'Hipotermia', 'Febre'] },
    ];
    const sc = scenarios[Math.floor(Math.random() * scenarios.length)];

    const display = document.createElement('div');
    display.className = 'mg-thermometer-display';
    display.innerHTML = `<div class="therm-tube"><div class="therm-mercury" style="height:${(parseFloat(sc.temp) - 30) / 15 * 100}%"></div></div><div class="therm-reading">${sc.temp}</div>`;
    area.appendChild(display);

    const explain = {
        'Hipotermia severa': 'T° < 35°C = hipotermia severa. Protocolo: aquecer + glicose intraperitoneal + colostro via sonda.',
        'Hipotermia moderada': 'T° 35–37°C = hipotermia moderada. Aquecer imediatamente antes de oferecer colostro.',
        'Normal': 'T° 38,5–39,5°C = normal em neonatos. Monitorar e garantir amamentação.',
        'Febre': 'T° > 40°C = febre. Investigar causa: infecção, septicemia. Acionar veterinário.',
    }[sc.label] || sc.label;

    sc.opts.forEach((o, i) => {
        const btn = document.createElement('button');
        btn.className = 'mg-diag-btn';
        btn.innerHTML = `<span class="opt-letter">${['A','B','C','D'][i]}</span> ${o}`;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mg-diag-btn').forEach(b => b.disabled = true);
            const correct = i === sc.correto;
            btn.classList.add(correct ? 'selected-correct' : 'selected-wrong');
            if (!correct) document.querySelectorAll('.mg-diag-btn')[sc.correto].classList.add('selected-correct');
            clearInterval(mgState.timerRef);
            setTimeout(() => showMGResult(correct, explain), 800);
        });
        area.appendChild(btn);
    });

    startMGTimer(20, () => showMGResult(false, explain));
}

/* ── MG7: MERGULHO NO IODO (interativo) ── */
function buildIodoDipMG() {
    const area = document.getElementById('mg-area');
    document.getElementById('mg-progress-label').textContent = 'MERGULHE o umbigo no iodo! Mantenha por 3 segundos!';

    const info = document.createElement('div');
    info.className = 'mg-decision-case';
    info.innerHTML = `🐄 Bezerro recém-nascido. O umbigo ainda está fresco.<br><strong>Pressione e segure</strong> o botão para mergulhar no iodo 10%.<br>Solte antes de 3 segundos = não mergulhou direito!`;
    area.appendChild(info);

    const progressDiv = document.createElement('div');
    progressDiv.className = 'mg-score-mini';
    progressDiv.textContent = '🧴 Segure para mergulhar...';
    area.appendChild(progressDiv);

    const holdBtn = document.createElement('button');
    holdBtn.className = 'mg-hold-btn';
    holdBtn.innerHTML = '🧴<br><span>Segure para Mergulhar!</span>';
    area.appendChild(holdBtn);

    let holding = false;
    let holdTime = 0;
    let holdInterval = null;
    let done = false;

    const startHold = () => {
        if (done) return;
        holding = true;
        holdBtn.classList.add('holding');
        holdInterval = setInterval(() => {
            holdTime += 0.1;
            const pct = Math.min(100, (holdTime / 3) * 100);
            progressDiv.textContent = `🧴 Mergulhando... ${Math.round(pct)}%`;
            holdBtn.style.background = `conic-gradient(var(--amber) ${pct * 3.6}deg, rgba(255,255,255,0.1) 0)`;
            if (holdTime >= 3) {
                clearInterval(holdInterval);
                done = true;
                clearInterval(mgState.timerRef);
                holdBtn.classList.remove('holding');
                showMGResult(true, 'Perfeito! Umbigo mergulhado no iodo por 3 segundos. Risco de onfalite reduzido em 50%!');
            }
        }, 100);
    };

    const endHold = () => {
        if (done) return;
        clearInterval(holdInterval);
        holding = false;
        holdBtn.classList.remove('holding');
        if (holdTime < 3 && holdTime > 0.2) {
            progressDiv.textContent = `🧴 Muito rápido! Só ${holdTime.toFixed(1)}s de 3s necessários!`;
            holdBtn.style.background = '';
            holdTime = 0;
        }
    };

    holdBtn.addEventListener('mousedown', startHold);
    holdBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(); });
    holdBtn.addEventListener('mouseup', endHold);
    holdBtn.addEventListener('mouseleave', endHold);
    holdBtn.addEventListener('touchend', endHold);

    startMGTimer(20, () => {
        if (!done) showMGResult(false, `Você segurou por ${holdTime.toFixed(1)}s. O mínimo é 3 segundos de contato com iodo 10%.`);
    });
}

/* ── MG8: HIGIENE DA BAIA ── */
function buildBaiaHygieneMG() {
    const area = document.getElementById('mg-area');
    document.getElementById('mg-progress-label').textContent = 'Selecione TUDO que é necessário para higienizar a baia!';

    const items = [
        { emoji: '🧹', label: 'Vassoura', correto: true },
        { emoji: '🧺', label: 'Cal virgem', correto: true },
        { emoji: '💧', label: 'Água limpa', correto: true },
        { emoji: '🍕', label: 'Restos de comida', correto: false },
        { emoji: '🌾', label: 'Cama seca (palha)', correto: true },
        { emoji: '🧴', label: 'Desinfetante', correto: true },
        { emoji: '🐀', label: 'Roedores presentes', correto: false },
        { emoji: '🦟', label: 'Fezes velhas', correto: false },
    ];

    const correct = items.filter(i => i.correto).length;
    let hits = 0;
    let errors = 0;

    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'mg-score-mini';
    scoreDiv.textContent = `✅ 0/${correct} itens corretos`;
    area.appendChild(scoreDiv);

    const grid = document.createElement('div');
    grid.className = 'mg-alvo-grid';
    area.appendChild(grid);

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'mg-alvo-item';
        div.innerHTML = `${item.emoji}<span>${item.label}</span>`;
        div.addEventListener('click', () => {
            if (div.classList.contains('disabled')) return;
            div.classList.add('disabled');
            if (item.correto) { hits++; div.classList.add('hit-correct'); }
            else { errors++; div.classList.add('hit-wrong'); }
            scoreDiv.textContent = `✅ ${hits}/${correct} | ❌ ${errors} erro(s)`;
            if (hits === correct) {
                clearInterval(mgState.timerRef);
                setTimeout(() => showMGResult(errors === 0, errors === 0
                    ? 'Baia perfeita! Ambiente limpo reduz drasticamente o risco de infecções neonatais.'
                    : `Você incluiu itens que não devem estar na baia. Higiene rigorosa é essencial.`), 500);
            }
        });
        grid.appendChild(div);
    });

    startMGTimer(30, () => showMGResult(hits >= correct * 0.7, `Tempo! ${hits}/${correct} itens corretos selecionados.`));
}

/* ── MG9: MONTE O COCHO (arrasta-e-solta simplificado) ── */
function buildTroughFillMG() {
    const area = document.getElementById('mg-area');
    document.getElementById('mg-progress-label').textContent = 'Toque nos alimentos CORRETOS para a fêmea lactante!';

    const instr = document.createElement('div');
    instr.className = 'mg-decision-case';
    instr.innerHTML = `${G.isBovino ? '🐄' : '🐑'} Fêmea em pico de lactação com filhote.<br>Selecione os <strong>alimentos adequados</strong> para manter a produção de leite!`;
    area.appendChild(instr);

    const foods = G.isBovino ? [
        { emoji: '🌾', label: 'Silagem', correto: true },
        { emoji: '🥩', label: 'Farelo proteico', correto: true },
        { emoji: '🧂', label: 'Sal mineral', correto: true },
        { emoji: '🍬', label: 'Açúcar puro', correto: false },
        { emoji: '🌿', label: 'Pastagem', correto: true },
        { emoji: '🍺', label: 'Subproduto estragado', correto: false },
    ] : [
        { emoji: '🌾', label: 'Feno', correto: true },
        { emoji: '🥩', label: 'Concentrado proteico', correto: true },
        { emoji: '🧂', label: 'Sal mineral', correto: true },
        { emoji: '💊', label: 'Propileno glicol', correto: true },
        { emoji: '🍫', label: 'Chocolate', correto: false },
        { emoji: '🌿', label: 'Pastagem verde', correto: true },
    ];

    const correct = foods.filter(f => f.correto).length;
    let hits = 0, errors = 0;

    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'mg-score-mini';
    scoreDiv.textContent = `🌿 0/${correct} corretos`;
    area.appendChild(scoreDiv);

    const grid = document.createElement('div');
    grid.className = 'mg-alvo-grid';
    area.appendChild(grid);

    foods.forEach(item => {
        const div = document.createElement('div');
        div.className = 'mg-alvo-item';
        div.innerHTML = `${item.emoji}<span>${item.label}</span>`;
        div.addEventListener('click', () => {
            if (div.classList.contains('disabled')) return;
            div.classList.add('disabled');
            if (item.correto) { hits++; div.classList.add('hit-correct'); }
            else { errors++; div.classList.add('hit-wrong'); }
            scoreDiv.textContent = `🌿 ${hits}/${correct} | ❌ ${errors}`;
            if (hits === correct) {
                clearInterval(mgState.timerRef);
                setTimeout(() => showMGResult(errors === 0, errors === 0
                    ? 'Cocho perfeito! Fêmea bem nutrida = mais leite = cria mais saudável!'
                    : `Quase! Mas ${errors} alimento(s) inadequado(s) afetam a saúde.`), 500);
            }
        });
        grid.appendChild(div);
    });

    startMGTimer(30, () => showMGResult(hits >= correct * 0.7, `Tempo! ${hits}/${correct} alimentos corretos.`));
}

/* ── MG10: CALENDÁRIO VACINAL ── */
function buildVaccineScheduleMG() {
    const area = document.getElementById('mg-area');
    document.getElementById('mg-progress-label').textContent = 'Toque no MOMENTO CERTO para vacinar!';

    const info = document.createElement('div');
    info.className = 'mg-decision-case';
    info.innerHTML = `💉 ${G.isBovino ? 'A vaca' : 'A ovelha'} vai parir em <strong>30 dias</strong>.<br>Quando você deve aplicar a vacina clostridial<br>para garantir anticorpos no colostro?`;
    area.appendChild(info);

    // Timeline visual
    const timeline = document.createElement('div');
    timeline.className = 'mg-vaccine-timeline';
    timeline.innerHTML = `
        <div class="vt-label">HOJE</div>
        <div class="vt-track">
            <div class="vt-point" data-days="0" data-label="Hoje (0 dias)">0d</div>
            <div class="vt-point" data-days="7" data-label="1 semana antes">7d</div>
            <div class="vt-point correct-point" data-days="28" data-label="4 semanas antes ✅">28d</div>
            <div class="vt-point" data-days="30" data-label="Dia do parto — TARDE!">Parto</div>
        </div>
        <div class="vt-label">PARTO</div>
    `;
    area.appendChild(timeline);

    const hint = document.createElement('div');
    hint.className = 'mg-score-mini';
    hint.textContent = 'Clique no ponto ideal da linha do tempo!';
    area.appendChild(hint);

    let selected = false;
    timeline.querySelectorAll('.vt-point').forEach(pt => {
        pt.addEventListener('click', () => {
            if (selected) return;
            selected = true;
            clearInterval(mgState.timerRef);
            const days = parseInt(pt.dataset.days);
            const isCorrect = days >= 21 && days <= 42; // 3-6 semanas
            pt.classList.add(isCorrect ? 'vt-selected-correct' : 'vt-selected-wrong');
            timeline.querySelector('.correct-point')?.classList.add('vt-highlight');
            const msg = isCorrect
                ? 'Correto! 4–6 semanas antes do parto garante anticorpos no colostro para proteger o neonato.'
                : `${pt.dataset.label}: ${days === 0 || days === 7 ? 'Cedo demais ou tarde demais!' : 'Muito em cima do parto — anticorpos não se concentram a tempo no colostro.'}`;
            setTimeout(() => showMGResult(isCorrect, msg), 800);
        });
    });

    startMGTimer(20, () => showMGResult(false, '4–6 semanas antes do parto é o prazo ideal para vacinação clostridial.'));
}

/* ── MG11: LOCAL DE APLICAÇÃO ── */
function buildInjectionSiteMG() {
    const area = document.getElementById('mg-area');
    document.getElementById('mg-progress-label').textContent = 'Toque no LOCAL CORRETO para a injeção subcutânea!';

    const info = document.createElement('div');
    info.className = 'mg-decision-case';
    info.innerHTML = `💉 Aplique a vacina subcutânea no local correto do ${G.isBovino ? 'bovino' : 'ovino'}.<br><small>Vacinas SC: preferencialmente região cervical ou flanco</small>`;
    area.appendChild(info);

    const animalSVG = document.createElement('div');
    animalSVG.className = 'mg-animal-svg';
    animalSVG.innerHTML = G.isBovino ? `
        <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:320px;margin:0 auto;display:block">
            <!-- Corpo -->
            <ellipse cx="170" cy="115" rx="90" ry="45" fill="#8B7355" opacity="0.85"/>
            <!-- Cabeça -->
            <ellipse cx="68" cy="105" rx="38" ry="32" fill="#8B7355" opacity="0.85"/>
            <!-- Orelha -->
            <ellipse cx="55" cy="80" rx="10" ry="16" fill="#a08870" transform="rotate(-20,55,80)"/>
            <!-- Focinho -->
            <ellipse cx="40" cy="112" rx="16" ry="12" fill="#a08870"/>
            <!-- Pernas -->
            <rect x="110" y="150" width="18" height="35" rx="5" fill="#7a6545"/>
            <rect x="145" y="150" width="18" height="35" rx="5" fill="#7a6545"/>
            <rect x="200" y="150" width="18" height="35" rx="5" fill="#7a6545"/>
            <rect x="235" y="150" width="18" height="35" rx="5" fill="#7a6545"/>
            <!-- Rabo -->
            <path d="M255 110 Q280 80 270 65" stroke="#8B7355" stroke-width="6" fill="none" stroke-linecap="round"/>
            <!-- Úbere -->
            <ellipse cx="175" cy="158" rx="25" ry="14" fill="#d4a0a0" opacity="0.8"/>
            <!-- Zonas clicáveis -->
            <ellipse id="z-cervical" cx="90" cy="90" rx="22" ry="18" fill="rgba(94,186,133,0.15)" stroke="rgba(94,186,133,0.4)" stroke-width="2" stroke-dasharray="4" class="inj-zone" data-label="Pescoço/Cervical" data-correct="true"/>
            <text x="90" y="93" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.7)">Pescoço</text>
            <ellipse id="z-flanco" cx="215" cy="100" rx="30" ry="22" fill="rgba(94,186,133,0.15)" stroke="rgba(94,186,133,0.4)" stroke-width="2" stroke-dasharray="4" class="inj-zone" data-label="Flanco" data-correct="true"/>
            <text x="215" y="103" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.7)">Flanco</text>
            <ellipse id="z-ubere" cx="175" cy="158" rx="24" ry="13" fill="rgba(217,64,64,0.15)" stroke="rgba(217,64,64,0.35)" stroke-width="2" stroke-dasharray="4" class="inj-zone" data-label="Úbere (ERRADO!)" data-correct="false"/>
            <text x="175" y="161" text-anchor="middle" font-size="8" fill="rgba(255,150,150,0.8)">Úbere</text>
            <ellipse id="z-perna" cx="155" cy="165" rx="20" ry="10" fill="rgba(217,64,64,0.15)" stroke="rgba(217,64,64,0.35)" stroke-width="2" stroke-dasharray="4" class="inj-zone" data-label="Perna (não indicado)" data-correct="false"/>
            <text x="155" y="168" text-anchor="middle" font-size="8" fill="rgba(255,150,150,0.8)">Perna</text>
        </svg>
    ` : `
        <svg viewBox="0 0 300 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:300px;margin:0 auto;display:block">
            <!-- Corpo -->
            <ellipse cx="160" cy="110" rx="80" ry="40" fill="#c8b89a" opacity="0.85"/>
            <!-- Cabeça -->
            <ellipse cx="68" cy="100" rx="32" ry="28" fill="#c8b89a" opacity="0.85"/>
            <!-- Orelha -->
            <ellipse cx="54" cy="78" rx="8" ry="14" fill="#b0a08a" transform="rotate(-15,54,78)"/>
            <!-- Chifres -->
            <path d="M70 75 Q68 58 80 55" stroke="#8B7355" stroke-width="4" fill="none" stroke-linecap="round"/>
            <!-- Focinho -->
            <ellipse cx="44" cy="107" rx="14" ry="10" fill="#b0a08a"/>
            <!-- Lã dorsal -->
            <ellipse cx="158" cy="82" rx="76" ry="20" fill="rgba(255,255,255,0.2)" opacity="0.6"/>
            <!-- Pernas -->
            <rect x="105" y="143" width="15" height="32" rx="5" fill="#a09080"/>
            <rect x="135" y="143" width="15" height="32" rx="5" fill="#a09080"/>
            <rect x="185" y="143" width="15" height="32" rx="5" fill="#a09080"/>
            <rect x="215" y="143" width="15" height="32" rx="5" fill="#a09080"/>
            <!-- Rabo -->
            <path d="M238 108 Q255 85 248 72" stroke="#c8b89a" stroke-width="5" fill="none" stroke-linecap="round"/>
            <!-- Zonas clicáveis -->
            <ellipse id="z-cervical" cx="88" cy="88" rx="20" ry="16" fill="rgba(94,186,133,0.15)" stroke="rgba(94,186,133,0.4)" stroke-width="2" stroke-dasharray="4" class="inj-zone" data-label="Pescoço/Cervical" data-correct="true"/>
            <text x="88" y="91" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.7)">Pescoço</text>
            <ellipse id="z-flanco" cx="200" cy="96" rx="28" ry="20" fill="rgba(94,186,133,0.15)" stroke="rgba(94,186,133,0.4)" stroke-width="2" stroke-dasharray="4" class="inj-zone" data-label="Flanco" data-correct="true"/>
            <text x="200" y="99" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.7)">Flanco</text>
            <ellipse id="z-perna" cx="150" cy="158" rx="20" ry="10" fill="rgba(217,64,64,0.15)" stroke="rgba(217,64,64,0.35)" stroke-width="2" stroke-dasharray="4" class="inj-zone" data-label="Perna (não indicado)" data-correct="false"/>
            <text x="150" y="161" text-anchor="middle" font-size="8" fill="rgba(255,150,150,0.8)">Perna</text>
        </svg>
    `;
    area.appendChild(animalSVG);

    const hint2 = document.createElement('div');
    hint2.className = 'mg-score-mini';
    hint2.textContent = '🎯 Toque em uma zona destacada';
    area.appendChild(hint2);

    animalSVG.querySelectorAll('.inj-zone').forEach(zone => {
        zone.style.cursor = 'pointer';
        zone.addEventListener('click', () => {
            const isCorrect = zone.dataset.correct === 'true';
            animalSVG.querySelectorAll('.inj-zone').forEach(z => {
                z.style.opacity = '0.3';
                if (z.dataset.correct === 'true') z.setAttribute('fill', 'rgba(94,186,133,0.4)');
            });
            zone.setAttribute('fill', isCorrect ? 'rgba(94,186,133,0.7)' : 'rgba(217,64,64,0.7)');
            zone.style.opacity = '1';
            clearInterval(mgState.timerRef);
            const msg = isCorrect
                ? `Correto! ${zone.dataset.label} é um local adequado para vacinas SC. Boa absorção e baixo risco.`
                : `${zone.dataset.label} — Evitar! Use pescoço ou flanco para vacinas SC em bovinos e ovinos.`;
            setTimeout(() => showMGResult(isCorrect, msg), 800);
        });
    });

    startMGTimer(22, () => showMGResult(false, 'Locais corretos: pescoço/cervical ou flanco — boa absorção, sem risco para estruturas vitais.'));
}

/* ── MG12: CALCULAR TMN ── */
function buildTMNCalcMG() {
    const area = document.getElementById('mg-area');
    document.getElementById('mg-progress-label').textContent = 'Calcule a Taxa de Mortalidade Neonatal!';

    const scenarios = [
        { nascidos: 80, mortos: 4, tmnStr: '5%', correct: 1, opts: ['2,5%', '5%', '10%', '20%'], explain: 'TMN = 4/80×100 = 5%. Para bovinos manejados, é o limite máximo aceitável. Monitorar!' },
        { nascidos: 120, mortos: 18, tmnStr: '15%', correct: 2, opts: ['5%', '10%', '15%', '25%'], explain: 'TMN = 18/120×100 = 15%. Resultado RUIM para bovinos (meta < 5%). Revisão urgente do protocolo!' },
        { nascidos: 50, mortos: 2, tmnStr: '4%', correct: 0, opts: ['4%', '8%', '10%', '12%'], explain: 'TMN = 2/50×100 = 4%. Excelente! Abaixo de 5% para bovinos — manejo eficiente.' },
    ];
    const sc = scenarios[Math.floor(Math.random() * scenarios.length)];

    const infoDiv = document.createElement('div');
    infoDiv.className = 'mg-decision-case';
    infoDiv.innerHTML = `📊 Fazenda com <strong>${sc.nascidos}</strong> neonatos nascidos.<br><strong>${sc.mortos}</strong> morreram na primeira semana.<br><br>Qual é a TMN?<br><small>Fórmula: mortos ÷ nascidos × 100</small>`;
    area.appendChild(infoDiv);

    sc.opts.forEach((o, i) => {
        const btn = document.createElement('button');
        btn.className = 'mg-diag-btn';
        btn.innerHTML = `<span class="opt-letter">${['A','B','C','D'][i]}</span> ${o}`;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mg-diag-btn').forEach(b => b.disabled = true);
            const correct = i === sc.correct;
            btn.classList.add(correct ? 'selected-correct' : 'selected-wrong');
            if (!correct) document.querySelectorAll('.mg-diag-btn')[sc.correct].classList.add('selected-correct');
            clearInterval(mgState.timerRef);
            setTimeout(() => showMGResult(correct, sc.explain), 800);
        });
        area.appendChild(btn);
    });

    startMGTimer(G.isBovino ? 30 : 22, () => showMGResult(false, sc.explain));
}

/* ── MG GENÉRICO: ERRO OU ACERTO ── */
function buildErraCertoMG(cases) {
    if (!cases || !cases.length) { showMGResult(true, 'Atividade concluída!'); return; }
    const area = document.getElementById('mg-area');
    let idx = 0, correctCount = 0, answered = false;

    const caseBox = document.createElement('div');
    caseBox.className = 'mg-erracerto-case';
    area.appendChild(caseBox);

    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'mg-score-mini';
    area.appendChild(scoreDiv);

    const btns = document.createElement('div');
    btns.className = 'mg-erracerto-btns';
    btns.innerHTML = `<button class="mg-erracerto-btn yes">✅ Correto</button><button class="mg-erracerto-btn no">❌ Errado</button>`;
    area.appendChild(btns);

    const updateCase = () => {
        if (idx >= cases.length) {
            clearInterval(mgState.timerRef);
            showMGResult(correctCount >= Math.ceil(cases.length / 2), `Você acertou ${correctCount}/${cases.length} práticas.`);
            return;
        }
        caseBox.textContent = cases[idx].pratica;
        caseBox.className = 'mg-erracerto-case';
        scoreDiv.textContent = `✅ ${correctCount}/${idx} corretos`;
        document.getElementById('mg-progress-label').textContent = `Prática ${idx + 1} de ${cases.length}`;
        answered = false;
    };
    updateCase();

    const handleAnswer = (userSayCorrect) => {
        if (answered) return;
        answered = true;
        const c = cases[idx];
        const isRight = (userSayCorrect === c.correto);
        caseBox.classList.add(isRight ? 'flashing-correct' : 'flashing-wrong');
        if (isRight) correctCount++;
        scoreDiv.textContent = c.explain;
        scoreDiv.style.color = isRight ? 'var(--verde1,var(--green2))' : 'var(--vermelho,var(--red))';
        idx++;
        setTimeout(updateCase, 1600);
    };

    btns.querySelector('.yes').addEventListener('click', () => handleAnswer(true));
    btns.querySelector('.no').addEventListener('click', () => handleAnswer(false));

    startMGTimer(40, () => showMGResult(correctCount >= Math.ceil(cases.length / 2), `Tempo! ${correctCount} acertos.`));
}

/* ── TIMER DO MINIGAME ── */
function startMGTimer(seconds, onTimeout) {
    const bar = document.getElementById('mg-timer-bar');
    let t = seconds;
    mgState.timerRef = setInterval(() => {
        t -= 0.1;
        const pct = (t / seconds) * 100;
        bar.style.width = pct + '%';
        if (pct < 30) bar.style.background = 'linear-gradient(90deg,#ff6b6b,#e63946)';
        else if (pct < 60) bar.style.background = 'linear-gradient(90deg,#f4d35e,#f4a261)';
        if (t <= 0) {
            clearInterval(mgState.timerRef);
            onTimeout();
        }
    }, 100);
}

/* ── RESULTADO DO MINIGAME ── */
function showMGResult(win, message) {
    clearInterval(mgState.timerRef);
    document.getElementById('mg-area').style.opacity = '0.3';

    const impact = currentMG.survivalImpact;
    if (win) {
        G.mgWins++;
        G.score += 200;
        G.money += 100;
        G.survival = Math.min(100, G.survival + impact.win);
    } else {
        G.survival = Math.max(0, G.survival + impact.lose);
        if (!G.isBovino) G.hearts = Math.max(0, G.hearts - 1);
        if (G.hearts <= 0) { showGameOver(); return; }
    }

    const res = document.getElementById('mg-result');
    res.classList.add('show');
    document.getElementById('mg-result-icon').textContent = win ? '✅' : '❌';
    document.getElementById('mg-result-title').textContent = win ? 'Ótimo trabalho!' : 'Revise o protocolo!';
    document.getElementById('mg-consequence').innerHTML =
        `<strong>${win ? '🎉 Consequência:' : '⚠️ Consequência:'}</strong><br>${message}<br><br>` +
        `🍼 Sobrevivência: ${win ? '+' : ''}${win ? impact.win : impact.lose}%` +
        (win ? `<br>💰 +R$ 100 | ⭐ +200 pts` : '');

    // Scroll to result on mobile so the user sees it
    setTimeout(() => {
        const mgScreen = document.getElementById('screen-minigame');
        if (mgScreen) mgScreen.scrollTop = mgScreen.scrollHeight;
        res.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);

    updateHUD();
}

function finishMinigame() {
    switchScreen('screen-quiz');
    renderQuestion();
}

/* ───────────────────────────────────────
   REPORT
─────────────────────────────────────── */
function showReport() {
    const st = STATIONS[G.stationIdx];
    document.getElementById('rep-hits').textContent = G.stationHits + '/' + stationQuestions.length;
    document.getElementById('rep-mg').textContent = G.mgWins + ' vencido(s)';
    document.getElementById('rep-survival').textContent = Math.round(G.survival) + '%';
    document.getElementById('rep-money').textContent = '+R$ ' + G.stationMoneyEarned;
    document.getElementById('rep-vet').textContent = st.vetTip;
    switchScreen('screen-report');
}

function nextStation() {
    G.stationIdx++;
    loadStation();
}

/* ───────────────────────────────────────
   FINAL
─────────────────────────────────────── */
function showFinal() {
    const pct = Math.round(G.survival);
    let title = pct >= 80 ? '🏆 Veterinário Excelente!' :
                pct >= 60 ? '👨‍🌾 Bom Produtor!' :
                pct >= 40 ? '📚 Ainda Aprendendo' : '💔 Muitas Perdas — Tente Novamente';
    document.getElementById('final-title').textContent = title;
    document.getElementById('final-mode-label').textContent = G.species + ' · ' + G.farm;
    document.getElementById('final-score').textContent = G.score + ' pts';
    document.getElementById('final-money').textContent = 'R$ ' + G.money;
    document.getElementById('final-hearts').textContent = G.hearts + '/5';
    document.getElementById('final-survival').textContent = pct + '%';
    document.getElementById('final-mg').textContent = G.mgWins + '/' + G.mgTotal;

    saveRanking();
    switchScreen('screen-final');
}

/* ───────────────────────────────────────
   RANKING
─────────────────────────────────────── */
function saveRanking() {
    const entry = {
        farm: G.farm, species: G.species,
        score: G.score, survival: Math.round(G.survival),
        money: G.money, date: new Date().toLocaleDateString('pt-BR'),
    };
    let ranking = JSON.parse(localStorage.getItem('vc_ranking') || '[]');
    ranking.push(entry);
    ranking.sort((a, b) => b.score - a.score);
    ranking = ranking.slice(0, 10);
    localStorage.setItem('vc_ranking', JSON.stringify(ranking));
}

function showRanking() {
    const ranking = JSON.parse(localStorage.getItem('vc_ranking') || '[]');
    const list = document.getElementById('ranking-list');
    list.innerHTML = '';
    if (!ranking.length) {
        list.innerHTML = '<p style="text-align:center;color:var(--text2);padding:20px">Nenhum resultado ainda. Jogue para aparecer aqui!</p>';
    }
    ranking.forEach((r, i) => {
        const cls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        const div = document.createElement('div');
        div.className = 'rank-item';
        div.innerHTML = `
            <div class="rank-pos ${cls}">${i + 1}</div>
            <div class="rank-info">
                <div class="rank-name">${r.farm}</div>
                <div class="rank-meta">${r.species} • ${r.date} • 🍼 ${r.survival}%</div>
            </div>
            <div class="rank-score">⭐ ${r.score}</div>
        `;
        list.appendChild(div);
    });
    const current = document.querySelector('.screen.active')?.id || 'screen-splash';
    G.prevScreen = current;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-ranking').classList.add('active');
}

function closeRanking() {
    switchScreen(G.prevScreen || 'screen-splash');
}

/* ───────────────────────────────────────
   SHOW STATION INTRO (exposed for HTML patch)
─────────────────────────────────────── */
function showStationIntro() {
    loadStation();
}

/* ───────────────────────────────────────
   INIT
─────────────────────────────────────── */
(function init() {
    updateHUD();
})();
/* ═══════════════════════════════════════════════════════════
   EXTENSÕES — VIDAS DO CAMPO v2.1
   • 5 corações
   • Cronômetro global
   • Ranking com tempo
   • Tela inicial animada com animais
   • Casos clínicos por etapa
   • Sons de acerto, erro e minijogo
═══════════════════════════════════════════════════════════ */

/* ───────────────────────────────────────
   CRONÔMETRO GLOBAL
─────────────────────────────────────── */
const TIMER = {
    startTime: null,
    timerRef: null,
    totalSeconds: 0,
    running: false,
};

function startGlobalTimer() {
    TIMER.startTime = Date.now();
    TIMER.running = true;
    TIMER.timerRef = setInterval(() => {
        if (!TIMER.running) return;
        const elapsed = Math.floor((Date.now() - TIMER.startTime) / 1000);
        TIMER.totalSeconds = elapsed;
        const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
        const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
        const s = (elapsed % 60).toString().padStart(2, '0');
        const el = document.getElementById('hud-timer');
        if (el) el.textContent = `${h}:${m}:${s}`;
    }, 1000);
}

function stopGlobalTimer() {
    TIMER.running = false;
    if (TIMER.timerRef) clearInterval(TIMER.timerRef);
}

function getFormattedTime() {
    const elapsed = TIMER.totalSeconds;
    const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
    const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

/* ───────────────────────────────────────
   SONS (Web Audio API)
─────────────────────────────────────── */
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return audioCtx;
}

function playSound(type) {
    if (G.muted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    if (type === 'correct') {
        // Happy ascending chime
        const freqs = [523, 659, 784, 1047];
        freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            g.gain.setValueAtTime(0, now + i * 0.1);
            g.gain.linearRampToValueAtTime(0.18, now + i * 0.1 + 0.04);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    } else if (type === 'wrong') {
        // Low descending buzz
        const freqs = [350, 280];
        freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);
            g.gain.setValueAtTime(0, now + i * 0.12);
            g.gain.linearRampToValueAtTime(0.14, now + i * 0.12 + 0.04);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.3);
        });
    } else if (type === 'minigame_start') {
        // Exciting fanfare
        const notes = [392, 523, 659, 523, 659, 784];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            g.gain.setValueAtTime(0, now + i * 0.08);
            g.gain.linearRampToValueAtTime(0.1, now + i * 0.08 + 0.03);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.18);
        });
    } else if (type === 'minigame_win') {
        // Victory jingle
        const notes = [523, 659, 784, 1047, 1047];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);
            g.gain.setValueAtTime(0, now + i * 0.12);
            g.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.35);
        });
    } else if (type === 'minigame_lose') {
        // Sad wah-wah
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.5);
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.65);
    } else if (type === 'tap') {
        // Quick tap click
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'timeout') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.4);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

/* ───────────────────────────────────────
   CASOS CLÍNICOS POR ETAPA
─────────────────────────────────────── */
const CLINICAL_CASES = {
    1: {
        title: '🐄 Caso: Vaca Cansada Antes do Parto',
        scenario: 'Dona Maria está preocupada com sua vaca Pretinha. Ela está grávida, faltam 3 semanas para o parto e parece muito magra — dá pra ver as costelas. A vaca come pouco e anda devagar.',
        findings: ['Costelas visíveis', 'Pouco apetite', '3 semanas para o parto', 'Anda devagar'],
        diagnosis: '✅ Diagnóstico: Condição corporal muito baixa (ECC 2,0)',
        treatment: '💊 O que fazer: Oferecer mais energia na dieta — silagem de milho e farelo de soja. Não forçar muito; alimentação gradual. Se não melhorar em 1 semana, chamar o veterinário. Uma vaca magra no parto vai ter mais dificuldade e o bezerro nascerá mais fraco.',
    },
    2: {
        title: '🍼 Caso: Bezerra Sem Mamar',
        scenario: 'A vaca Mimosa pariu à noite. De manhã, João encontra a bezerra ainda sem mamar — já fazem 5 horas. A vaca parece confusa e afasta a cria. A bezerra está em pé mas fraquinha.',
        findings: ['5h sem colostro', 'Vaca rejeitando', 'Bezerra fraca', 'Ainda em pé'],
        diagnosis: '⚠️ Situação: Privação de colostro em curso — janela imunológica fechando!',
        treatment: '💊 O que fazer: Tirar colostro da vaca na mão ou com ordenhadeira. Esquentar a 37°C (temperatura do corpo). Oferecer na mamadeira ou sonda. Se a bezerra não sugar, usar sonda esofágica. Cada minuto conta — após 6h a absorção de anticorpos cai muito.',
    },
    3: {
        title: '❄️ Caso: Cordeiro Molhado na Chuva',
        scenario: 'Pedro encontrou um cordeirinho que acabou de nascer no pasto durante uma chuva fria. Ele está tremendo, molhado e mal consegue ficar em pé. A temperatura da tarde é de 12°C.',
        findings: ['Tremendo muito', 'Todo molhado', '12°C no ambiente', 'Mal fica em pé'],
        diagnosis: '🚨 Diagnóstico: Hipotermia — o cordeiro está perdendo calor rapidamente',
        treatment: '💊 O que fazer: PRIMEIRO seque com toalha com força — o atrito aquece. Leve para local fechado e aquecido (caixa com toalha e lâmpada). Meça a temperatura retal. Se abaixo de 37°C, não dê colostro ainda — espere aquecer. Glicose intraperitoneal se estiver muito frio.',
    },
    4: {
        title: '🦠 Caso: Bezerro com Umbigo Inchado',
        scenario: 'Três dias após o nascimento, Ana nota que o umbigo do bezerro Pintado está vermelho, inchado e quente ao toque. O bezerro está com febre e não quer mamar. A barriga parece um pouco inchada.',
        findings: ['Umbigo quente e inchado', 'Febre', 'Não mama', 'Barriga inchada'],
        diagnosis: '⚠️ Diagnóstico: Onfalite (infecção do umbigo) com risco de septicemia',
        treatment: '💊 O que fazer: CHAMAR O VETERINÁRIO — esse quadro precisa de antibiótico injetável (penicilina ou ampicilina). Enquanto isso: limpar o umbigo com iodo 10%. Reidratar se estiver muito debilitado. Não esperar melhorar sozinho — infecção no umbigo pode ir para o sangue e matar em 1-2 dias.',
    },
    5: {
        title: '🌿 Caso: Ovelha que Parou de Produzir Leite',
        scenario: 'A ovelha Branca teve gêmeos há 15 dias. Ela parece abatida, come pouco, e os cordeiros ficam sempre mexendo nela tentando mamar mas parecem insatisfeitos. Os cordeiros estão perdendo peso.',
        findings: ['Cordeiros perdendo peso', 'Ovelha abatida', 'Gêmeos 15 dias', 'Come pouco'],
        diagnosis: '⚡ Diagnóstico: Cetose pós-parto (balanço energético negativo)',
        treatment: '💊 O que fazer: Oferecer propileno glicol (60-100 mL) 2 vezes ao dia na boca por 3-5 dias. Melhorar a qualidade do feno — azevém ou coast-cross. Adicionar farelo de soja. Separar os cordeiros brevemente para avaliar a mamada. Se muito grave, veterinário com glicose na veia.',
    },
    6: {
        title: '💉 Caso: Surto de Morte Súbita em Cordeiros',
        scenario: 'Em uma semana, três cordeiros gordos e aparentemente saudáveis de 3-4 semanas morreram de repente na fazenda do Seu Raimundo. Nenhum estava doente antes. As ovelhas não recebem vacinas há 2 anos.',
        findings: ['3 mortes em 1 semana', 'Cordeiros gordos e jovens', 'Morte súbita', 'Mães sem vacina há 2 anos'],
        diagnosis: '🚨 Diagnóstico: Enterotoxemia — Clostridium perfringens tipo D ("doença do cordeiro gordo")',
        treatment: '💊 O que fazer: Vacinar TODAS as ovelhas gestantes agora (clostridial polivalente). Fazer reforço 4-6 semanas antes dos próximos partos. Os cordeiros que ainda estão vivos podem receber soroterapia se disponível. Revisão urgente do protocolo vacinal do rebanho todo.',
    },
    7: {
        title: '📊 Caso: Fazenda com Muitas Perdas',
        scenario: 'Seu Carlos criou 180 bezerros esse ano. Perdeu 22 nas primeiras 2 semanas de vida. Ele não anota dados, não tem protocolo de colostro e o pasto do parto fica longe do galpão.',
        findings: ['22 mortes em 180 nascidos', 'Sem registro', 'Sem protocolo de colostro', 'Parto distante do galpão'],
        diagnosis: '📋 Análise: TMN = 12,2% — muito acima da meta de 5% para bovinos',
        treatment: '💊 O que fazer: 1) Criar ficha de cada cria (data, peso, colostro). 2) Supervisionar os partos — alguém presente ou câmera. 3) Dar colostro nas primeiras 2h garantido. 4) Aproximar área de parto do galpão para fácil intervenção. Com essas medidas, TMN pode cair para 3-4%.',
    },
};

/* ───────────────────────────────────────
   SOBRESCREVER FUNÇÕES EXISTENTES
─────────────────────────────────────── */

// Sobrescrever startGame para iniciar cronômetro e 5 corações
const _origStartGame = startGame;
window.startGame = function() {
    // Reuse the original logic but ensure 5 hearts and start timer
    const name = document.getElementById('input-farm').value.trim();
    G.farm = name || 'Fazenda Feliz';
    G.money = 0; G.score = 0; G.hearts = 5;
    G.survival = 100; G.streak = 0;
    G.stationIdx = 0; G.mgWins = 0; G.mgTotal = 0;
    // Start global timer
    stopGlobalTimer();
    TIMER.totalSeconds = 0;
    startGlobalTimer();
    loadStation();
};

// Patch selectAnswer to play sounds
const _origSelectAnswer = window.selectAnswer;
window.selectAnswer = function(idx, btn) {
    // Unlock audio context on user gesture
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    _origSelectAnswer(idx, btn);
};

// We need to intercept the feedback to inject sounds
// Override showMGResult to play sounds
const _origShowMGResult = window.showMGResult;
window.showMGResult = function(win, message) {
    if (win) playSound('minigame_win');
    else playSound('minigame_lose');
    _origShowMGResult(win, message);
};

// Override showMinigame to play fanfare
const _origShowMinigame = window.showMinigame;
window.showMinigame = function(mg) {
    playSound('minigame_start');
    _origShowMinigame(mg);
};

// Override showFinal to stop timer and save time
const _origShowFinal = window.showFinal;
window.showFinal = function() {
    stopGlobalTimer();
    const timeStr = getFormattedTime();
    G.finalTime = timeStr;
    _origShowFinal();
    const el = document.getElementById('final-time');
    if (el) el.textContent = timeStr;
};

// Override saveRanking to include time
const _origSaveRanking = window.saveRanking;
window.saveRanking = function() {
    const entry = {
        farm: G.farm, species: G.species,
        score: G.score, survival: Math.round(G.survival),
        money: G.money, date: new Date().toLocaleDateString('pt-BR'),
        time: G.finalTime || getFormattedTime(),
    };
    let ranking = JSON.parse(localStorage.getItem('vc_ranking') || '[]');
    ranking.push(entry);
    ranking.sort((a, b) => b.score - a.score);
    ranking = ranking.slice(0, 10);
    localStorage.setItem('vc_ranking', JSON.stringify(ranking));
};

// Override showRanking to display time
window.showRanking = function() {
    const ranking = JSON.parse(localStorage.getItem('vc_ranking') || '[]');
    const list = document.getElementById('ranking-list');
    list.innerHTML = '';
    if (!ranking.length) {
        list.innerHTML = '<p style="text-align:center;color:var(--text2);padding:20px">Nenhum resultado ainda. Jogue para aparecer aqui!</p>';
    }
    ranking.forEach((r, i) => {
        const cls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        const timeTag = r.time ? `<span class="rank-time">⏱️ ${r.time}</span>` : '';
        const div = document.createElement('div');
        div.className = 'rank-item';
        div.innerHTML = `
            <div class="rank-pos ${cls}">${i + 1}</div>
            <div class="rank-info">
                <div class="rank-name">${r.farm}</div>
                <div class="rank-meta">${r.species} • ${r.date} • 🍼 ${r.survival}% ${timeTag}</div>
            </div>
            <div class="rank-score">⭐ ${r.score}</div>
        `;
        list.appendChild(div);
    });
    const current = document.querySelector('.screen.active')?.id || 'screen-splash';
    G.prevScreen = current;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-ranking').classList.add('active');
};

/* ───────────────────────────────────────
   CASOS CLÍNICOS — INJECTION INTO REPORT
─────────────────────────────────────── */
function renderClinicalCase(stationIdx, containerId) {
    const cc = CLINICAL_CASES[stationIdx + 1];
    if (!cc) return;
    const el = document.getElementById(containerId);
    if (!el) return;
    el.style.display = 'block';
    el.innerHTML = `
        <div class="clinical-case-header">${cc.title}</div>
        <div class="clinical-case-content">
            <div class="cc-scenario">${cc.scenario}</div>
            <div class="cc-findings">
                ${cc.findings.map(f => `<span class="cc-finding-tag">🔍 ${f}</span>`).join('')}
            </div>
            <div class="cc-diagnosis">${cc.diagnosis}</div>
            <div class="cc-treatment"><strong>🩺 Conduta:</strong>${cc.treatment}</div>
        </div>
    `;
}

// showReport patch removed — clinical case now injected as quiz question

// Patch loadStation to show previous station's case in intro
// loadStation patch removed — clinical case now injected as quiz question

/* ───────────────────────────────────────
   SONS NO QUIZ — PATCH VIA DOM OBSERVATION
─────────────────────────────────────── */
(function patchQuizSounds() {
    const observer = new MutationObserver(() => {
        const fb = document.getElementById('feedback-box');
        if (!fb || !fb.classList.contains('show')) return;
        const title = document.getElementById('feedback-title')?.textContent || '';
        if (title.includes('✓')) { playSound('correct'); observer.disconnect(); setTimeout(reconnect, 300); }
        else if (title.includes('✗')) { playSound('wrong'); observer.disconnect(); setTimeout(reconnect, 300); }
        else if (title.includes('⏰')) { playSound('timeout'); observer.disconnect(); setTimeout(reconnect, 300); }
    });

    function reconnect() {
        const fb = document.getElementById('feedback-box');
        if (fb) observer.observe(fb, { attributes: true, attributeFilter: ['class'] });
    }

    // Also observe attribute changes on feedback-box
    const fb = document.getElementById('feedback-box');
    if (fb) observer.observe(fb, { attributes: true, attributeFilter: ['class'] });
})();

/* ───────────────────────────────────────
   SPLASH — EMOJI ANIMALS
─────────────────────────────────────── */
(function initSplashAnimals() {
    const cowA = document.getElementById('cow-a');
    const calfA = document.getElementById('calf-a');
    const cowB = document.getElementById('cow-b');
    const cowC = document.getElementById('cow-c');
    if (cowA) cowA.textContent = '🐄';
    if (calfA) calfA.textContent = '🐮';
    if (cowB) cowB.textContent = '🐄';
    if (cowC) cowC.textContent = '🐄';
})();

console.log('Vidas do Campo v2.1 — Extensões carregadas ✅');

/* ═══════════════════════════════════════════════════════════
   CASO CLÍNICO COMO ÚLTIMA QUESTÃO DE CADA ETAPA
═══════════════════════════════════════════════════════════ */

/*
  Cada CLINICAL_CASES[n] tem um campo .question que define a pergunta
  interativa. O caso clínico é injetado como a ÚLTIMA questão da etapa,
  com dificuldade 3 (Clínico), exibição especial (contexto + pergunta),
  e explicação detalhada com conduta.
*/

const CC_QUESTIONS = {
    1: {
        station: 1, d: 3, species: 'all', isClinicalCase: true,
        q: '🩺 CASO CLÍNICO: A vaca Pretinha está grávida, faltam 3 semanas para o parto. Dá pra ver as costelas, ela come pouco e anda devagar. Qual é o principal risco para o bezerro dela?',
        context: 'Dona Maria nota que a vaca Pretinha, que está quase no fim da gravidez, está muito magra — costelas aparecendo, comendo pouco e vagarosa.',
        opts: [
            'Nenhum risco — vaca magra pare normalmente',
            'Bezerro nascerá mais fraco, com menos energia e imunidade',
            'Excesso de leite logo após o parto',
            'Risco de parto gemelar inesperado',
        ],
        correct: 1,
        hint: 'A condição da mãe no pré-parto influencia diretamente o vigor e a imunidade do bezerro.',
        explain: '✅ CORRETO! Vaca muito magra no pré-parto (ECC < 2,5) tem menos reserva de energia para o parto, produz menos colostro e de pior qualidade. O bezerro nasce mais fraco, com menos gordura corporal e menor capacidade de absorver anticorpos. O que fazer: oferecer mais silagem de milho e farelo de soja gradualmente. Chamar o veterinário se não melhorar.',
    },
    2: {
        station: 2, d: 3, species: 'all', isClinicalCase: true,
        q: '🩺 CASO CLÍNICO: João achou a bezerra sem mamar às 5h da manhã — a vaca pariu de madrugada e está afastando a cria. A bezerra está em pé mas bem fraquinha. O que João deve fazer PRIMEIRO?',
        context: 'Vaca Mimosa pariu durante a noite. De manhã, a bezerra ainda não mamou — já fazem 5 horas. A vaca afasta a cria. A bezerra está em pé mas cansada.',
        opts: [
            'Esperar mais um pouco — a vaca vai aceitar a cria sozinha',
            'Tirar colostro da vaca na mão e oferecer na mamadeira aquecida a 37°C',
            'Dar leite em pó imediatamente para não perder tempo',
            'Separar a bezerra e colocar com outra vaca para mamar',
        ],
        correct: 1,
        hint: 'Já fazem 5 horas. A janela de absorção de anticorpos fecha após 6-8h. Cada minuto conta.',
        explain: '✅ CORRETO! Com 5h sem colostro, a janela está quase fechando. A ação certa: tirar o colostro da própria mãe (mais rico em anticorpos específicos), esquentar a 37°C (temperatura corporal), e oferecer em mamadeira. Se a bezerra não sugar, usar sonda esofágica. Leite em pó não tem anticorpos — não substitui o colostro neste momento crítico.',
    },
    3: {
        station: 3, d: 3, species: 'all', isClinicalCase: true,
        q: '🩺 CASO CLÍNICO: Pedro encontrou um cordeirinho recém-nascido no pasto, tremendo, molhado, com temperatura de 12°C lá fora. O animal mal fica em pé. Qual a ordem correta das ações?',
        context: 'Tarde fria, chuva. Um cordeiro acabou de nascer no pasto encharcado. Está tremendo, molhado, mal se sustenta. Pedro precisa agir rápido.',
        opts: [
            '1) Dar colostro → 2) Secar → 3) Levar para dentro',
            '1) Secar com força → 2) Levar para local aquecido → 3) Medir temperatura → 4) Colostro só após aquecer',
            '1) Injeção de vitamina → 2) Secar → 3) Colostro quente',
            '1) Deixar com a mãe → 2) Observar por 1 hora → 3) Intervir se piorar',
        ],
        correct: 1,
        hint: 'NUNCA dê colostro a um animal hipotérmico — o intestino frio não funciona e pode causar problemas graves.',
        explain: '✅ CORRETO! A sequência é: secar com toalha primeiro (o atrito ajuda a aquecer), levar para abrigo quente, medir temperatura retal. Se abaixo de 37°C: NÃO dê colostro ainda. Abaixo de 35°C: glicose intraperitoneal antes do colostro. Colostro só após o animal estar aquecido e com reflexo de sucção. Alimentar animal hipotérmico pode ser fatal.',
    },
    4: {
        station: 4, d: 3, species: 'all', isClinicalCase: true,
        q: '🩺 CASO CLÍNICO: Com 3 dias de vida, o bezerro Pintado tem o umbigo vermelho, quente e inchado. Tem febre e parou de mamar. A barriga está levemente estufada. O que fazer?',
        context: 'Ana nota no bezerro Pintado, com 3 dias, um umbigo visivelmente inchado e quente. Ele tem febre, não quer mamar e a barriguinha parece um pouco inflada.',
        opts: [
            'Passar álcool no umbigo e esperar melhorar',
            'Chamar o veterinário urgente — precisa de antibiótico injetável + cuidados de suporte',
            'Dar mais leite para ele recuperar as forças',
            'Aplicar pomada cicatrizante no umbigo e observar por 2 dias',
        ],
        correct: 1,
        hint: 'Umbigo infectado + febre + deixou de mamar = infecção sistêmica começando. Isso não melhora sozinho.',
        explain: '✅ CORRETO! Onfalite com febre é urgência. A infecção pode ir para o sangue (septicemia) e matar em 24-48h. O veterinário vai prescrever antibiótico injetável (penicilina ou ampicilina), tratamento local do umbigo e reidratação se necessário. Álcool e pomada não atingem a infecção profunda. Tempo é vida nesse caso.',
    },
    5: {
        station: 5, d: 3, species: 'all', isClinicalCase: true,
        q: '🩺 CASO CLÍNICO: A ovelha Branca tem gêmeos de 15 dias. Ela parece abatida, come mal, hálito meio adocicado, e os cordeiros ficam insatisfeitos após mamar. Os filhotes estão perdendo peso. O diagnóstico mais provável é:',
        context: 'Ovelha Branca, gêmeos de 15 dias, abatida, comendo pouco. Hálito levemente adocicado. Cordeiros perdem peso mesmo mamando.',
        opts: [
            'Mastite — infecção no úbere',
            'Cetose pós-parto — falta de energia para produzir leite para dois',
            'Gripe — vai melhorar sozinha em alguns dias',
            'Os cordeiros estão com verme — tratar os filhotes',
        ],
        correct: 1,
        hint: 'Hálito adocicado + ovelha fraca + gêmeos sugando muito = desequilíbrio de energia.',
        explain: '✅ CORRETO! Cetose pós-parto: o corpo da ovelha está "queimando gordura" para produzir leite para dois, gerando corpos cetônicos (daí o hálito adocicado). Tratamento: propileno glicol 60-100 mL na boca, 2x por dia, por 3-5 dias. Melhorar a dieta com feno de qualidade e farelo. Casos graves precisam de glicose na veia. Não é gripe nem verme.',
    },
    6: {
        station: 6, d: 3, species: 'all', isClinicalCase: true,
        q: '🩺 CASO CLÍNICO: Em uma semana, três cordeiros gordos e saudáveis de 3-4 semanas morreram de repente. Nenhum estava doente antes. As ovelhas não recebem vacina há 2 anos. Qual a causa mais provável e o que fazer agora?',
        context: 'Seu Raimundo perdeu 3 cordeiros gordos e jovens em uma semana, todos de morte súbita sem aviso. As mães não são vacinadas há 2 anos.',
        opts: [
            'Envenenamento por planta — cercar a área e aguardar',
            'Enterotoxemia (Clostridium) — vacinar todas as ovelhas gestantes urgente',
            'Verminose aguda — vermifugar todos os cordeiros',
            'Falta de minerais — colocar sal mineral à vontade',
        ],
        correct: 1,
        hint: 'Morte súbita em cordeiros bem nutridos + mães sem vacina há 2 anos = doença clostridial clássica.',
        explain: '✅ CORRETO! Enterotoxemia por Clostridium perfringens tipo D — a "doença do cordeiro gordo". Paradoxalmente atinge os mais bem alimentados. A toxina produzida no intestino mata em horas sem sinal prévio. Ação imediata: vacinar todas as ovelhas gestantes com vacina polivalente clostridial (4-6 semanas antes do próximo parto). Os cordeiros vivos podem receber soroterapia. Protocolo vacinal anual é obrigatório.',
    },
    7: {
        station: 7, d: 3, species: 'all', isClinicalCase: true,
        q: '🩺 CASO CLÍNICO: Seu Carlos criou 180 bezerros e perdeu 22 nas primeiras 2 semanas. Ele não anota nada, não tem protocolo de colostro e o pasto do parto fica longe. A Taxa de Mortalidade Neonatal (TMN) dele é:',
        context: 'Fazenda do Seu Carlos: 180 bezerros nascidos, 22 mortes nas primeiras 2 semanas. Sem registros, sem protocolo de colostro definido.',
        opts: [
            'TMN = 8,2% — dentro da meta para bovinos',
            'TMN = 12,2% — acima da meta, precisa de mudanças urgentes',
            'TMN = 5,0% — excelente resultado',
            'TMN = 22% — situação catastrófica, fechar a fazenda',
        ],
        correct: 1,
        hint: 'Calcule: 22 mortes ÷ 180 nascidos × 100. A meta para bovinos bem manejados é abaixo de 5%.',
        explain: '✅ CORRETO! TMN = 22/180 × 100 = 12,2%. Para bovinos, a meta é < 5%. Seu Carlos está com o DOBRO do aceitável. As ações prioritárias são: 1) Criar ficha individual de cada cria. 2) Garantir colostro nas primeiras 2h — protocolo escrito. 3) Supervisionar os partos. 4) Aproximar área de parto do galpão. Com essas medidas simples, a TMN pode cair para 3-4%.',
    },
};

/* ── Injetar caso clínico como última questão ── */
(function patchStartQuizWithClinicalCase() {
    const _origStartQuiz = window.startQuiz;
    window.startQuiz = function() {
        _origStartQuiz();
        // Inject clinical case as the last question
        const stationId = STATIONS[G.stationIdx] ? STATIONS[G.stationIdx].id : null;
        const ccQ = stationId ? CC_QUESTIONS[stationId] : null;
        if (ccQ) {
            // Remove any existing clinical case question from this station (avoid duplicates)
            stationQuestions = stationQuestions.filter(q => !q.isClinicalCase);
            // Replace last question with clinical case OR push if < 5
            if (stationQuestions.length >= 5) {
                stationQuestions[stationQuestions.length - 1] = ccQ;
            } else {
                stationQuestions.push(ccQ);
            }
        }
    };
})();

/* ── Renderização especial para questão de caso clínico ── */
(function patchRenderQuestionForClinicalCase() {
    const _origRenderQuestion = window.renderQuestion;
    window.renderQuestion = function() {
        _origRenderQuestion();
        const q = G.currentQ;
        if (!q || !q.isClinicalCase) return;

        // Inject the clinical context box above the question text
        const qText = document.getElementById('quiz-question-text');
        if (!q.context) return;

        // Add context card before the question text
        const existing = document.getElementById('cc-context-card');
        if (existing) existing.remove();

        const card = document.createElement('div');
        card.id = 'cc-context-card';
        card.className = 'cc-context-inline';
        card.innerHTML = `<span class="cc-context-label">🩺 Caso Clínico</span><p>${q.context}</p>`;
        qText.parentNode.insertBefore(card, qText);

        // Override badge to show "Caso Clínico"
        const badge = document.getElementById('quiz-badge');
        if (badge) {
            badge.textContent = '🩺 Caso Clínico';
            badge.className = 'badge badge-hard badge-clinical';
        }
    };

    // Remove context card when navigating away
    const _origNextQuestion = window.nextQuestion;
    window.nextQuestion = function() {
        const existing = document.getElementById('cc-context-card');
        if (existing) existing.remove();
        _origNextQuestion();
    };
})();

console.log('Casos clínicos como questão — carregado ✅');

/* ===== MOBILE HUD HEIGHT FIX =====
   Measures the real HUD height and sets --hud-h CSS variable on :root.
   All screens use padding-top: var(--hud-h) so nothing is ever hidden.
================================================================ */
(function applyHudHeightFix() {
    function measureAndApply() {
        const hud = document.getElementById('hud');
        if (!hud) return;
        const h = hud.getBoundingClientRect().height;
        const offset = h + 6; // 6px breathing room
        document.documentElement.style.setProperty('--hud-h', offset + 'px');

        // Apply directly to every screen element too (belt + suspenders)
        document.querySelectorAll('.screen').forEach(s => {
            s.style.paddingTop = offset + 'px';
        });
    }

    // Run immediately, after fonts load, and on resize
    measureAndApply();
    window.addEventListener('load', measureAndApply);
    window.addEventListener('resize', measureAndApply);

    // Also re-measure when screen changes (in case HUD content shifts layout)
    const _orig = window.switchScreen;
    window.switchScreen = function(id) {
        _orig(id);
        requestAnimationFrame(measureAndApply);
    };
})();
