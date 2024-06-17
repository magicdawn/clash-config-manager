import { Select } from 'antd'
import { ComponentProps, CSSProperties } from 'react'
import { useSnapshot } from 'valtio'
import { state as preferenceState } from '../../pages/preference/model'
import { builtinThemes, userDefinedThemes } from './monaco/theme'

type TOptions = ComponentProps<typeof Select>['options']

const options: TOptions = [
  ...builtinThemes.map((t) => ({ label: t, value: t })),
  { label: '------------', disabled: true },
  ...userDefinedThemes.map((t) => ({ label: t, value: t })),
]

export function CodeThemeSelect({
  style,
  className,
  disabled = false,
  width = 150,
}: {
  style?: CSSProperties
  className?: string
  disabled?: boolean
  width?: number
}) {
  const theme = useSnapshot(preferenceState).vscodeTheme || 'vs'

  return (
    <Select
      style={{ width, ...style }}
      className={className}
      options={options}
      value={theme}
      disabled={disabled}
      onChange={(val) => {
        preferenceState.vscodeTheme = val
      }}
    />
  )
}
