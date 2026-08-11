import { Suspense } from 'react'
import ReportPdfDownload from '@/components/report/ReportPdfDownload'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReportPdfDownload />
    </Suspense>
  )
}
