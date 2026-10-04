export function canReadVisibleConversation(node: HTMLElement, visible: boolean, focused: boolean): boolean {
  const rect = node.getBoundingClientRect();
  return visible && focused && node.getClientRects().length > 0 && rect.bottom > 0 && rect.bottom <= window.innerHeight && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth && node.scrollHeight - node.scrollTop - node.clientHeight <= 32;
}
