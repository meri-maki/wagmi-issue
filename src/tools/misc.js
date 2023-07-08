const debounceTimers = {};

export function debounce(name, delay, func) {
  clearTimeout(debounceTimers[name]);
  debounceTimers[name] = setTimeout(func, delay);

  return debounceTimers[name];
}