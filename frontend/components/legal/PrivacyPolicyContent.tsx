'use client'

import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import LegalDocument from '@/components/legal/LegalDocument'
import { useLanguage } from '@/app/lib/i18n/context'
import { getPrivacyContent } from '@/app/lib/legal/content'
import { apiClient } from '@/lib/api'

type DeleteCopy = {
  title: string
  description: string
  confirm: string
  success: string
  error: string
  deleting: string
  deleteButton: string
  signedOut: string
}

const deleteCopy: Record<string, DeleteCopy> = {
  ko: {
    title: '계정 및 리포트 삭제',
    description: '로그인한 사용자는 이 페이지에서 계정과 연결된 리포트를 삭제할 수 있습니다. 결제/거래 기록은 법령상 필요한 범위에서 최소한으로 보관될 수 있습니다.',
    confirm: '정말로 계정을 삭제하시겠습니까? 분석 리포트와 계정 정보가 삭제되며, 법령상 필요한 결제 기록은 최소한으로 보관될 수 있습니다.',
    success: '계정 삭제 요청이 처리되었습니다.',
    error: '삭제에 실패했습니다. support@somyung.cc로 문의해주세요.',
    deleting: '삭제 중...',
    deleteButton: '계정 삭제하기',
    signedOut: '로그인 후 이 페이지에서 계정을 삭제할 수 있습니다. 비회원 리포트 삭제는 support@somyung.cc로 요청해주세요.',
  },
  en: {
    title: 'Delete Account and Reports',
    description: 'Signed-in users can delete their account and linked reports here. Payment and transaction records may be retained in minimized form where legally required.',
    confirm: 'Are you sure you want to delete your account? Reports and account data will be deleted, while legally required payment records may be retained in minimized form.',
    success: 'Your account deletion request has been processed.',
    error: 'Deletion failed. Please contact support@somyung.cc.',
    deleting: 'Deleting...',
    deleteButton: 'Delete My Account',
    signedOut: 'Sign in to delete your account here. For guest report deletion, email support@somyung.cc.',
  },
  ja: {
    title: 'アカウントとレポートの削除',
    description: 'ログイン済みのユーザーは、このページでアカウントと関連レポートを削除できます。決済・取引記録は法令上必要な範囲で最小限保持される場合があります。',
    confirm: 'アカウントを削除しますか？レポートとアカウント情報は削除され、法令上必要な決済記録は最小限保持される場合があります。',
    success: 'アカウント削除リクエストが処理されました。',
    error: '削除に失敗しました。support@somyung.cc までお問い合わせください。',
    deleting: '削除中...',
    deleteButton: 'アカウントを削除',
    signedOut: 'ログイン後、このページでアカウントを削除できます。ゲストのレポート削除は support@somyung.cc までご連絡ください。',
  },
  zh: {
    title: '删除账户和报告',
    description: '已登录用户可在此页面删除账户及关联报告。法律要求保留的付款和交易记录可能会以最小化形式保存。',
    confirm: '确定要删除账户吗？报告和账户信息将被删除，法律要求的付款记录可能会以最小化形式保留。',
    success: '账户删除请求已处理。',
    error: '删除失败。请联系 support@somyung.cc。',
    deleting: '正在删除...',
    deleteButton: '删除我的账户',
    signedOut: '登录后可在此页面删除账户。访客报告删除请发送邮件至 support@somyung.cc。',
  },
  vi: {
    title: 'Xóa tài khoản và báo cáo',
    description: 'Người dùng đã đăng nhập có thể xóa tài khoản và các báo cáo liên quan tại đây. Hồ sơ thanh toán/giao dịch có thể được giữ ở mức tối thiểu khi pháp luật yêu cầu.',
    confirm: 'Bạn có chắc muốn xóa tài khoản? Báo cáo và dữ liệu tài khoản sẽ bị xóa, còn hồ sơ thanh toán bắt buộc theo luật có thể được giữ tối thiểu.',
    success: 'Yêu cầu xóa tài khoản đã được xử lý.',
    error: 'Xóa không thành công. Vui lòng liên hệ support@somyung.cc.',
    deleting: 'Đang xóa...',
    deleteButton: 'Xóa tài khoản',
    signedOut: 'Đăng nhập để xóa tài khoản tại đây. Đối với báo cáo khách, vui lòng email support@somyung.cc.',
  },
  id: {
    title: 'Hapus Akun dan Laporan',
    description: 'Pengguna yang masuk dapat menghapus akun dan laporan terkait di halaman ini. Catatan pembayaran/transaksi dapat disimpan secara minimal jika diwajibkan hukum.',
    confirm: 'Yakin ingin menghapus akun? Laporan dan data akun akan dihapus, sementara catatan pembayaran yang diwajibkan hukum dapat disimpan secara minimal.',
    success: 'Permintaan penghapusan akun telah diproses.',
    error: 'Penghapusan gagal. Silakan hubungi support@somyung.cc.',
    deleting: 'Menghapus...',
    deleteButton: 'Hapus Akun Saya',
    signedOut: 'Masuk untuk menghapus akun di halaman ini. Untuk penghapusan laporan tamu, kirim email ke support@somyung.cc.',
  },
  es: {
    title: 'Eliminar cuenta e informes',
    description: 'Los usuarios con sesión iniciada pueden eliminar su cuenta y los informes vinculados aquí. Los registros de pago/transacción pueden conservarse de forma mínima cuando la ley lo exija.',
    confirm: '¿Seguro que quieres eliminar tu cuenta? Se eliminarán los informes y datos de cuenta, mientras que los registros de pago legalmente requeridos pueden conservarse de forma mínima.',
    success: 'Tu solicitud de eliminación de cuenta ha sido procesada.',
    error: 'No se pudo eliminar. Contacta con support@somyung.cc.',
    deleting: 'Eliminando...',
    deleteButton: 'Eliminar mi cuenta',
    signedOut: 'Inicia sesión para eliminar tu cuenta aquí. Para eliminar informes de invitado, escribe a support@somyung.cc.',
  },
  pt: {
    title: 'Excluir conta e relatórios',
    description: 'Usuários conectados podem excluir a conta e os relatórios vinculados aqui. Registros de pagamento/transação podem ser mantidos de forma mínima quando exigido por lei.',
    confirm: 'Tem certeza de que deseja excluir sua conta? Relatórios e dados da conta serão excluídos, enquanto registros de pagamento exigidos por lei podem ser mantidos de forma mínima.',
    success: 'Sua solicitação de exclusão de conta foi processada.',
    error: 'Falha ao excluir. Entre em contato com support@somyung.cc.',
    deleting: 'Excluindo...',
    deleteButton: 'Excluir minha conta',
    signedOut: 'Entre para excluir sua conta aqui. Para excluir relatórios de convidado, envie email para support@somyung.cc.',
  },
  fr: {
    title: 'Supprimer le compte et les rapports',
    description: 'Les utilisateurs connectés peuvent supprimer leur compte et les rapports liés ici. Les enregistrements de paiement/transaction peuvent être conservés sous forme minimisée lorsque la loi l’exige.',
    confirm: 'Voulez-vous vraiment supprimer votre compte ? Les rapports et données de compte seront supprimés, tandis que les enregistrements de paiement légalement requis peuvent être conservés sous forme minimisée.',
    success: 'Votre demande de suppression de compte a été traitée.',
    error: 'La suppression a échoué. Contactez support@somyung.cc.',
    deleting: 'Suppression...',
    deleteButton: 'Supprimer mon compte',
    signedOut: 'Connectez-vous pour supprimer votre compte ici. Pour supprimer un rapport invité, écrivez à support@somyung.cc.',
  },
  th: {
    title: 'ลบบัญชีและรายงาน',
    description: 'ผู้ใช้ที่เข้าสู่ระบบสามารถลบบัญชีและรายงานที่เกี่ยวข้องได้ที่หน้านี้ บันทึกการชำระเงิน/ธุรกรรมอาจถูกเก็บไว้เท่าที่จำเป็นตามกฎหมาย',
    confirm: 'คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี? รายงานและข้อมูลบัญชีจะถูกลบ ส่วนบันทึกการชำระเงินที่กฎหมายกำหนดอาจถูกเก็บไว้เท่าที่จำเป็น',
    success: 'ดำเนินการคำขอลบบัญชีแล้ว',
    error: 'ลบไม่สำเร็จ โปรดติดต่อ support@somyung.cc',
    deleting: 'กำลังลบ...',
    deleteButton: 'ลบบัญชีของฉัน',
    signedOut: 'เข้าสู่ระบบเพื่อลบบัญชีที่หน้านี้ สำหรับการลบรายงานแบบผู้เยี่ยมชม โปรดส่งอีเมลไปที่ support@somyung.cc',
  },
}

