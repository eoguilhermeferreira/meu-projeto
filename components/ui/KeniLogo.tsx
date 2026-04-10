interface KeniLogoProps {
  color?: string
  width?: number
}

export function KeniLogo({ color = 'currentColor', width = 72 }: KeniLogoProps) {
  return (
    <svg
      width={width}
      height={width * 0.38}
      viewBox="0 0 180 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="KENI"
    >
      {/* K */}
      <path
        d="M10 8H24V28L42 8H58L36 33L60 60H44L24 36V60H10V8Z"
        fill={color}
      />
      {/* E */}
      <path
        d="M68 8H110V20H82V28H106V40H82V48H110V60H68V8Z"
        fill={color}
      />
      {/* N */}
      <path
        d="M118 8H132L152 38V8H166V60H152L132 30V60H118V8Z"
        fill={color}
      />
      {/* Seta diagonal — símbolo da marca */}
      <path
        d="M172 8L180 8L170 34L180 60H172L160 34L172 8Z"
        fill={color}
        opacity="0.25"
      />
    </svg>
  )
}
