import * as React from 'react'
import { cn } from '../../lib/cn'

interface DataTableSectionProps {
  title?: React.ReactNode
  right?: React.ReactNode
  className?: string
  bodyClassName?: string
  tableMinWidthClassName?: string
  children: React.ReactNode
}

const DataTableSection: React.FC<DataTableSectionProps> = ({
  title,
  right,
  className,
  bodyClassName,
  tableMinWidthClassName,
  children,
}) => (
  <section className={cn('fin-panel overflow-hidden', className)}>
    {title || right ? (
      <div className="px-4 sm:px-6 md:px-8 py-4 md:py-5 border-b border-fin-line/55 flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4">
        {title ? (
          <div>{title}</div>
        ) : (
          <div />
        )}
        {right ? <div>{right}</div> : null}
      </div>
    ) : null}
    <div className={cn('overflow-x-auto no-scrollbar', bodyClassName)}>
      <div className={cn(tableMinWidthClassName)}>{children}</div>
    </div>
  </section>
)

export default DataTableSection
