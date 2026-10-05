(() => {
  'use strict';
  // Native audio works without JavaScript too. With JS, only one comparison
  // plays at a time; returning to A or B starts that version from the beginning.
  const players = [...document.querySelectorAll('[data-comparison-audio]')];
  for (const player of players) {
    player.addEventListener('play', () => {
      for (const other of players) if (other !== player) {
        other.pause(); other.currentTime = 0;
      }
    });
  }
  window.addEventListener('pagehide', () => players.forEach(p => p.pause()));
})();
