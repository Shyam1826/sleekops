import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react'

type Status = 'success' | 'processing' | 'failed' | 'queued' | 'on_time' | 'minor_delay' | 'high_delay'

const config: Record<Status, { label: string; className: string; Icon: React.ElementType }> = {
  success: { label: 'Success', className: 'badge-green', Icon: CheckCircle2 },
  processing: { label: 'Processing', className: 'badge-blue', Icon: Clock },
  failed: { label: 'Failed', className: 'badge-red', Icon: XCircle },
  queued: { label: 'Queued', className: 'badge-slate', Icon: Clock },
  on_time: { label: 'On Time', className: 'badge-green', Icon: CheckCircle2 },
  minor_delay: { label: 'Minor Delay', className: 'badge-yellow', Icon: AlertTriangle },
  high_delay: { label: 'High Delay Risk', className: 'badge-red', Icon: XCircle },
}

export default function StatusBadge({ status }: { status: Status }) {
  const { label, className, Icon } = config[status]
  return (
    <span className={className}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}
