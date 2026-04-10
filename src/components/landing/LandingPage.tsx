import Navbar         from './Navbar'
import Hero           from './Hero'
import HowItWorks     from './HowItWorks'
import ParaQuien      from './ParaQuien'
import Footer         from './Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <ParaQuien />
      </main>
      <Footer />
    </div>
  )
}
