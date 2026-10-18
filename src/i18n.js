// The core loop is textless. Text is only used for failures a symbol cannot explain,
// and for accessible names read by assistive technology.
const STRINGS = {
  en: {
    saveFailed: 'Progress could not be saved. It will be saved again after the next rescue.',
    loadFailed: 'Saved progress could not be loaded. You can still play.',
    noWebgl: 'This game needs WebGL. Try another browser or device.',
    offerSkip: 'Watch a short ad to skip this level? You will still be able to come back and earn its stars later.', offerHat: 'Watch a short ad to unlock a random hat for your rescuer?', offerBonus: 'Watch a short ad to play one bonus daily puzzle today?', watchAd: 'Watch ad', noThanks: 'No thanks', adNoReward: 'The ad did not finish, so no reward was given. You can keep playing.', adLabel: 'Ad', garden: 'Pet garden', album: 'Rescued animals', hats: 'Hats', daily: 'Daily puzzle', back: 'Back', skip: 'Skip level (ad)', mystery: 'Mystery hat (ad)', wait: 'Wait', world: 'World',
    pause: 'Pause', resume: 'Resume', undo: 'Undo', restart: 'Restart', map: 'Levels', next: 'Next rescue',
    musicOn: 'Music on', musicOff: 'Music off', soundOn: 'Sound on', soundOff: 'Sound off', level: 'Level', locked: 'Locked',
    puppy: 'Puppy: push boulders', frog: 'Frog: hop gaps', duck: 'Duck: swim', mole: 'Mole: dig hedges',
  },
  es: {
    saveFailed: 'No se pudo guardar el progreso. Se guardará de nuevo tras el próximo rescate.',
    loadFailed: 'No se pudo cargar el progreso guardado. Puedes seguir jugando.',
    noWebgl: 'Este juego necesita WebGL. Prueba con otro navegador o dispositivo.',
    offerSkip: '¿Ver un anuncio corto para saltar este nivel? Podrás volver más tarde para ganar sus estrellas.', offerHat: '¿Ver un anuncio corto para desbloquear un sombrero al azar para tu rescatador?', offerBonus: '¿Ver un anuncio corto para jugar un rompecabezas diario extra hoy?', watchAd: 'Ver anuncio', noThanks: 'No, gracias', adNoReward: 'El anuncio no terminó, así que no hay recompensa. Puedes seguir jugando.', adLabel: 'Anuncio', garden: 'Jardín de mascotas', album: 'Animales rescatados', hats: 'Sombreros', daily: 'Rompecabezas diario', back: 'Volver', skip: 'Saltar nivel (anuncio)', mystery: 'Sombrero sorpresa (anuncio)', wait: 'Esperar', world: 'Mundo',
    pause: 'Pausa', resume: 'Continuar', undo: 'Deshacer', restart: 'Reiniciar', map: 'Niveles', next: 'Siguiente rescate',
    musicOn: 'Música activada', musicOff: 'Música desactivada', soundOn: 'Sonido activado', soundOff: 'Sonido desactivado', level: 'Nivel', locked: 'Bloqueado',
    puppy: 'Cachorro: empuja rocas', frog: 'Rana: salta huecos', duck: 'Pato: nada', mole: 'Topo: cava setos',
  },
  pt: {
    saveFailed: 'Não foi possível salvar o progresso. Ele será salvo de novo após o próximo resgate.',
    loadFailed: 'Não foi possível carregar o progresso salvo. Você ainda pode jogar.',
    noWebgl: 'Este jogo precisa de WebGL. Tente outro navegador ou dispositivo.',
    offerSkip: 'Assistir a um anúncio curto para pular este nível? Você ainda poderá voltar e ganhar as estrelas depois.', offerHat: 'Assistir a um anúncio curto para desbloquear um chapéu aleatório para o seu resgatador?', offerBonus: 'Assistir a um anúncio curto para jogar um quebra-cabeça diário extra hoje?', watchAd: 'Ver anúncio', noThanks: 'Não, obrigado', adNoReward: 'O anúncio não terminou, então não houve recompensa. Você pode continuar jogando.', adLabel: 'Anúncio', garden: 'Jardim dos pets', album: 'Animais resgatados', hats: 'Chapéus', daily: 'Quebra-cabeça diário', back: 'Voltar', skip: 'Pular nível (anúncio)', mystery: 'Chapéu surpresa (anúncio)', wait: 'Esperar', world: 'Mundo',
    pause: 'Pausar', resume: 'Continuar', undo: 'Desfazer', restart: 'Reiniciar', map: 'Níveis', next: 'Próximo resgate',
    musicOn: 'Música ligada', musicOff: 'Música desligada', soundOn: 'Som ligado', soundOff: 'Som desligado', level: 'Nível', locked: 'Bloqueado',
    puppy: 'Filhote: empurra pedras', frog: 'Sapo: pula buracos', duck: 'Pato: nada', mole: 'Toupeira: cava arbustos',
  },
  fr: {
    saveFailed: "La progression n'a pas pu être enregistrée. Elle le sera après le prochain sauvetage.",
    loadFailed: "La progression enregistrée n'a pas pu être chargée. Vous pouvez quand même jouer.",
    noWebgl: "Ce jeu nécessite WebGL. Essayez un autre navigateur ou appareil.",
    offerSkip: 'Regarder une courte publicité pour passer ce niveau ? Vous pourrez y revenir plus tard pour gagner ses étoiles.', offerHat: 'Regarder une courte publicité pour débloquer un chapeau au hasard pour votre sauveteur ?', offerBonus: "Regarder une courte publicité pour jouer un puzzle du jour bonus aujourd'hui ?", watchAd: 'Regarder la pub', noThanks: 'Non merci', adNoReward: "La publicité ne s'est pas terminée, aucune récompense n'a été donnée. Vous pouvez continuer à jouer.", adLabel: 'Pub', garden: 'Jardin des animaux', album: 'Animaux sauvés', hats: 'Chapeaux', daily: 'Puzzle du jour', back: 'Retour', skip: 'Passer le niveau (pub)', mystery: 'Chapeau mystère (pub)', wait: 'Attendre', world: 'Monde',
    pause: 'Pause', resume: 'Reprendre', undo: 'Annuler', restart: 'Recommencer', map: 'Niveaux', next: 'Sauvetage suivant',
    musicOn: 'Musique activée', musicOff: 'Musique coupée', soundOn: 'Son activé', soundOff: 'Son coupé', level: 'Niveau', locked: 'Verrouillé',
    puppy: 'Chiot : pousse les rochers', frog: 'Grenouille : saute les trous', duck: 'Canard : nage', mole: 'Taupe : creuse les haies',
  },
  de: {
    saveFailed: 'Der Fortschritt konnte nicht gespeichert werden. Er wird nach der nächsten Rettung erneut gespeichert.',
    loadFailed: 'Der gespeicherte Fortschritt konnte nicht geladen werden. Du kannst trotzdem spielen.',
    noWebgl: 'Dieses Spiel benötigt WebGL. Versuche einen anderen Browser oder ein anderes Gerät.',
    offerSkip: 'Kurze Werbung ansehen, um dieses Level zu überspringen? Du kannst später zurückkommen und seine Sterne verdienen.', offerHat: 'Kurze Werbung ansehen, um einen zufälligen Hut für deinen Retter freizuschalten?', offerBonus: 'Kurze Werbung ansehen, um heute ein zusätzliches Tagesrätsel zu spielen?', watchAd: 'Werbung ansehen', noThanks: 'Nein danke', adNoReward: 'Die Werbung wurde nicht beendet, daher gibt es keine Belohnung. Du kannst weiterspielen.', adLabel: 'Werbung', garden: 'Tiergarten', album: 'Gerettete Tiere', hats: 'Hüte', daily: 'Tagesrätsel', back: 'Zurück', skip: 'Level überspringen (Werbung)', mystery: 'Überraschungshut (Werbung)', wait: 'Warten', world: 'Welt',
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
