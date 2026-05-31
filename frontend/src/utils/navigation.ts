export function getHashPage(): 'home' | 'edit' | 'ai' | 'import' {
  const hash = window.location.hash
  if (hash === '#/edit') return 'edit'
  if (hash === '#/ai') return 'ai'
  if (hash === '#/import') return 'import'
  return 'home'
}

export function navigateTo(page: 'home' | 'edit' | 'ai' | 'import') {
  const paths: Record<string, string> = {
    home: '#/',
    edit: '#/edit',
    ai: '#/ai',
    import: '#/import',
  }
  window.location.hash = paths[page]
}
