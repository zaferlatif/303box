(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);

  function rebuild303Layout() {
    const workspace = $('.workspace.shell');
    const oldScroll = workspace?.querySelector('.sheet-scroll');
    const sheet = $('#patternSheet');
    const toolbar = $('.sheet-toolbar') || $('.workspace-toolbar');
    const io = $('.sheet-io');
    if (!workspace || !oldScroll || !sheet || !toolbar) return false;

    // The outer 303 card must be responsive. Only the 16-step table is allowed to overflow.
    oldScroll.classList.add('pattern-card-wrap');
    oldScroll.classList.remove('pattern-sheet-panel');

    // Remove wrappers left by previous layout experiments without touching the actual sheet.
    const oldWorkbench = workspace.querySelector('.pattern-workbench');
    if (oldWorkbench && oldWorkbench !== oldScroll && oldWorkbench.contains(oldScroll)) {
      oldWorkbench.parentNode.insertBefore(oldScroll, oldWorkbench);
      oldWorkbench.remove();
    }
    const oldSheetPanel = workspace.querySelector('.pattern-sheet-panel');
    if (oldSheetPanel && oldSheetPanel !== oldScroll && oldSheetPanel.contains(oldScroll)) {
      oldSheetPanel.parentNode.insertBefore(oldScroll, oldSheetPanel);
      oldSheetPanel.remove();
    }

    // Controls are a separate fixed-width-responsive card, never part of the horizontal scroller.
    let controls = workspace.querySelector('.pattern-control-panel');
    if (!controls) {
      controls = document.createElement('section');
      controls.className = 'pattern-control-panel';
      controls.setAttribute('data-html2canvas-ignore', 'true');
      oldScroll.insertAdjacentElement('afterend', controls);
    }

    toolbar.classList.add('pattern-actions');
    controls.appendChild(toolbar);
    if (io) controls.appendChild(io);

    // studio.js initially inserts scope/MIDI inside the sheet. Move it out if it is recreated later.
    const ioInsideSheet = sheet.querySelector('.sheet-io');
    if (ioInsideSheet) controls.appendChild(ioInsideSheet);

    return true;
  }

  function settle() {
    [0, 40, 120, 260, 600, 1200].forEach(ms => setTimeout(rebuild303Layout, ms));
  }

  window.addEventListener('DOMContentLoaded', settle);
  window.addEventListener('load', settle);
})();
