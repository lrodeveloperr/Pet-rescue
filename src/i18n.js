// The core loop is textless. Text is only used for failures a symbol cannot explain,
// and for accessible names read by assistive technology.
const STRINGS = {
  en: {
    saveFailed: 'Progress could not be saved. It will be saved again after the next rescue.',
    loadFailed: 'Saved progress could not be loaded. You can still play.',
    noWebgl: 'This game needs WebGL. Try another browser or device.',
    pause: 'Pause', resume: 'Resume', undo: 'Undo', restart: 'Restart', map: 'Levels', next: 'Next rescue',
    musicOn: 'Music on', musicOff: 'Music off', soundOn: 'Sound on', soundOff: 'Sound off', level: 'Level', locked: 'Locked',
    puppy: 'Puppy: push boulders', frog: 'Frog: hop gaps', duck: 'Duck: swim', mole: 'Mole: dig hedges',
  },
  es: {
    saveFailed: 'No se pudo guardar el progreso. Se guardará de nuevo tras el próximo rescate.',
    loadFailed: 'No se pudo cargar el progreso guardado. Puedes seguir jugando.',
    noWebgl: 'Este juego necesita WebGL. Prueba con otro navegador o dispositivo.',
    pause: 'Pausa', resume: 'Continuar', undo: 'Deshacer', restart: 'Reiniciar', map: 'Niveles', next: 'Siguiente rescate',
    musicOn: 'Música activada', musicOff: 'Música desactivada', soundOn: 'Sonido activado', soundOff: 'Sonido desactivado', level: 'Nivel', locked: 'Bloqueado',
    puppy: 'Cachorro: empuja rocas', frog: 'Rana: salta huecos', duck: 'Pato: nada', mole: 'Topo: cava setos',
  },
  pt: {
    saveFailed: 'Não foi possível salvar o progresso. Ele será salvo de novo após o próximo resgate.',
    loadFailed: 'Não foi possível carregar o progresso salvo. Você ainda pode jogar.',
    noWebgl: 'Este jogo precisa de WebGL. Tente outro navegador ou dispositivo.',
    pause: 'Pausar', resume: 'Continuar', undo: 'Desfazer', restart: 'Reiniciar', map: 'Níveis', next: 'Próximo resgate',
    musicOn: 'Música ligada', musicOff: 'Música desligada', soundOn: 'Som ligado', soundOff: 'Som desligado', level: 'Nível', locked: 'Bloqueado',
    puppy: 'Filhote: empurra pedras', frog: 'Sapo: pula buracos', duck: 'Pato: nada', mole: 'Toupeira: cava arbustos',
  },
  fr: {
    saveFailed: "La progression n'a pas pu être enregistrée. Elle le sera après le prochain sauvetage.",
    loadFailed: "La progression enregistrée n'a pas pu être chargée. Vous pouvez quand même jouer.",
    noWebgl: "Ce jeu nécessite WebGL. Essayez un autre navigateur ou appareil.",
    pause: 'Pause', resume: 'Reprendre', undo: 'Annuler', restart: 'Recommencer', map: 'Niveaux', next: 'Sauvetage suivant',
    musicOn: 'Musique activée', musicOff: 'Musique coupée', soundOn: 'Son activé', soundOff: 'Son coupé', level: 'Niveau', locked: 'Verrouillé',
    puppy: 'Chiot : pousse les rochers', frog: 'Grenouille : saute les trous', duck: 'Canard : nage', mole: 'Taupe : creuse les haies',
  },
  de: {
    saveFailed: 'Der Fortschritt konnte nicht gespeichert werden. Er wird nach der nächsten Rettung erneut gespeichert.',
    loadFailed: 'Der gespeicherte Fortschritt konnte nicht geladen werden. Du kannst trotzdem spielen.',
    noWebgl: 'Dieses Spiel benötigt WebGL. Versuche einen anderen Browser oder ein anderes Gerät.',
    pause: 'Pause', resume: 'Weiter', undo: 'Rückgängig', restart: 'Neu starten', map: 'Level', next: 'Nächste Rettung',
    musicOn: 'Musik an', musicOff: 'Musik aus', soundOn: 'Ton an', soundOff: 'Ton aus', level: 'Level', locked: 'Gesperrt',
    puppy: 'Welpe: schiebt Felsen', frog: 'Frosch: springt über Lücken', duck: 'Ente: schwimmt', mole: 'Maulwurf: gräbt durch Hecken',
  },
};

let current = STRINGS.en;

export function setLanguage(tag) {
  const base = String(tag || 'en').toLowerCase().split(/[-_]/)[0];
  current = STRINGS[base] ?? STRINGS.en;
}

export function t(key) {
  return current[key] ?? STRINGS.en[key] ?? key;
}
