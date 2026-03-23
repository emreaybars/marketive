'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'

import { cn } from '@/lib/utils'

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
} & {
  theme?: 'light' | 'dark'
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
  }
>(({ config, className, children, ...props }, ref) => {
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        className={cn('flex aspect-video justify-center text-xs', className)}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = 'ChartContainer'

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    active?: boolean
    payload?: any[]
    label?: any
    indicator?: 'line' | 'dot' | 'dashed'
    nameKey?: string
    labelKey?: string
    labelFormatter?: (value: any) => string
  }
>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      label,
      labelFormatter,
      nameKey,
      labelKey = 'label',
      ...props
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (!payload?.length) {
        return null
      }

      const [item] = payload
      const key = labelKey in item ? labelKey : 'value'
      const value =
        label ?? (typeof item[key] === 'string' ? item[key] : labelFormatter?.(item[key]))

      return <div className="font-medium">{value}</div>
    }, [label, labelFormatter, labelKey, payload])

    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-xs shadow-xl',
          className
        )}
        {...props}
      >
        {tooltipLabel}
        <div className="grid gap-1.5">
          {payload.map((item: any) => {
            const key = `${nameKey || item.name || item.dataKey || 'value'}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = itemConfig?.color ?? item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  'flex w-[5.5rem] flex-wrap items-center gap-1.5 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                  indicator === 'dot' && '[&>svg]:data-[state=active]:border-r-2'
                )}
              >
                {itemConfig?.icon ? (
                  <itemConfig.icon />
                ) : (
                  <div
                    className={cn('shrink-0 rounded-[2px]', {
                      'h-2.5 w-2.5': indicator === 'dot',
                      'w-1': indicator === 'line',
                      'w-0 border-[1.5px] border-dashed': indicator === 'dashed',
                    })}
                    style={
                      {
                        '--color-border': indicatorColor,
                        backgroundColor: indicator === 'dot' ? indicatorColor : undefined,
                      } as React.CSSProperties
                    }
                  />
                )}
                <div className="flex flex-1 justify-between gap-1.5 leading-none">
                  <div className="text-muted-foreground">
                    {itemConfig?.label || item.name}
                  </div>
                  {item.value && (
                    <div className="font-mono font-medium tabular-nums text-foreground">
                      {item.value.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = 'ChartTooltipContent'

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    payload?: any[]
    verticalAlign?: 'top' | 'bottom'
    hideIcon?: boolean
    nameKey?: string
  }
>(({ className, hideIcon = false, payload, nameKey, verticalAlign = 'bottom' }, ref) => {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className
      )}
    >
      {payload.map((item: any) => {
        const key = nameKey || item.dataKey || 'value'
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        return (
          <div
            key={item.value}
            className={cn(
              'flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground'
            )}
          >
            {itemConfig?.icon ? (
              <itemConfig.icon />
            ) : (
              !hideIcon && (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )
            )}
            {itemConfig?.label}
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = 'ChartLegendContent'

// Helper to extract the config for a specific key from the payload
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: any,
  key: string
): ChartConfig[string] | null {
  if (typeof payload !== 'object' || payload === null) {
    return null
  }

  const payloadPayload =
    'payload' in payload && typeof payload.payload === 'object' && payload.payload !== null
      ? payload.payload
      : null

  const configLabelKey = key in config && `${key}Label` in config[key] ? `${key}Label` : key

  return (
    configLabelKey in config
      ? config[configLabelKey]
      : payloadPayload && configLabelKey in payloadPayload
        ? payloadPayload[configLabelKey]
        : config[key]
  )
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
