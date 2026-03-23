import { ContentSection } from '../components/content-section'
import { AppearanceForm } from './appearance-form'

export function SettingsAppearance() {
  return (
    <ContentSection
      title='Görünüm'
      desc='Uygulamanın görünümünü özelleştirin. Gün ve gece temaları arasında otomatik olarak geçiş yapın.'
    >
      <AppearanceForm />
    </ContentSection>
  )
}
