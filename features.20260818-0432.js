(() => {
  const script = document.createElement('script');
  script.src = './enhance.20260818-0845.js?v=20260818-0845';
  script.async = false;
  script.onload = () => {
    const patch = document.createElement('script');
    patch.src = './note-top-c.20260818-0845.js?v=20260818-0845';
    patch.async = false;
    document.head.appendChild(patch);
  };
  document.head.appendChild(script);
})();
