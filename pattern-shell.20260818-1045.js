(() => {
  'use strict';

  function arrange303() {
    const workspace = document.querySelector('.workspace.shell');
    const shellWrap = workspace?.querySelector('.sheet-scroll');
    const sheet = document.querySelector('#patternSheet');
    const toolbar = document.querySelector('.sheet-toolbar') || document.querySelector('.workspace-toolbar');
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

    // The outer 303 card is responsive. Only the 16-step matrix may scroll horizontally.
    shellWrap.className = 'sheet-scroll pattern-card-wrap';

    // Controls live outside the sheet and remain responsive, like the rhythm controls.
    let controls = workspace.querySelector('.pattern-control-panel');
    if (!controls) {
      controls = document.createElement('section');
      controls.className = 'pattern-control-panel';
      controls.setAttribute('data-html2canvas-ignore', 'true');
      shellWrap.insertAdjacentElement('afterend', controls);
    }

    toolbar.classList.add('pattern-actions');

    // Force all four actions into ONE grid. Older mobile CSS used to make Generate span
    // two columns and Clear could remain outside the group; both states are normalized here.
    let group = toolbar.querySelector('.toolbar-group');
    if (!group) {
      group = document.createElement('div');
      group.className = 'toolbar-group';
      toolbar.appendChild(group);
    }
    group.classList.add('pattern-action-grid');
    ['generateButton', 'playButton', 'downloadButton', 'clearButton'].forEach(id => {
      const button = document.getElementById(id);
      if (button) group.appendChild(button);
    });

    controls.appendChild(toolbar);

    // studio.js creates scope/MIDI inside #patternSheet; move it outside the scrolling matrix.
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
