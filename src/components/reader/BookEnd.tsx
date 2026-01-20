import { VStack, Heading, Button, Icon } from '@chakra-ui/react';
import { BsArrowReturnLeft } from 'react-icons/bs';

export interface BookEndProps {
  onBackToLibrary: () => void;
}

/**
 * Component displayed when the book has ended
 * Shows "The End" message and a button to return to library
 * Positioned in the same space where the current word is displayed
 */
export function BookEnd({ onBackToLibrary }: BookEndProps) {
  return (
    <VStack
      gap={6}
      alignItems="center"
      justifyContent="center"
      h="100%"
      px={4}
    >
      {/* The End title - centered in the same position as current word */}
      <Heading
        size="2xl"
        fontWeight="bold"
        color="gray.700"
        _dark={{ color: 'gray.300' }}
        textAlign="center"
      >
        The End
      </Heading>
      
      {/* Back to library button */}
      <Button
        onClick={onBackToLibrary}
        size="sm"
        variant="outline"
        colorPalette="red"
      >
        <Icon><BsArrowReturnLeft /></Icon>
        Back to library
      </Button>
    </VStack>
  );
}
