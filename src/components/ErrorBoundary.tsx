import { Component, type ReactNode } from 'react';
import { Box, Container, VStack, HStack, Text, Button, Heading } from '@chakra-ui/react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxW="container.md" py={8}>
          <VStack align="stretch" gap={4}>
            <Heading size="lg" color="red.500">
              Something went wrong
            </Heading>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>
              An unexpected error occurred. Please try refreshing the page or returning to the library.
            </Text>
            {this.state.error && (
              <Box
                p={4}
                bg="gray.100"
                _dark={{ bg: 'gray.800' }}
                borderRadius="md"
                fontSize="sm"
                fontFamily="mono"
                overflowX="auto"
              >
                <Text fontWeight="bold" mb={2}>Error details:</Text>
                <Text>{this.state.error.toString()}</Text>
                {this.state.error.stack && (
                  <Text mt={2} fontSize="xs" opacity={0.7}>
                    {this.state.error.stack}
                  </Text>
                )}
              </Box>
            )}
            <HStack gap={3}>
              <Button onClick={this.handleReset} colorScheme="blue">
                Go to Library
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Reload Page
              </Button>
            </HStack>
          </VStack>
        </Container>
      );
    }

    return this.props.children;
  }
}
