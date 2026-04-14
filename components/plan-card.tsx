interface PlanCardProps {
  name: string
  price: string
  features: string[]
  buttonText: string
}

export function PlanCard({ name, price, features, buttonText }: PlanCardProps) {
  return (
    <div className="p-8" style={{ backgroundColor: "var(--surface-bg)" }}>
      <div className="flex items-center gap-4 mb-[20px]">
        <h3 className="text-white font-[family-name:var(--font-montserrat)] text-[30px] font-semibold leading-7">
          {name}
        </h3>
        <p className="text-white text-center font-[family-name:var(--font-montserrat)] text-[22px] font-bold leading-normal">
          {price}
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-8">
        <div className="flex flex-col gap-[10px]">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-[10px]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" viewBox="0 0 14 10" fill="none">
                <path
                  d="M13.7086 0.292969C14.0992 0.683594 14.0992 1.31797 13.7086 1.70859L5.70859 9.70859C5.31797 10.0992 4.68359 10.0992 4.29297 9.70859L0.292969 5.70859C-0.0976562 5.31797 -0.0976562 4.68359 0.292969 4.29297C0.683594 3.90234 1.31797 3.90234 1.70859 4.29297L5.00234 7.58359L12.2961 0.292969C12.6867 -0.0976562 13.3211 -0.0976562 13.7117 0.292969H13.7086Z"
                  fill="var(--accent-color)"
                />
              </svg>
              <span className="text-white font-[family-name:var(--font-montserrat)] text-[12px] font-normal leading-5">
                {feature}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center">
          <button className="btn-primary flex items-center justify-center gap-[10px]">
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}
