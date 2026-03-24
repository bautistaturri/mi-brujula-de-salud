import Navbar from './Navbar'
import Hero from './Hero'
import SocialProof from './SocialProof'
import ProblemSolution from './ProblemSolution'
import Features from './Features'
import HowItWorks from './HowItWorks'
import Testimonials from './Testimonials'
import Pricing from './Pricing'
import CTAFinal from './CTAFinal'
import Footer from './Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <CTAFinal />
      </main>
      <Footer />
    </div>
  )
}
