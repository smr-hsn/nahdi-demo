import { AssistantProvider } from './context/AssistantContext'
import { AnnouncementBar } from './components/AnnouncementBar'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Categories } from './components/Categories'
import { AIAdvisor } from './components/AIAdvisor'
import { Concerns } from './components/Concerns'
import { FAQ } from './components/FAQ'
import { Footer } from './components/Footer'
import { AIChatWidget } from './components/assistant'

export default function App() {
  return (
    <AssistantProvider>
      <div className="min-h-screen bg-cream">
        <AnnouncementBar />
        <Header />
        <main>
          <Hero />
          <Categories />
          <AIAdvisor />
          <Concerns />
          <FAQ />
        </main>
        <Footer />
        <AIChatWidget />
      </div>
    </AssistantProvider>
  )
}
