import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { css } from '@emotion/react'
import IconParkOutlineCopy from '~icons/icon-park-outline/copy'
import IconParkOutlineTips from '~icons/icon-park-outline/tips'
import { useMemoizedFn, useRequest } from 'ahooks'
import { FloatInput, FloatInputNumber } from 'ant-float-label'
import {
  Button,
  Checkbox,
  Descriptions,
  Divider,
  Flex,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Popover,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
} from 'antd'
import clsx from 'clsx'
import { clipboard } from 'electron'
import { omit } from 'es-toolkit'
import { size } from 'polished'
import {
  useCallback,
  useId,
  useMemo,
  useState,
  type ChangeEventHandler,
  type CSSProperties,
  type KeyboardEventHandler,
} from 'react'
import { useSnapshot } from 'valtio'
import { colorHighlightValue } from '$ui/common'
import { MarkdownView } from '$ui/modules/markdown'
import { message } from '$ui/store'
import { EUaType, type Subscribe, type SubscribeSpecialType } from '$ui/types'
import { sharedPageCss } from '../_layout/_shared'
import { defaultNodefreeSubscribe, nodefreeGetUrls, type NodefreeData } from './special/nodefree'
import { actions, getConvertedUrl, state, SubConverterServiceUrls } from './store'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'

const S = {
  modal: css`
    .label {
      width: 68px;
      text-align: right;
      padding-right: 6px;
    }
    .input-row {
      margin-bottom: 10px;
    }

    .ant-modal-title {
      font-size: 30px;
    }
  `,

  modalTitle: css`
    font-size: 24px;
  `,

  settingGroups: css`
    display: flex;
    flex-direction: column;
    gap: 20px;
  `,

  settingGroup: css`
    /* margin-top: 25px; */
  `,

  settingGroupTitle: css`
    margin-bottom: 5px;
    font-size: 17px;
  `,
}

export default function LibrarySubscribe() {
  const { list } = useSnapshot(state)

  const [modalState, setModalState] = useState<ModalState>(() => ({ ...defaultModalState }))

  const handleAdd = useCallback(() => {
    setModalState({ ...defaultModalState, visible: true, id: modalSeq++, mode: 'add' })
  }, [setModalState])

  const handleEdit = useCallback(
    (item: Subscribe, index: number) => {
      setModalState({
        visible: true,
        id: modalSeq++,
        mode: 'edit',
        item,
        index,
      })
    },
    [setModalState],
  )

  const shouldShowNodefreeAddBtn = !list.find((item) => item.specialType === 'nodefree')

  const handleAddNodefree = useMemoizedFn(() => {
    if (!shouldShowNodefreeAddBtn) {
      throw new Error('unexpected case')
    }
    setModalState({
      ...defaultModalState,
      visible: true,
      id: modalSeq++,
      mode: 'add',
      item: { ...defaultNodefreeSubscribe },
    })
  })

  const contextIds = useMemo(() => list.map((item) => item.id), [list])
  const onDragEnd = useMemoizedFn((e: DragEndEvent) => {
    const { over, active } = e
    // validate
    if (!over?.id || !active.id || over.id === active.id) return
    // change
    const oldIndex = contextIds.indexOf(active.id.toString())
    const newIndex = contextIds.indexOf(over.id.toString())
    state.list = arrayMove(state.list.slice(), oldIndex, newIndex)
  })

  return (
    <div css={sharedPageCss.page}>
      <div
        css={css`
          margin-inline: 10px;
          height: 100%;
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
        `}
      >
        <ModalAddOrEdit
          key={`ModalAddOrEdit-${modalState.id}`} // re-create: by increase id; when item change;
          visible={modalState.visible}
          modalState={modalState}
          onClose={() =>
            setModalState((cur) => {
              // reset everything except id
              return { ...defaultModalState, id: cur.id }
            })
          }
        />

        <DndContext modifiers={[restrictToFirstScrollableAncestor, restrictToVerticalAxis]} onDragEnd={onDragEnd}>
          <SortableContext items={contextIds} strategy={verticalListSortingStrategy}>
            <List
              css={css`
                height: 100%;
                display: flex;
                flex-direction: column;

                .ant-list-header + div {
                  flex: 1;
                  overflow-y: overlay;
                  margin-right: 5px;
                  padding-right: 5px;
                }

                .ant-descriptions-item-label,
                .ant-descriptions-item-content {
                  padding: 8px 16px !important;
                }

                .ant-list-items {
                  padding-bottom: 40px;
                }
              `}
              size='small'
              header={
                <div className='header' style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ fontSize: '2em' }}>订阅管理</div>
                  <span>
                    {shouldShowNodefreeAddBtn && (
                      <Button type='primary' onClick={handleAddNodefree} style={{ marginRight: 5 }}>
                        + nodefree
                      </Button>
                    )}
                    <Button type='primary' onClick={handleAdd}>
                      +
                    </Button>
                  </span>
                </div>
              }
              bordered
              dataSource={list}
              renderItem={(item: Subscribe, index) => (
                <SubscribeItem key={item.id} item={item} index={index} onEdit={() => handleEdit(item, index)} />
              )}
            />
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}

