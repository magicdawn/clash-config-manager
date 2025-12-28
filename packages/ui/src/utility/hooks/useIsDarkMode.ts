import { useLayoutEffect } from 'react'
import { proxy, useSnapshot } from 'valtio'
import { state as preferenceState } from '$ui/pages/preference/model'

const darkState = proxy({ value: false })

/**
 * https://stackoverflow.com/questions/56393880/how-do-i-detect-dark-mode-using-javascript
 */
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  darkState.value = true
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  const newColorScheme = event.matches ? 'dark' : 'light'
  darkState.value = !!event.matches
})

export function useSystemDarkMode() {
  return useSnapshot(darkState).value
}

export function useIsDarkMode() {
  const { theme: currentTheme } = useSnapshot(preferenceState)
  const systemIsDark = useSystemDarkMode()
  const isDark = currentTheme === 'dark' || (currentTheme === 'follow-system' && systemIsDark)

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return isDark
}
