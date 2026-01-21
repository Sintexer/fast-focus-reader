import { HStack, Text } from '@chakra-ui/react';
import { BsCupStraw, BsFire } from 'react-icons/bs';

export interface WPMSpeedDisplayProps {
  wpm: number;
  iconPosition?: 'left' | 'right';
  fontSize?: string;
  fontWeight?: string;
}

/**
 * Component for displaying WPM speed with appropriate color and icon
 * - <= 200: Green with ice icon
 * - > 600: Orange/Red with fire icon
 * - Otherwise: Default color, no icon
 */
export function WPMSpeedDisplay({
  wpm,
  iconPosition = 'right',
  fontSize = 'lg',
  fontWeight = 'semibold',
}: WPMSpeedDisplayProps) {
  const isSlow = wpm <= 200;
  const isFast = wpm > 600;
  
  const color = isSlow ? 'green.500' : isFast ? 'red.500' : undefined;
  const icon = isSlow ? <BsCupStraw /> : isFast ? <BsFire /> : null;
  
  const textElement = (
    <Text fontSize={fontSize} fontWeight={fontWeight} color={color}>
      {wpm}
    </Text>
  );
  
  const iconElement = icon ? (
    <Text fontSize={fontSize} color={color} display="inline-flex" alignItems="center" lineHeight="1">
      {icon}
    </Text>
  ) : null;
  
  if (!iconElement) {
    return textElement;
  }
  
  return (
    <HStack gap={1.5} alignItems="center">
      {iconPosition === 'left' && iconElement}
      {textElement}
      {iconPosition === 'right' && iconElement}
    </HStack>
  );
}
