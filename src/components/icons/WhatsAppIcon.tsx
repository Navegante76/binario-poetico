import type { SVGProps } from "react";

/**
 * Official WhatsApp logo — green speech bubble with white phone handset.
 * Renders via `fill="currentColor"` so callers control the color (default: white).
 */
export interface WhatsAppIconProps extends Omit<SVGProps<SVGSVGElement>, "fill"> {
  /** Foreground color (logo is monochrome). Defaults to "currentColor". */
  color?: string;
  /** Use the small mark (24px path) instead of the full brand mark. */
  mark?: "brand" | "small";
}

export function WhatsAppIcon({
  color = "currentColor",
  className,
  mark = "brand",
  ...rest
}: WhatsAppIconProps) {
  // Brand mark — green disc with the speech bubble + phone shape inside.
  if (mark === "brand") {
    return (
      <svg
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden
        fill={color}
        {...rest}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16 3C8.82 3 3 8.82 3 16c0 2.47.71 4.77 1.93 6.71L3 29l6.5-1.9A12.96 12.96 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.7c-1.96 0-3.79-.56-5.36-1.55l-.38-.24-3.86 1.13.98-3.74-.32-.42A10.7 10.7 0 0 1 5.3 16C5.3 10.13 10.13 5.3 16 5.3S26.7 10.13 26.7 16 21.87 26.7 16 26.7zm5.86-8.05c-.32-.16-1.9-.94-2.2-1.05-.29-.11-.51-.16-.73.16-.22.32-.86 1.05-1.05 1.27-.2.21-.39.24-.71.08-.32-.16-1.36-.5-2.59-1.6-.96-.86-1.61-1.92-1.8-2.24-.19-.32-.02-.5.14-.66.14-.15.32-.39.48-.57.16-.19.21-.32.34-.55.11-.22.06-.41-.02-.57-.08-.16-.73-1.76-.99-2.4-.26-.62-.52-.54-.72-.55l-.61-.01c-.21 0-.56.08-.86.4-.29.32-1.13 1.1-1.13 2.69s1.16 3.12 1.32 3.33c.16.22 2.26 3.47 5.5 4.87.77.33 1.37.53 1.84.68.77.24 1.47.21 2.03.13.62-.09 1.91-.78 2.18-1.54.27-.76.27-1.4.19-1.54-.08-.14-.3-.23-.62-.39z"
        />
      </svg>
    );
  }

  // Small mark — foreground shape only (no green disc), useful for inline buttons.
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      fill={color}
      {...rest}
    >
      <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.8.97-.98 1.17-.18.2-.36.22-.66.07-.3-.15-1.27-.47-2.41-1.49-.89-.8-1.49-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.13.3-.34.45-.5.15-.17.2-.3.31-.5.1-.2.05-.38-.02-.53-.07-.15-.66-1.59-.9-2.18-.24-.56-.49-.48-.66-.49-.17-.01-.36-.01-.56-.01-.2 0-.52.07-.78.37-.27.3-1.03 1-1.03 2.45 0 1.44 1.05 2.84 1.2 3.03.15.2 2.07 3.16 5.02 4.43.7.3 1.25.49 1.68.62.7.22 1.34.19 1.85.12.57-.08 1.76-.72 2-1.4.25-.69.25-1.28.18-1.4-.07-.13-.27-.2-.57-.35z" />
      <path d="M20.5 3.5C18.27 1.27 15.27 0 12.07 0 5.5 0 .13 5.37.13 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.33-1.66a11.93 11.93 0 0 0 5.7 1.45h.01c6.56 0 11.93-5.37 11.93-11.93 0-3.19-1.27-6.19-3.47-8.4zM12.04 21.8h-.01a9.87 9.87 0 0 1-5.04-1.39l-.36-.21-3.75.98.99-3.66-.24-.38a9.86 9.86 0 0 1-1.51-5.21C2.1 6.47 6.57 2 12.04 2c2.62 0 5.08 1.02 6.94 2.87a9.78 9.78 0 0 1 2.87 6.94c0 5.47-4.46 9.93-9.81 9.99z" />
    </svg>
  );
}
