// Tiny className joiner — filters falsy values. Keeps markup readable
// without pulling in clsx/tailwind-merge as runtime deps.
export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default cn;