function SubscribeItem({
  item,
  index,
  onEdit,
}: {
  item: Subscribe
  index: number
  onEdit?: (item: Subscribe, index: number) => void
}) {
  const { status, detail } = useSnapshot(state)

  const { url, name, excludeKeywords, special, specialType, specialData, remark } = item
  let { urlVisible } = item
  if (typeof urlVisible !== 'boolean') urlVisible = true

  const {
    //
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    active,
    isDragging,
    isSorting,
  } = useSortable({ id: item.id })

  const dragStyle: CSSProperties = {
    transform: CSS.Transform.toString(
      transform
        ? {
            ...transform,
            scaleX: 1,
            scaleY: 1,
          }
        : transform,
    ),
    transition,
  }

  const dragActiveStyle: CSSProperties | undefined = isDragging ? { backgroundColor: '#eea' } : undefined

  // 手动点: 强制更新; 其他场景: 不强制更新
  const {
    loading: updateLoading,
    runAsync: handleUpdate,
    error: updateError,
  } = useRequest(() => actions.update({ idOrUrl: item.url, forceUpdate: true }), { manual: true })

  const disableEnterAsClick: KeyboardEventHandler = useCallback((e) => {
    // disable enter
    if (e.which === 13) {
      e.preventDefault()
    }
  }, [])

  let urlHided = ''
  if (url) {
    let u: URL | undefined
    try {
      u = new URL(url)
    } catch {
      console.error('invalid url:', url)
    }
    if (u) {
      u.searchParams.forEach((val, key) => {
        const keep = (n: number) => val.slice(0, n) + '*'.repeat(val.slice(n, -n).length) + val.slice(-n)

        // keep 1/3 visible
        const n = Math.floor(val.length / 3 / 2)
        const valHided = keep(n)
        u.searchParams.set(key, valHided)
      })
      urlHided = u.toString()
    }
  }

  const servers = detail[url]

  return (
    <List.Item
      ref={setNodeRef}
      style={{ ...dragStyle, ...dragActiveStyle }}
      css={css`
        .ant-list .ant-list-item& {
          display: flex;
          border-bottom: none;
          padding: 0;
          margin: var(--ant-list-item-padding-sm);
          margin-block: 20px;

          .ant-descriptions-view {
            border-width: 2px;
            position: relative;
          }
          &:hover {
            .ant-descriptions-view {
              border-color: ${colorHighlightValue};
            }
          }
        }
      `}
    >
      <Descriptions
        bordered
        column={1}
        size='middle'
        style={{ width: '100%' }}
        styles={{ label: { width: '120px', textAlign: 'center' } }}
      >
        <Descriptions.Item label='名称'>
          <div
            css={css`
              display: flex;
              align-items: center;
            `}
          >
            {name}
            {remark && (
              <Tooltip
                // open
                styles={{ root: { maxWidth: '50vw' } }}
                title={
                  <MarkdownView
                    css={css`
                      line-height: 1.4;
                      white-space: pre-line;
                      word-wrap: break-word;

                      p {
                        margin-bottom: 5px;
                      }
                      p:last-child {
                        margin-bottom: 0;
                      }
                    `}
                  >
                    {remark}
                  </MarkdownView>
                }
              >
                <IconParkOutlineTips
                  {...size(16)}
                  css={css`
                    margin-left: 5px;
                    cursor: pointer;
                  `}
                />
              </Tooltip>
            )}
          </div>
          {status[url] ? status[url] : null}

          <span
            css={css`
              position: absolute;
              color: #fff;
              background-color: ${colorHighlightValue};
              left: 5px;
              top: 5px;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              line-height: 20px;
              text-align: center;
            `}
          >
            {index + 1}
          </span>
        </Descriptions.Item>

        {!!excludeKeywords?.length && (
          <Descriptions.Item label='排除关键词'>
            {excludeKeywords.map((s) => (
              <Tag key={s} color='warning'>
                {s}
              </Tag>
            ))}
          </Descriptions.Item>
        )}

        {!specialType && (
          <Descriptions.Item label='链接'>
            <Space
              css={css`
                display: flex;
                .ant-space-item {
                  line-height: 0;
                }
              `}
            >
              <Tooltip title='复制链接' arrow={false}>
                <IconParkOutlineCopy
                  {...size(20)}
                  css={css`
                    cursor: pointer;
                  `}
                  onClick={() => {
                    clipboard.writeText(url)
                    message.success('url 已复制')
                  }}
                />
              </Tooltip>

              <Tooltip title='「显示/隐藏」完整URL' arrow={false} align={{ offset: [0, -10] }}>
                <span
                  css={css`
                    cursor: pointer;
                    svg {
                      width: 20px;
                      height: 20px;
                    }
                  `}
                  onClick={() => {
                    actions.toggleUrlVisible(index)
                  }}
                >
                  {urlVisible ? <IconAntDesignEyeFilled /> : <IconAntDesignEyeInvisibleFilled />}
                </span>
              </Tooltip>
            </Space>

            <Divider
              css={css`
                margin-block: 5px;
              `}
            />

            <div
              css={[
                css`
                  word-break: break-all;
                `,
                !urlVisible &&
                  css`
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  `,
              ]}
            >
              {urlVisible ? url : urlHided}
            </div>
          </Descriptions.Item>
        )}

        {specialType === 'nodefree' && (
          <Descriptions.Item label='抓取天数'>{specialData?.recentDays}</Descriptions.Item>
        )}

        <Descriptions.Item label='操作'>
          <Space style={{ alignSelf: 'flex-end' }} wrap>
            <Button type='primary' onClick={() => onEdit?.(item, index)} onKeyDown={disableEnterAsClick}>
              编辑
            </Button>

            {updateError ? (
              <Popover placement='top' title={<>update error: {updateError?.stack || updateError?.message}</>}>
                <Button
                  type='primary'
                  danger
                  onClick={handleUpdate}
                  loading={updateLoading}
                  onKeyDown={disableEnterAsClick}
                >
                  更新
                </Button>
              </Popover>
            ) : (
              <Button type='primary' onClick={handleUpdate} loading={updateLoading} onKeyDown={disableEnterAsClick}>
                更新
              </Button>
            )}

            <Popconfirm title={'确认删除?'} onConfirm={() => actions.del(index)}>
              <Button danger onKeyDown={disableEnterAsClick}>
                删除
              </Button>
            </Popconfirm>

            <Popover
              placement='top'
              title={`节点列表(${servers?.length})`}
              content={
                <div style={{ maxHeight: '50vh', overflowY: 'scroll' }}>
                  <ul>{servers?.map((s) => <li key={s.name}>{s.name}</li>)}</ul>
                </div>
              }
              trigger='click'
            >
              <Button icon={<IconAntDesignUnorderedListOutlined />}>查看节点</Button>
            </Popover>

            {specialType === 'nodefree' && (
              <Popover
                placement='top'
                title={`链接列表(${specialData?.recentDays})`}
                content={
                  <div style={{ maxHeight: '200px', overflowY: 'scroll' }}>
                    <ul>{nodefreeGetUrls(item)?.map((url) => <li key={url}>{url}</li>)}</ul>
                  </div>
                }
                trigger='click'
              >
                <Button icon={<IconAntDesignUnorderedListOutlined />}>查看链接列表</Button>
              </Popover>
            )}

            {/* the drag handle */}
            <div
              className='drag-handle'
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              css={css`
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;

                margin-left: 25px;
                margin-right: 15px;
                border-radius: 5px;
                flex-shrink: 0;

                cursor: grab;
                &:hover {
                  background-color: #eee;
                }
              `}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='32'
                height='32'
                viewBox='0 0 15 15'
                css={css`
                  width: 20px;
                  height: 20px;
                `}
              >
                <path
                  fill='#888888'
                  fillRule='evenodd'
                  d='M2.5 4.1a.4.4 0 1 0 0 .8h10a.4.4 0 0 0 0-.8h-10Zm0 2a.4.4 0 1 0 0 .8h10a.4.4 0 0 0 0-.8h-10Zm-.4 2.4c0-.22.18-.4.4-.4h10a.4.4 0 0 1 0 .8h-10a.4.4 0 0 1-.4-.4Zm.4 1.6a.4.4 0 0 0 0 .8h10a.4.4 0 0 0 0-.8h-10Z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
          </Space>
        </Descriptions.Item>
      </Descriptions>
    </List.Item>
  )
}

