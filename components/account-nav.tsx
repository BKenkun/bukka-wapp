"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function AccountNav() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href

  const getIconColor = (href: string) => (isActive(href) ? "#FFFFFF" : "var(--text-primary)")

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-[10px]">
      {/* Suscripción */}
      <Link href="/my-account/subscription">
        <div
          style={{ backgroundColor: isActive("/my-account/subscription") ? "var(--brand-color)" : "var(--surface-bg)", border: isActive("/my-account/subscription") ? "none" : "1px solid var(--border-color)" }}
          className="p-6 flex items-center justify-center gap-4 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 18 16" fill="none">
            <path
              d="M9.65625 3.3125C10.0125 3.09375 10.25 2.69687 10.25 2.25C10.25 1.55937 9.69063 1 9 1C8.30937 1 7.75 1.55937 7.75 2.25C7.75 2.7 7.9875 3.09375 8.34375 3.3125L6.55312 6.89375C6.26875 7.4625 5.53125 7.625 5.03438 7.22813L2.25 5C2.40625 4.79063 2.5 4.53125 2.5 4.25C2.5 3.55938 1.94062 3 1.25 3C0.559375 3 0 3.55938 0 4.25C0 4.94062 0.559375 5.5 1.25 5.5C1.25625 5.5 1.26562 5.5 1.27188 5.5L2.7 13.3562C2.87188 14.3062 3.7 15 4.66875 15H13.3313C14.2969 15 15.125 14.3094 15.3 13.3562L16.7281 5.5C16.7344 5.5 16.7437 5.5 16.75 5.5C17.4406 5.5 18 4.94062 18 4.25C18 3.55938 17.4406 3 16.75 3C16.0594 3 15.5 3.55938 15.5 4.25C15.5 4.53125 15.5938 4.79063 15.75 5L12.9656 7.22813C12.4688 7.625 11.7312 7.4625 11.4469 6.89375L9.65625 3.3125Z"
              fill={getIconColor("/my-account/subscription")}
            />
          </svg>
          <span className="text-[20px] font-normal leading-6 font-[Montserrat]" style={{ color: "var(--text-primary)" }}>Subscription</span>
        </div>
      </Link>

      {/* Historial de Pagos */}
      <Link href="/my-account/payment-history">
        <div
          style={{ backgroundColor: isActive("/my-account/payment-history") ? "var(--brand-color)" : "var(--surface-bg)", border: isActive("/my-account/payment-history") ? "none" : "1px solid var(--border-color)" }}
          className="p-6 flex items-center justify-center gap-4 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path
              d="M2 0C0.896875 0 0 0.896875 0 2V3H18V2C18 0.896875 17.1031 0 16 0H2ZM18 6H0V12C0 13.1031 0.896875 14 2 14H16C17.1031 14 18 13.1031 18 12V6ZM3.5 10H5.5C5.775 10 6 10.225 6 10.5C6 10.775 5.775 11 5.5 11H3.5C3.225 11 3 10.775 3 10.5C3 10.225 3.225 10 3.5 10ZM7 10.5C7 10.225 7.225 10 7.5 10H11.5C11.775 10 12 10.225 12 10.5C12 10.775 11.775 11 11.5 11H7.5C7.225 11 7 10.775 7 10.5Z"
              fill={getIconColor("/my-account/payment-history")}
            />
          </svg>
          <span className="text-[20px] font-normal leading-6 font-[Montserrat]" style={{ color: "var(--text-primary)" }}>Payment History</span>
        </div>
      </Link>

      {/* Favoritos */}
      <Link href="/my-account/favorites">
        <div
          style={{ backgroundColor: isActive("/my-account/favorites") ? "var(--brand-color)" : "var(--surface-bg)", border: isActive("/my-account/favorites") ? "none" : "1px solid var(--border-color)" }}
          className="p-6 flex items-center justify-center gap-4 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 16 14" fill="none">
            <path
              d="M1.4875 8.07028L7.13438 13.3422C7.36875 13.5609 7.67812 13.6828 8 13.6828C8.32187 13.6828 8.63125 13.5609 8.86563 13.3422L14.5125 8.07028C15.4625 7.18591 16 5.94528 16 4.64841V4.46716C16 2.28278 14.4219 0.420285 12.2688 0.0609095C10.8438 -0.17659 9.39375 0.289035 8.375 1.30778L8 1.68278L7.625 1.30778C6.60625 0.289035 5.15625 -0.17659 3.73125 0.0609095C1.57812 0.420285 0 2.28278 0 4.46716V4.64841C0 5.94528 0.5375 7.18591 1.4875 8.07028Z"
              fill={getIconColor("/my-account/favorites")}
            />
          </svg>
          <span className="text-[20px] font-normal leading-6 font-[Montserrat]" style={{ color: "var(--text-primary)" }}>Favorites</span>
        </div>
      </Link>

      {/* Notifications */}
      <Link href="/my-account/notifications">
        <div
          style={{ backgroundColor: isActive("/my-account/notifications") ? "var(--brand-color)" : "var(--surface-bg)", border: isActive("/my-account/notifications") ? "none" : "1px solid var(--border-color)" }}
          className="p-6 flex items-center justify-center gap-4 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 24 24" fill={getIconColor("/my-account/notifications")}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={getIconColor("/my-account/notifications")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span className="text-[20px] font-normal leading-6 font-[Montserrat]" style={{ color: "var(--text-primary)" }}>Notifications</span>
        </div>
      </Link>

      {/* Configuración */}
      <Link href="/my-account/settings">
        <div
          style={{ backgroundColor: isActive("/my-account/settings") ? "var(--brand-color)" : "var(--surface-bg)", border: isActive("/my-account/settings") ? "none" : "1px solid var(--border-color)" }}
          className="p-6 flex items-center justify-center gap-4 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <ConfigIcon color={getIconColor("/my-account/settings")} />
          <span className="text-[20px] font-normal leading-6 font-[Montserrat]" style={{ color: "var(--text-primary)" }}>Settings</span>
        </div>
      </Link>
    </div>
  )
}

