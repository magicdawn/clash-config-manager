import fs from 'fs-extra'
import path from 'path'
import { app, Rectangle, screen } from 'electron'
import { throttle } from 'lodash'

function isValidNumber(n?: number): n is number {
  return typeof n === 'number' && !isNaN(n)
}

const getFile = () => {
  return path.join(app.getPath('userData'), 'winstate.json')
}

interface IWinState {
  bounds?: {
    x?: number
    y?: number
    height?: number
    width?: number
  }
}

let isSaving = false
export async function saveWindowState(windowState: IWinState) {
  if (isSaving) return

  isSaving = true
  const file = getFile()
  await fs.outputJson(file, windowState)
  isSaving = false
}

export const saveWindowStateThrottle = throttle(saveWindowState, 1000)

export async function loadWindowState() {
  const file = getFile()

  let windowState: IWinState
  try {
    windowState = await fs.readJson(file)
  } catch (e) {
    windowState = {}
  }

  if (!windowState.bounds) {
    windowState.bounds = {}
  }

  const bounds = windowState.bounds
  const size = screen.getPrimaryDisplay().workAreaSize

  const DEFAULT_WIDTH = 1060
  const DEFAULT_HEIGHT = 760

  if (
    !isValidNumber(bounds.x) ||
    !isValidNumber(bounds.y) ||
    !isValidNumber(bounds.width) ||
    !isValidNumber(bounds.height)
  ) {
    // Bounds not valid, set to default
    bounds.x = Math.round((size.width - DEFAULT_WIDTH) / 2) + 0
    bounds.y = Math.round((size.height - DEFAULT_HEIGHT) / 2) + 0
    bounds.width = DEFAULT_WIDTH
    bounds.height = DEFAULT_HEIGHT
  }

  const currentDisplay = screen.getDisplayMatching(bounds as Rectangle)
  const currentRect = currentDisplay.workArea

  // Check if bounds in screen
  if (bounds.x < currentRect.x || bounds.x > currentRect.x + currentRect.width) {
    bounds.x = currentRect.x
  }
  if (bounds.y < currentRect.y || bounds.y > currentRect.y + currentRect.height) {
    bounds.y = currentRect.y
  }
  if (bounds.width > currentRect.width) {
    bounds.width = currentRect.width
  }
  if (bounds.height > currentRect.height) {
    bounds.height = currentRect.height
  }

  return windowState
}