export default function PrivacyPolicyContent() {
  const { lang, t } = useLanguage()
  const content = getPrivacyContent(lang)
  const copy = deleteCopy[lang] || deleteCopy.en
  const [deleting, setDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState<'success' | 'error' | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('chatju_token'))
  }, [])

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(copy.confirm)
    if (!confirmed) return

    try {
      setDeleting(true)
      await apiClient.deleteAccount()
      localStorage.removeItem('chatju_token')
      setDeleteResult('success')
    } catch {
      setDeleteResult('error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <LegalDocument content={content} backHome={t.legalNotice.backHome}>
        <div style={{ marginTop: '24px', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#FAFAFA' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2C2420', marginBottom: '12px' }}>
            {copy.title}
          </h2>
          <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6B5E52', lineHeight: 1.7 }}>
            {copy.description}
          </p>

          {deleteResult === 'success' ? (
            <p style={{ color: '#059669', fontWeight: 500 }}>{copy.success}</p>
          ) : deleteResult === 'error' ? (
            <p style={{ color: '#DC2626', fontSize: '14px' }}>{copy.error}</p>
          ) : isLoggedIn ? (
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: '1px solid #DC2626',
                background: 'white',
                color: '#DC2626',
                fontSize: '14px',
                fontWeight: 500,
                cursor: deleting ? 'wait' : 'pointer',
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? copy.deleting : copy.deleteButton}
            </button>
          ) : (
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>{copy.signedOut}</p>
          )}
        </div>
      </LegalDocument>
      <Footer />
    </>
  )
}
