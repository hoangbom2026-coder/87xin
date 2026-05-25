import * as React from 'react'
import { useDispatch } from 'react-redux'
import { Lock, Mail, User, Phone, UserPlus } from 'lucide-react'
import { login, register } from '../../services/authService'
import { setUser, setToken } from '../../features/auth/authSlice'
import { useLanguage } from '../../i18n/LanguageContext'
import { toast } from '../../utils/toast'
import { cn } from '../../lib/cn'
import { StableImg } from '../ui/StableImg'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'login' | 'register' | 'forgot'
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode = 'login' }) => {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const [authMode, setAuthMode] = React.useState<'login' | 'register' | 'forgot'>(mode)
  const [loading, setLoading] = React.useState(false)
  const [form, setForm] = React.useState({
    username: '',
    password: '',
    loginId: '',
    phoneNumber: '',
    confirmPassword: '',
    inviteCode: '',
  })

  React.useEffect(() => {
    if (isOpen) setAuthMode(mode)
  }, [mode, isOpen])

  React.useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  React.useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (authMode === 'forgot') {
      if (!form.loginId.trim()) {
        toast.error(t('auth.forgotNeedId', 'Vui lòng nhập tên đăng nhập hoặc số điện thoại.'))
        return
      }
      toast.info(t('auth.forgotSent', 'Chúng tôi đã ghi nhận yêu cầu. Vui lòng kiểm tra tin nhắn / email hoặc liên hệ hỗ trợ.'))
      setAuthMode('login')
      return
    }
    if (authMode === 'register' && form.password !== form.confirmPassword) {
      toast.error(t('auth.passwordMismatch', 'Mật khẩu xác nhận không khớp.'))
      return
    }
    setLoading(true)
    try {
      const res =
        authMode === 'login'
          ? await login(form.loginId, form.password)
          : await register({
              username: form.username,
              password: form.password,
              phoneNumber: form.phoneNumber,
              ...(form.inviteCode.trim() ? { inviteCode: form.inviteCode.trim() } : {}),
            })
      if (res.success && res.data && 'token' in res.data) {
        dispatch(setToken((res.data as { token: string }).token))
        dispatch(setUser((res.data as { user?: unknown }).user || res.data))
        onClose()
        window.location.reload()
      } else {
        toast.error(res.message || t('auth.failed', 'Xác thực thất bại.'))
      }
    } catch {
      toast.error(t('auth.failed', 'Xác thực thất bại.'))
    } finally {
      setLoading(false)
    }
  }

  const renderInput = (
    icon: React.ReactNode,
    input: React.ReactNode,
  ) => (
    <div className="input_inner">
      {icon}
      {input}
    </div>
  )

  return (
    <div
      className="t-modal auth-modal-root share_modal fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 p-3 sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered auth-modal__dialog mx-auto w-full max-w-[700px]"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
          <div className="modal-body">
            <button type="button" className="close" onClick={onClose} aria-label={t('common.close', 'Đóng')}>
              <span aria-hidden="true">&times;</span>
            </button>

            <div className="modal_body_share">
              <div className="modal_body_share_left auth-modal__promo hidden lg:block">
                <StableImg
                  src="/images/pages/login/login_img.png"
                  alt=""
                  width={350}
                  height={400}
                  className="h-auto w-full object-contain"
                  loading="lazy"
                />
              </div>

              <div className="modal_body_right auth-modal__form">
                <h2 id="auth-modal-title" className="sr-only">
                  {authMode === 'forgot'
                    ? t('auth.forgotTitle', 'Quên mật khẩu')
                    : authMode === 'register'
                      ? t('auth.register', 'Đăng ký')
                      : t('auth.login', 'Đăng nhập')}
                </h2>

                {authMode === 'forgot' ? (
                  <div className="modal_head modal_head--forgot">
                    <span className="modal_head__title">{t('auth.forgotTitle', 'Quên mật khẩu')}</span>
                    <button type="button" className="modalhead_btn" onClick={() => setAuthMode('login')}>
                      {t('auth.backToLogin', 'Đăng nhập')}
                    </button>
                  </div>
                ) : (
                  <div className="modal_head" role="tablist" aria-label={t('auth.modeTabs', 'Đăng nhập / Đăng ký')}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authMode === 'login'}
                      className={cn('modalhead_btn', authMode === 'login' && 'active')}
                      onClick={() => setAuthMode('login')}
                    >
                      {t('auth.login', 'Đăng nhập')}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authMode === 'register'}
                      className={cn('modalhead_btn', authMode === 'register' && 'active')}
                      onClick={() => setAuthMode('register')}
                    >
                      {t('auth.signUp', 'Đăng ký')}
                    </button>
                  </div>
                )}

                <form onSubmit={submit} className="input_form_wrap auth-modal-form">
                  {authMode === 'login' ? (
                    <>
                      {renderInput(
                        <Mail size={18} className="auth-modal__field-icon" aria-hidden />,
                        <input
                          type="text"
                          className="input_custom"
                          value={form.loginId}
                          onChange={(e) => setForm((p) => ({ ...p, loginId: e.target.value }))}
                          autoComplete="username"
                          placeholder={t('auth.emailPlaceholder', 'Nhập email hoặc tên đăng nhập')}
                        />,
                      )}
                      {renderInput(
                        <Lock size={18} className="auth-modal__field-icon" aria-hidden />,
                        <input
                          type="password"
                          className="input_custom"
                          value={form.password}
                          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                          autoComplete="current-password"
                          placeholder={t('auth.passwordPlaceholder', 'Nhập mật khẩu')}
                        />,
                      )}
                      <div className="input_inner_forgot">
                        <button type="button" onClick={() => setAuthMode('forgot')}>
                          {t('auth.forgotPassword', 'Quên mật khẩu')}
                        </button>
                      </div>
                    </>
                  ) : null}

                  {authMode === 'forgot' ? (
                    <>
                      <p className="auth-modal__hint">{t('auth.forgotHint', 'Nhập tên đăng nhập hoặc SĐT đã đăng ký.')}</p>
                      {renderInput(
                        <Mail size={18} className="auth-modal__field-icon" aria-hidden />,
                        <input
                          type="text"
                          className="input_custom"
                          value={form.loginId}
                          onChange={(e) => setForm((p) => ({ ...p, loginId: e.target.value }))}
                          autoComplete="username"
                          placeholder={t('auth.emailPlaceholder', 'Nhập email hoặc tên đăng nhập')}
                        />,
                      )}
                    </>
                  ) : null}

                  {authMode === 'register' ? (
                    <>
                      {renderInput(
                        <User size={18} className="auth-modal__field-icon" aria-hidden />,
                        <input
                          type="text"
                          className="input_custom"
                          value={form.username}
                          onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                          autoComplete="username"
                          placeholder={t('auth.usernameHint', 'Nhập tên đăng nhập')}
                        />,
                      )}
                      {renderInput(
                        <Phone size={18} className="auth-modal__field-icon" aria-hidden />,
                        <input
                          type="tel"
                          className="input_custom"
                          value={form.phoneNumber}
                          onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                          autoComplete="tel"
                          placeholder={t('auth.phoneHint', 'Nhập số điện thoại')}
                        />,
                      )}
                      {renderInput(
                        <Lock size={18} className="auth-modal__field-icon" aria-hidden />,
                        <input
                          type="password"
                          className="input_custom"
                          value={form.password}
                          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                          autoComplete="new-password"
                          placeholder={t('auth.passwordPlaceholder', 'Nhập mật khẩu')}
                        />,
                      )}
                      {renderInput(
                        <UserPlus size={18} className="auth-modal__field-icon" aria-hidden />,
                        <input
                          type="password"
                          className="input_custom"
                          value={form.confirmPassword}
                          onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                          autoComplete="new-password"
                          placeholder={t('auth.confirmPassword', 'Xác nhận mật khẩu')}
                        />,
                      )}
                      {renderInput(
                        <UserPlus size={18} className="auth-modal__field-icon auth-modal__field-icon--muted" aria-hidden />,
                        <input
                          type="text"
                          className="input_custom"
                          value={form.inviteCode}
                          onChange={(e) => setForm((p) => ({ ...p, inviteCode: e.target.value }))}
                          placeholder={t('auth.inviteOptional', 'Mã giới thiệu (không bắt buộc)')}
                        />,
                      )}
                    </>
                  ) : null}

                  <button type="submit" className="btn_login_modal" disabled={loading}>
                    {loading
                      ? t('common.loading', 'Đang tải…')
                      : authMode === 'login'
                        ? t('auth.login', 'Đăng nhập')
                        : authMode === 'forgot'
                          ? t('auth.forgotSubmit', 'Gửi yêu cầu')
                          : t('auth.signUp', 'Đăng ký')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
