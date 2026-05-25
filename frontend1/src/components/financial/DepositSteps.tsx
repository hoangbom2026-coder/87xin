import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useLanguage } from '../../i18n/LanguageContext'

interface Step {
  id: number
  title: string
}

interface DepositStepsProps {
  currentStep: number
  className?: string
}

export const DepositSteps: React.FC<DepositStepsProps> = ({ currentStep, className }) => {
  const { t } = useLanguage()
  
  const steps: Step[] = [
    { id: 1, title: t('deposit.step1', 'Chọn phương thức') },
    { id: 2, title: t('deposit.step2', 'Nhập số tiền') },
    { id: 3, title: t('deposit.step3', 'Thanh toán') },
  ]

  return (
    <div className={cn('flex items-center justify-between w-full max-w-2xl mx-auto mb-10', className)}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id
        const isActive = currentStep === step.id
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300',
                  isCompleted ? 'bg-emerald-500 text-white' : 
                  isActive ? 'bg-primary text-black shadow-glow-primary scale-110' : 
                  'bg-fin-surface border border-white/10 text-text-gray'
                )}
              >
                {isCompleted ? <Check size={18} /> : step.id}
              </div>
              <span 
                className={cn(
                  'text-[10px] uppercase tracking-widest font-black transition-colors duration-300',
                  isActive ? 'text-primary' : isCompleted ? 'text-emerald-500' : 'text-text-gray'
                )}
              >
                {step.title}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-fin-surface mx-4 -mt-6 relative overflow-hidden">
                <div 
                  className={cn(
                    'absolute inset-0 bg-gradient-to-r from-primary to-primary transition-all duration-500 ease-out',
                    isCompleted ? 'translate-x-0' : '-translate-x-full'
                  )} 
                />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
