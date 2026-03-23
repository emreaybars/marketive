import { ContentSection } from '../components/content-section'
import { DisplayForm } from './display-form'

export function SettingsDisplay() {
  return (
    <ContentSection
      title='Görüntüleme'
      desc="Uygulamada gösterilen öğeleri kontrol etmek için öğeleri açın veya kapatın."
    >
      <DisplayForm />
    </ContentSection>
  )
}
