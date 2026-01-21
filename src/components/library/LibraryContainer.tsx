import { Container, Flex, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { LibraryFooter } from './LibraryFooter';

export interface LibraryContainerProps {
  children: ReactNode;
  onOpenSettings: () => void;
  onOpenLanguageSelection: () => void;
}

export function LibraryContainer({
  children,
  onOpenSettings,
  onOpenLanguageSelection,
}: LibraryContainerProps) {
  return (
    <Container
      maxW={{ base: "100%", lg: "1024px", xl: "1280px", "2xl": "1536px" }}
      h="100vh"
      p={0}
      centerContent={false}
      overflowX="hidden"
      display="flex"
      flexDirection="column"
    >
      {children}
      <LibraryFooter
        onOpenSettings={onOpenSettings}
        onOpenLanguageSelection={onOpenLanguageSelection}
      />
    </Container>
  );
}

export interface LibraryEmptyStateProps {
  message: string;
  onOpenSettings: () => void;
  onOpenLanguageSelection: () => void;
}

export function LibraryEmptyState({
  message,
  onOpenSettings,
  onOpenLanguageSelection,
}: LibraryEmptyStateProps) {
  return (
    <LibraryContainer
      onOpenSettings={onOpenSettings}
      onOpenLanguageSelection={onOpenLanguageSelection}
    >
      <Flex flex="1" alignItems="center" justifyContent="center" px={2}>
        <Text>{message}</Text>
      </Flex>
    </LibraryContainer>
  );
}
