import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/tickets-dev')({
  component: TicketsDevPage,
})

const TABS = [
  { id: 'week-one', label: 'Week One', src: '/tickets-dev.html' },
  {
    id: 'batch-two',
    label: 'Batch Two',
    src: `/${encodeURIComponent('CodeLingo — Batch Two Build Plan.html')}`,
  },
] as const

type TabId = (typeof TABS)[number]['id']

function TicketsDevPage() {
  const [activeTab, setActiveTab] = useState<TabId>('week-one')

  const activeSrc = TABS.find((tab) => tab.id === activeTab)?.src ?? TABS[0].src

  return (
    <div className="flex h-screen w-full flex-col bg-[#faf8f3]">
      <nav className="flex shrink-0 items-center gap-1 border-b border-[#ded6c4] bg-white px-3 py-2 dark:border-[#33403a] dark:bg-[#17201d]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={tab.id === activeTab}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab.id === activeTab
                ? 'bg-[#2c6b5a] text-white'
                : 'text-[#56635e] hover:bg-[#f4e6cf] dark:text-[#adb8b0] dark:hover:bg-[#1e2925]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <iframe
        key={activeSrc}
        src={activeSrc}
        title={
          activeTab === 'batch-two'
            ? 'CodeLingo Batch Two Build Plan'
            : 'CodeLingo Week 1 Tickets'
        }
        className="h-full w-full flex-1 border-0"
      />
    </div>
  )
}
