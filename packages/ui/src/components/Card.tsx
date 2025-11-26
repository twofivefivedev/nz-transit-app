import { View, type ViewProps } from "react-native";

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <View
      className={`border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}





