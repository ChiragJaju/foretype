import { Android } from './components/Android'
import { Apps } from './components/Apps'
import { Cursor } from './components/Cursor'
import { DesignSwitch } from './components/DesignSwitch'
import { Faq } from './components/Faq'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { Nav } from './components/Nav'
import { Numbers } from './components/Numbers'
import { Playground } from './components/Playground'
import { Privacy } from './components/Privacy'
import { Footer, Waitlist } from './components/Waitlist'
import { useSmoothScroll } from './lib/smoothScroll'

export default function App() {
  useSmoothScroll()
  return (
    <>
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Apps />
        <HowItWorks />
        <Playground />
        <Numbers />
        <Privacy />
        <Android />
        <Faq />
        <Waitlist />
      </main>
      <Footer />
      <DesignSwitch current="a" />
    </>
  )
}
