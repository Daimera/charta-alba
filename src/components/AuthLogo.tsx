import { LogoMark } from "./LogoMark";

export function AuthLogo() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      margin: "0 auto 24px",
    }}>
      <LogoMark size={64} color="#89CFF0" showGlow={true} />
    </div>
  );
}
