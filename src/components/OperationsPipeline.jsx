import PipelineHorizonExpander from './PipelineHorizonExpander'
import { useInView } from '../hooks/useInView'

export default function OperationsPipeline() {
  const [ref, inView] = useInView()

  return (
    <section ref={ref} className="border-t border-brand-slate/10 bg-brand-pale/10 py-20 sm:py-28">
      <div className="container-content">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">The Setup Process</span>
          <h2 className="mt-4 text-3xl font-bold text-brand-slate sm:text-4xl">
            How we get retired laptops ready for students
          </h2>
          <p className="mt-3 text-base text-muted sm:text-lg">
            Most machines arrive in good physical shape. Getting them ready is setup and configuration: inspection, lightweight software, and hands-on placement.
          </p>
        </div>

        <div
          className={[
            'mt-14 transition-all duration-700 ease-out',
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
          ].join(' ')}
        >
          <PipelineHorizonExpander />
        </div>
      </div>
    </section>
  )
}
