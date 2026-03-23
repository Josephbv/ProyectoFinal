import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "#1E293B",
          "--normal-border": "#374151",
          "--normal-text": "#FFFFFF",
          "--success-bg": "#059669",
          "--success-border": "#10B981", 
          "--success-text": "#FFFFFF",
          "--error-bg": "#DC2626",
          "--error-border": "#EF4444",
          "--error-text": "#FFFFFF",
          "--warning-bg": "#D97706",
          "--warning-border": "#F59E0B",
          "--warning-text": "#FFFFFF",
          "--info-bg": "#2563EB",
          "--info-border": "#3B82F6", 
          "--info-text": "#FFFFFF",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