type ModalState = {
  id: number
  visible: boolean
  mode: 'add' | 'edit'
  item: Subscribe | null
  index: number | null
}

let modalSeq = 0
const defaultModalState: ModalState = {
  id: modalSeq++,
  visible: false,
  mode: 'add',
  item: null,
  index: null,
}

function ModalAddOrEdit({
  visible,
  onClose,
  modalState,
}: {
  visible: boolean
  onClose: () => void
  modalState: ModalState
}) {
  const editItem = modalState.item
  const editItemIndex = modalState.index
  const mode = modalState.mode

  const [name, setName] = useState(editItem?.name || '')

  const [url, setUrl] = useState(editItem?.url || '')
  const [useSubConverter, setUseSubConverter] = useState(editItem?.useSubConverter)
  const [proxyUrls, setProxyUrls] = useState(editItem?.proxyUrls)
  const [subConverterUrl, setSubConverterUrl] = useState(editItem?.subConverterUrl)
  const [proxyUrlsFromExternalFile, setProxyUrlsFromExternalFile] = useState(editItem?.proxyUrlsFromExternalFile)
  const convertedUrl = useMemo(() => {
    if (!useSubConverter) return
    if (!proxyUrls) return
    const serviceUrl = subConverterUrl || SubConverterServiceUrls[0]
    return getConvertedUrl(proxyUrls || '', serviceUrl)
  }, [useSubConverter, proxyUrls, subConverterUrl])

  const [addPrefixToProxies, setAddPrefixToProxies] = useState(editItem?.addPrefixToProxies)
  const [autoUpdate, setAutoUpdate] = useState(editItem?.autoUpdate)
  const [ua, setUa] = useState<EUaType | undefined>(editItem?.ua)

  const [excludeKeywords, setExcludeKeywords] = useState(editItem?.excludeKeywords || [])
  const [remark, setRemark] = useState(editItem?.remark)

  const [special, setSpecial] = useState<boolean | undefined>(undefined)
  const [specialType, setSpecialType] = useState<SubscribeSpecialType | undefined>(undefined)
  const [specialData, setSpecialData] = useState<any | undefined>(undefined)

  // min={1} // 1h
  // max={240} // 240h = 10d
  const [autoUpdateIntervalMin, autoUpdateIntervalMax] = [1, 240]
  const autoUpdateIntervalDefault = 12
  const [autoUpdateInterval, setAutoUpdateInterval] = useState(
    () => editItem?.autoUpdateInterval || autoUpdateIntervalDefault,
  ) // 小时

  type OnChange = ChangeEventHandler<HTMLInputElement>
  const onUrlChange: OnChange = useCallback((e) => {
    setUrl(e.target.value)
  }, [])
  const onNameChange: OnChange = useCallback((e) => {
    setName(e.target.value)
  }, [])
  const onRemarkChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback((e) => {
    setRemark(e.target.value)
  }, [])

  const onExcludeKeywordsChange = useCallback((value: string[] = []) => {
    console.log('onExcludeKeywordsChange', value)
    setExcludeKeywords(value)
  }, [])

  const onNodefreeRecentDaysChange = useMemoizedFn((recentDays: number | null) => {
    setSpecialData((val: NodefreeData) => ({ ...val, recentDays }))
  })

  const onAddPrefixToProxiesChange = useMemoizedFn((e: CheckboxChangeEvent) => {
    setAddPrefixToProxies(e.target.checked)
  })

  /* #region submit or cancel */
  const handleCancel = useCallback(() => {
    onClose()
  }, [])

  const handleOk = useMemoizedFn((e) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (!url || !name) {
      return message.warning('url & name 不能为空')
    }

    const err = actions.check({ url, name, editItemIndex })
    if (err) {
      return message.error(err)
    }

    let subscribeItem: Subscribe = {
      id: editItem?.id ?? crypto.randomUUID(),
      name,

      // url
      url: (useSubConverter ? convertedUrl : url) || '',
      useSubConverter,
      subConverterUrl,
      proxyUrls,
      proxyUrlsFromExternalFile,

      excludeKeywords,
      autoUpdate: useSubConverter ? false : autoUpdate,
      autoUpdateInterval,
      addPrefixToProxies,
      remark,
      ua,
    }
    if (special && specialType && specialData) {
      subscribeItem = { ...subscribeItem, special, specialType, specialData }
    }

    if (mode === 'add') {
      actions.add(subscribeItem)
    } else {
      const editPayload = {
        ...omit(editItem!, Object.keys(subscribeItem) as (keyof Subscribe)[]),
        ...subscribeItem,
        editItemIndex: editItemIndex!,
      }
      actions.edit(editPayload)
    }

    onClose()
  })
  /* #endregion */

  const isNodefree = specialType === 'nodefree'

  const useSubConverterSwitchId = useId()
  const useSubConverterSwitch = !isNodefree && (
    <div className='inline-flex items-center ml-7xl'>
      <Switch
        id={useSubConverterSwitchId}
        value={useSubConverter}
        onChange={(value) => {
          setUseSubConverter(value)
          if (value && !subConverterUrl) {
            setSubConverterUrl(SubConverterServiceUrls[0])
          }
        }}
        className='mr-1'
      />
      <label htmlFor={useSubConverterSwitchId} className='cursor-pointer'>
        使用 SubConverter
      </label>
    </div>
  )

  return (
    <Modal
      css={S.modal}
      title={
        <>
          {mode === 'edit' ? '编辑' : '添加'}
          {useSubConverterSwitch}
        </>
      }
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      centered
      width={600}
    >
      <div className='flex flex-col gap-y-15px'>
        <FloatInput size='large' placeholder='名称 * ' value={name} onChange={onNameChange} onPressEnter={handleOk} />
        {isNodefree ? (
          <FloatInputNumber
            // style={{ display: 'flex', width: '100%', marginBottom: 10 }}
            // prefix={<label className='label'>抓取天数:</label>}
            size='large'
            placeholder='抓取天数'
            value={specialData?.recentDays}
            // @ts-ignore
            onChange={onNodefreeRecentDaysChange}
            onPressEnter={handleOk}
            min={1}
            max={10}
          />
        ) : (
          <FloatInput
            // rootClassName='input-row'
            // className='input-row'
            // required
            // prefix={<label className='label'>订阅链接:</label>}
            size='large'
            hidden={isNodefree}
            placeholder='订阅链接 * '
            onPressEnter={handleOk}
            readOnly={useSubConverter}
            disabled={useSubConverter}
            value={useSubConverter ? convertedUrl : url}
            onChange={onUrlChange}
          />
        )}

        {useSubConverter && (
          <div className='flex flex-col gap-y-1'>
            <div className='flex items-center'>
              SubConverter 后端
              <Select
                className='flex-1 ml-2'
                options={SubConverterServiceUrls.map((url) => ({
                  key: url,
                  label: url,
                  value: url,
                }))}
                value={subConverterUrl}
                onChange={setSubConverterUrl}
                allowClear
              />
            </div>
            <div className='flex items-center gap-x-2'>
              <span className='flex-none'>proxyUrls 使用外部文件</span>
              <Switch
                checked={typeof proxyUrlsFromExternalFile === 'string'}
                onChange={(checked) => setProxyUrlsFromExternalFile(checked ? '' : undefined)}
              />
              {typeof proxyUrlsFromExternalFile === 'string' && (
                <Input
                  value={proxyUrlsFromExternalFile}
                  onChange={(e) => setProxyUrlsFromExternalFile(e.target.value)}
                />
              )}
            </div>
            <div>
              proxyUrls:
              <Input.TextArea
                className={clsx(
                  typeof proxyUrlsFromExternalFile === 'string' &&
                    'cursor-alias bg-gray/70 focus:bg-gray/10 hover:bg-gray/10',
                )}
                value={proxyUrls}
                onChange={(e) => setProxyUrls(e.target.value)}
                readOnly={typeof proxyUrlsFromExternalFile === 'string'}
                autoSize={{ minRows: 2, maxRows: 8 }}
                style={{ wordBreak: 'break-all' }}
                placeholder='节点链接, 每行一个, 支持空行, `#` 或者 `;` 开头的注释行'
              />
            </div>
          </div>
        )}

        <Flex vertical gap={5}>
          <Checkbox checked={addPrefixToProxies} onChange={onAddPrefixToProxiesChange}>
            将订阅名添加为节点前缀
          </Checkbox>

          {!useSubConverter && (
            <>
              {/* 自动更新节点 */}
              <Flex align='center' gap={5}>
                <Checkbox
                  id='checkbox-auto-update'
                  disabled={useSubConverter}
                  checked={useSubConverter ? false : autoUpdate}
                  onChange={(e) => setAutoUpdate(e.target.checked)}
                  style={{ marginLeft: 0 }}
                >
                  自动更新节点
                </Checkbox>

                <InputNumber
                  css={css`
                    width: 130px;
                  `}
                  disabled={useSubConverter || !autoUpdate}
                  addonAfter={'小时'}
                  min={autoUpdateIntervalMin}
                  max={autoUpdateIntervalMax}
                  defaultValue={autoUpdateIntervalDefault}
                  value={autoUpdateInterval}
                  onChange={(val) => val && setAutoUpdateInterval(val)}
                />
              </Flex>

              {/* User-Agent */}
              <Flex align='center' gap={15}>
                User-Agent
                <Select<EUaType>
                  css={css`
                    min-width: 120px;
                  `}
                  allowClear
                  placeholder='User-Agent'
                  value={ua}
                  onChange={(val) => setUa(val)}
                  options={Object.values(EUaType).map((v) => {
                    return { label: v, value: v }
                  })}
                />
              </Flex>

              {/* 根据关键词排除服务器 */}
              <div>
                根据关键词排除服务器:
                <Select
                  mode='tags'
                  style={{ width: '100%' }}
                  placeholder='关键词'
                  value={excludeKeywords}
                  onChange={onExcludeKeywordsChange}
                />
              </div>
            </>
          )}
        </Flex>

        <div>
          备注
          <Input.TextArea
            placeholder='备注'
            autoSize={{ minRows: 2, maxRows: 8 }}
            value={remark}
            onChange={onRemarkChange}
            css={css`
              word-break: break-all;
            `}
          />
        </div>
      </div>
    </Modal>
  )
}
