import * as React from 'react'
import { Loader } from 'lucide-react'
import { cn } from '../../lib/cn'

interface PlanSectionProps<T> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  loading?: boolean
  loadingText?: React.ReactNode
  plans: T[]
  renderPlan: (plan: T, index: number) => React.ReactNode
  className?: string
  headerClassName?: string
  gridClassName?: string
}

function PlanSection<T>({
  title,
  subtitle,
  loading = false,
  loadingText,
  plans,
  renderPlan,
  className,
  headerClassName,
  gridClassName,
}: PlanSectionProps<T>) {
  return (
    <section className={cn('space-y-8 md:space-y-10', className)}>
      <div className={cn('text-center', headerClassName)}>
        <h2 className="text-white font-black text-xl sm:text-2xl md:text-3xl uppercase italic tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="text-primary font-black text-[10px] uppercase tracking-[0.18em] sm:tracking-[0.24em] md:tracking-[0.3em] mt-2">{subtitle}</p>
        ) : null}
        {loading ? (
          <p className="text-text-muted text-[10px] mt-2 flex items-center justify-center gap-2">
            <Loader className="animate-spin" size={12} /> {loadingText}
          </p>
        ) : null}
      </div>

      <div className={cn('grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6', gridClassName)}>
        {plans.map((plan, idx) => renderPlan(plan, idx))}
      </div>
    </section>
  )
}

export default PlanSection
