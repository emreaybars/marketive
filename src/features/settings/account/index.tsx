import { ContentSection } from '../components/content-section'
import { AccountForm } from './account-form'

export function SettingsAccount() {
  return (
    <ContentSection
      title='Hesap'
      desc='Hesap ayarlarınızı güncelleyin. Tercih ettiğiniz dili ve saat dilimini ayarlayın.'
    >
      <AccountForm />
    </ContentSection>
  )
}
