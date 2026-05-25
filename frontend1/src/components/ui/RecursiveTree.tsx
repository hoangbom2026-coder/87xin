import * as React from 'react'
import { useState } from 'react'
import { User as UserIcon, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface ITreeNode {
  id: string
  username: string
  parentId: string | null
  role?: string
  level?: number
}

interface RecursiveTreeProps {
  nodes: ITreeNode[]
  parentId: string | null
  currentLevel?: number
}

const RecursiveTree: React.FC<RecursiveTreeProps> = ({ nodes, parentId, currentLevel = 1 }) => {
  const children = nodes.filter((node) => node.parentId === parentId)

  if (children.length === 0) return null

  return (
    <div className={cn('space-y-4', parentId && 'mt-4 ml-0 border-l border-white/10 pl-4 sm:ml-6 sm:pl-6')}>
      {children.map((child) => (
        <TreeNodeItem key={child.id} node={child} nodes={nodes} level={currentLevel} />
      ))}
    </div>
  )
}

const TreeNodeItem: React.FC<{ node: ITreeNode; nodes: ITreeNode[]; level: number }> = ({
  node,
  nodes,
  level,
}) => {
  const [isOpen, setIsOpen] = useState(level < 2)
  const hasChildren = nodes.some((n) => n.parentId === node.id)

  return (
    <div className="group">
      <div
        className={cn(
          'flex items-center gap-4 rounded-[var(--radius-standard)] p-3 transition-colors',
          'hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)]',
          hasChildren && 'cursor-pointer',
        )}
        role={hasChildren ? 'button' : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!hasChildren) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen((o) => !o)
          }
        }}
      >
        <div
          className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-standard)] border border-primary/25 bg-primary/15 text-primary"
          aria-hidden
        >
          <UserIcon size={18} />
          <div className="absolute -right-2 -top-2 rounded border border-white/10 bg-[var(--fin-inset)] px-1.5 py-0.5 text-[8px] font-black uppercase text-text-muted">
            L{level}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{node.username}</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-text-muted">
            {node.role || `Level ${level} Member`}
          </p>
        </div>

        {hasChildren ? (
          <div className="text-text-gray transition-colors group-hover:text-white">
            {isOpen ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
          </div>
        ) : null}
      </div>

      {isOpen ? (
        <div className="animate-in fade-in slide-in-from-left-2 duration-200">
          <RecursiveTree nodes={nodes} parentId={node.id} currentLevel={level + 1} />
        </div>
      ) : null}
    </div>
  )
}

export default RecursiveTree
