import Navbar         from './Navbar'
import Hero           from './Hero'
import ProblemSolution from './ProblemSolution'
import HowItWorks     from './HowItWorks'
import ParaQuien      from './ParaQuien'
import CTAFinal       from './CTAFinal'
import Footer         from './Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <ParaQuien />
        <CTAFinal />
      </main>
      <Footer />
    </div>
  )
}