function ConfigIcon({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 20 16" fill="none">
      <path
        d="M7 0C8.06087 0 9.07828 0.421427 9.82843 1.17157C10.5786 1.92172 11 2.93913 11 4C11 5.06087 10.5786 6.07828 9.82843 6.82843C9.07828 7.57857 8.06087 8 7 8C5.93913 8 4.92172 7.57857 4.17157 6.82843C3.42143 6.07828 3 5.06087 3 4C3 2.93913 3.42143 1.92172 4.17157 1.17157C4.92172 0.421427 5.93913 0 7 0ZM5.57188 9.5H8.42813C8.79688 9.5 9.15938 9.5375 9.50625 9.60312C9.44063 10.1812 9.7375 10.7156 10.1875 11.0031C9.66875 11.3344 9.35312 11.9906 9.5625 12.6687C9.6875 13.0719 9.85625 13.4656 10.075 13.8438C10.2937 14.2219 10.55 14.5656 10.8375 14.875C11.3281 15.4031 12.075 15.45 12.625 15.1469V15.175C12.625 15.4625 12.7094 15.7531 12.8719 15.9969H0.928125C0.415625 16 0 15.5844 0 15.0719C0 11.9937 2.49375 9.5 5.57188 9.5Z"
        fill={color}
      />
      <path
        d="M15 12.2437C15.3315 12.2437 15.6495 12.112 15.8839 11.8777C16.1183 11.6433 16.25 11.3253 16.25 10.9937C16.25 10.6622 16.1183 10.3442 15.8839 10.1098C15.6495 9.87545 15.3315 9.74375 15 9.74375C14.6685 9.74375 14.3505 9.87545 14.1161 10.1098C13.8817 10.3442 13.75 10.6622 13.75 10.9937C13.75 11.3253 13.8817 11.6433 14.1161 11.8777C14.3505 12.112 14.6685 12.2437 15 12.2437ZM16.375 6.81875C16.375 6.6 16.2344 6.40312 16.0219 6.35625C15.6938 6.28125 15.35 6.24062 15 6.24062C14.65 6.24062 14.3062 6.28125 13.9781 6.35625C13.7656 6.40312 13.625 6.6 13.625 6.81875V7.775C13.375 7.88125 13.1438 8.01562 12.9281 8.175L12.15 7.72813C11.9594 7.61875 11.7219 7.64375 11.5719 7.80312C11.3344 8.05625 11.125 8.34062 10.9438 8.65312C10.7625 8.96562 10.6219 9.29062 10.5219 9.62187C10.4563 9.83125 10.5563 10.05 10.7469 10.1594L11.5281 10.6094C11.5156 10.7344 11.5063 10.8625 11.5063 10.9937C11.5063 11.125 11.5125 11.25 11.5281 11.3781L10.7469 11.8281C10.5563 11.9375 10.4594 12.1562 10.5219 12.3656C10.625 12.6969 10.7656 13.0219 10.9438 13.3344C11.1219 13.6469 11.3344 13.9312 11.5719 14.1844C11.7219 14.3438 11.9625 14.3687 12.15 14.2594L12.9281 13.8125C13.1438 13.9719 13.375 14.1062 13.625 14.2125V15.1687C13.625 15.3875 13.7656 15.5844 13.9781 15.6313C14.3062 15.7063 14.65 15.7469 15 15.7469C15.35 15.7469 15.6938 15.7063 16.0219 15.6313C16.2344 15.5844 16.375 15.3875 16.375 15.1687V14.2125C16.625 14.1062 16.8562 13.9719 17.0719 13.8094L17.85 14.2563C18.0406 14.3656 18.2781 14.3406 18.4281 14.1812C18.6656 13.9281 18.875 13.6438 19.0562 13.3313C19.2375 13.0188 19.3781 12.6938 19.4781 12.3625C19.5437 12.1531 19.4437 11.9344 19.2531 11.825L18.4719 11.375C18.4844 11.2469 18.4937 11.1187 18.4937 10.9906C18.4937 10.8625 18.4875 10.7344 18.4719 10.6062L19.2531 10.1562C19.4437 10.0469 19.5437 9.82812 19.4781 9.61875C19.3781 9.2875 19.2375 8.9625 19.0562 8.65C18.875 8.3375 18.6656 8.05312 18.4281 7.8C18.2781 7.64062 18.0375 7.61562 17.85 7.725L17.0719 8.17188C16.8562 8.0125 16.625 7.87813 16.625 7.75938C16.4438 7.44688 16.2062 7.17188 15.9375 6.9375C15.6688 6.70312 15.35 6.5625 15 6.5625Z"
        fill={color}
      />
    </svg>
  )
}
