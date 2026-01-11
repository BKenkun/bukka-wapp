interface FeatureItem {
  text: string
  included: boolean
}

interface SubscriptionPlanCardProps {
  name: string
  price: string
  description: string
  features: FeatureItem[]
  buttonText: string
  isCurrentPlan?: boolean
}

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="16"
    viewBox="0 0 14 16"
    fill="none"
    className="flex-shrink-0"
  >
    <g clipPath="url(#clip0_417_249)">
      <path
        d="M13.7062 3.29376C14.0968 3.68439 14.0968 4.31876 13.7062 4.70939L5.70615 12.7094C5.31553 13.1 4.68115 13.1 4.29053 12.7094L0.290527 8.70939C-0.100098 8.31876 -0.100098 7.68439 0.290527 7.29376C0.681152 6.90314 1.31553 6.90314 1.70615 7.29376L4.9999 10.5844L12.2937 3.29376C12.6843 2.90314 13.3187 2.90314 13.7093 3.29376H13.7062Z"
        fill="#FA4860"
      />
    </g>
    <defs>
      <clipPath id="clip0_417_249">
        <path d="M0 0H14V16H0V0Z" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="10"
    height="11"
    viewBox="0 0 10 11"
    fill="none"
    className="flex-shrink-0"
  >
    <line x1="8.73653" y1="1.05982" x2="1.0597" y2="9.37332" stroke="#FA4860" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="1.06046" y1="1.25252" x2="8.90516" y2="9.4078" stroke="#FA4860" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export function SubscriptionPlanCard({
  name,
  price,
  description,
  features,
  buttonText,
  isCurrentPlan = false,
}: SubscriptionPlanCardProps) {
  const showButton = buttonText !== ""

  return (
    <div
      className={`relative flex flex-col border ${isCurrentPlan ? "border-[#FA4860] border-2" : "border-[#E5E7EB]"} bg-transparent p-6`}
    >
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4 bg-[#00B1DE] text-white font-montserrat text-[12px] font-medium px-3 py-1">
          Plan Actual
        </div>
      )}

      <div className="text-center mb-4">
        <h3 className="text-[#E5E7EB] font-montserrat text-[18px] font-semibold leading-7">{name}</h3>
        <p className="text-white font-montserrat text-[30px] font-bold leading-normal mt-2">{price}</p>
        <p className="text-white font-montserrat text-[14px] font-bold leading-5 mt-2">{description}</p>
      </div>

      <div className="flex flex-col gap-[15px] flex-1 mt-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            {feature.included ? <CheckIcon /> : <XIcon />}
            <span className="text-[#E5E7EB] font-montserrat text-[14px] font-normal leading-5">{feature.text}</span>
          </div>
        ))}
      </div>

      {showButton && (
        <button
          className={`mt-6 w-full py-3 font-montserrat text-[14px] font-medium ${
            isCurrentPlan
              ? "bg-[#FA4860] text-white"
              : "border border-[#FA4860] text-[#FA4860] hover:bg-[#FA4860] hover:text-white transition-colors"
          }`}
        >
          {buttonText}
        </button>
      )}
    </div>
  )
}
