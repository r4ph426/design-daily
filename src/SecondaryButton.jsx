import "./secondary-button.css";

export function SecondaryButton({ className = "", type = "button", children, ...props }) {
  return <button {...props} type={type} className={`secondary-button ${className}`.trim()}>{children}</button>;
}
