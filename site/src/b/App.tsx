import { DesignSwitch } from '../components/DesignSwitch'
import { useSmoothScroll } from '../lib/smoothScroll'
import { AndroidB } from './AndroidB'
import { CaretCursor } from './CaretCursor'
import { Rail, TopBar } from './Chrome'
import { FaqB, FooterB, JoinB, Ticker } from './ClosingB'
import { DatasheetB } from './DatasheetB'
import { HeroB } from './HeroB'
import { MemoryB } from './MemoryB'
import { MethodB } from './MethodB'

export default function App() {
  useSmoothScroll()
  return (
    <>
      <CaretCursor />
      <TopBar />
      <Rail />
      <main>
        <HeroB />
        <Ticker />
        <MethodB />
        <MemoryB />
        <DatasheetB />
        <AndroidB />
        <FaqB />
        <JoinB />
      </main>
      <FooterB />
      <DesignSwitch current="b" />
    </>
  )
}
