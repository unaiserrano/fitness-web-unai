export const THEME_KEY = 'theme';

/** Script en línea: aplica el tema guardado antes del primer pintado. */
export const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem('${THEME_KEY}')||'light';var d=c==='dark'||(c==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;

