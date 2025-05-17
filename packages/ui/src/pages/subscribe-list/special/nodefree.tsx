import moment from 'moment'
import type { Subscribe } from '$ui/define'

export type NodefreeData = {
  recentDays: number
}

export type NodefreeSubscribe = Subscribe<NodefreeData>

export const defaultNodefreeSubscribe: NodefreeSubscribe = {
  name: 'nodefree',
  id: crypto.randomUUID(),
  url: 'internal://nodefree',
  autoUpdate: true,

  special: true,
  specialType: 'nodefree',
  specialData: {
    recentDays: 3,
  },
}

export function nodefreeGetUrls(subscribe: NodefreeSubscribe): string[] {
  const recentDays = subscribe.specialData?.recentDays

  if (!recentDays) {
    return []
  }

  // https://nodefree.org/dy/2023/01/2023010x.yaml
  const tpl = (m: moment.Moment) =>
    `https://nodefree.org/dy/${m.format('YYYY')}/${m.format('MM')}/${m.format('YYYYMMDD')}.yaml`

  const urls: string[] = []
  for (let i = 0; i < recentDays; i++) {
    // 从前一天开始, 当天的经常 404 报错
    const m = moment().subtract(i, 'days')
    urls.push(tpl(m))
  }

  return urls
}
