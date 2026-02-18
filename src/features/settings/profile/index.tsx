import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'

export function SettingsProfile() {
  return (
    <ContentSection
      title='Profil'
      desc='Sitede diğerlerinin sizi nasıl göreceği buradan belirtilir.'
    >
      <ProfileForm />
    </ContentSection>
  )
}
