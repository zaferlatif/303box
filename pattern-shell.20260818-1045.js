(() => {
  'use strict';

  function arrange303() {
    const workspace = document.querySelector('.workspace.shell');
    const shellWrap = workspace?.querySelector('.sheet-scroll');
    const sheet = document.querySelector('#patternSheet');
    const toolbar = document.querySelector('.sheet-toolbar') || document.querySelector('.workspace-toolbar');
    const io = document.querySelector('.sheet-io');
    if (!workspace || !shellWrap || !sheet || !toolbar) return false;

    // Undo previous workbench wrappers completely.
    const workbench = workspace.querySelector('.pattern-workbench');
    if (workbench && workbench.contains(shellWrap)) {
      workbench.parentNode.insertBefore(shellWrap, workbench);
      workbench.remove();
    }
    const oldPanel = workspace.querySelector('.pattern-sheet-panel');
    if (oldPanel && oldPanel !== shellWrap && oldPanel.contains(shellWrap)) {
      oldPanel.parentNode.insertBefore(shellWrap, oldPanel);
      oldPanel.remove();
    }

    // The outer sheet wrapper is fixed to viewport width; it must never be a horizontal scroller.
    shellWrap.className = 'sheet-scroll pattern-card-wrap';

    // Controls live outside the sheet and stay fixed, just like the rhythm controls.
    let controls = workspace.querySelector('.pattern-control-panel');
    if (!controls) {
      controls = document.createElement('section');
      controls.className = 'pattern-control-panel';
      controls.setAttribute('data-html2canvas-ignore', 'true');
      shellWrap.insertAdjacentElement('afterend', controls);
    }

    toolbar.classList.add('pattern-actions');
    controls.appendChild(toolbar);

    // studio.js creates scope/MIDI after the hardware strip inside #patternSheet; move it out.
    const liveIo = document.querySelector('.sheet-io');
    if (liveIo) controls.appendChild(liveIo);

    // Keep actions first, scope/MIDI second.
    if (controls.firstElementChild !== toolbar) controls.prepend(toolbar);
    if (liveIo && toolbar.nextElementSibling !== liveIo) toolbar.insertAdjacentElement('afterend', liveIo);

    return true;
  }

  function settle() {
    [0, 30, 90, 180, 360, 700, 1300].forEach(ms => setTimeout(arrange303, ms));
  }

  window.addEventListener('DOMContentLoaded', settle);
  window.addEventListener('load', settle);
})();
