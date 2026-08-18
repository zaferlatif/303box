(() => {
  'use strict';

  function arrangePatternShell() {
    const workspace = document.querySelector('.workspace.shell');
    const scroll = workspace?.querySelector('.sheet-scroll');
    const sheet = document.querySelector('#patternSheet');
    const toolbar = document.querySelector('.sheet-toolbar') || document.querySelector('.workspace-toolbar');
    const io = document.querySelector('.sheet-io');
    if (!workspace || !scroll || !sheet || !toolbar) return false;

    let workbench = workspace.querySelector('.pattern-workbench');
    if (!workbench) {
      workbench = document.createElement('div');
      workbench.className = 'pattern-workbench';
      scroll.parentNode.insertBefore(workbench, scroll);
      workbench.appendChild(scroll);
    }

    if (scroll.parentElement !== workbench) workbench.prepend(scroll);
    scroll.classList.add('pattern-sheet-panel');

    let controls = workbench.querySelector('.pattern-control-panel');
    if (!controls) {
      controls = document.createElement('section');
      controls.className = 'pattern-control-panel';
      controls.setAttribute('aria-label', '303 playback, analyzer and MIDI controls');
      workbench.appendChild(controls);
    }

    toolbar.classList.add('pattern-actions');
    controls.appendChild(toolbar);
    if (io) controls.appendChild(io);

    if (controls.firstElementChild !== toolbar) controls.insertBefore(toolbar, controls.firstElementChild);
    if (io && toolbar.nextElementSibling !== io) controls.insertBefore(io, toolbar.nextElementSibling);

    return true;
  }

  function settle() {
    [0, 40, 120, 260, 520, 900, 1500].forEach(ms => setTimeout(arrangePatternShell, ms));
  }

  window.addEventListener('DOMContentLoaded', settle);
  window.addEventListener('load', settle);
})();
