(() => {
  'use strict';

  function arrangePatternShell() {
    const workspace = document.querySelector('.workspace.shell');
    const scroll = workspace?.querySelector('.sheet-scroll');
    const sheet = document.querySelector('#patternSheet');
    const toolbar = document.querySelector('.sheet-toolbar') || document.querySelector('.workspace-toolbar');
    const io = document.querySelector('.sheet-io');
    if (!workspace || !scroll || !sheet || !toolbar) return false;

    let panel = workspace.querySelector('.pattern-workbench');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'pattern-workbench';
      scroll.parentNode.insertBefore(panel, scroll);
      panel.appendChild(scroll);
    }

    toolbar.classList.add('pattern-actions');
    panel.appendChild(toolbar);
    if (io) panel.appendChild(io);

    return true;
  }

  function settle() {
    [40, 160, 420, 900].forEach(ms => setTimeout(arrangePatternShell, ms));
  }

  window.addEventListener('DOMContentLoaded', settle);
  window.addEventListener('load', settle);
})();
