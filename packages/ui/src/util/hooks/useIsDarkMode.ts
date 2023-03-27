import { state as preferenceState } from '$ui/page/preference/model'
import { useLayoutEffect } from 'react'
import { proxy, useSnapshot } from 'valtio'

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
    if (isDark) {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  }, [isDark])

  return isDark
}
