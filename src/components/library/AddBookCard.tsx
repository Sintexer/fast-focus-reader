import { Box, VStack, Text, Flex } from '@chakra-ui/react';
import { BsPlus } from 'react-icons/bs';
import { useI18n } from '../../i18n/useI18n';

export interface AddBookCardProps {
  onClick: () => void;
}

export function AddBookCard({ onClick }: AddBookCardProps) {
  const { t } = useI18n();

  return (
    <Box
      w="100%"
      h="100%"
      bg="green.50"
      _dark={{ bg: 'green.900' }}
      borderRadius="md"
      borderWidth="2px"
      borderColor="green.300"
      _dark={{ borderColor: 'green.700' }}
      display="flex"
      flexDirection="column"
      position="relative"
      overflow="hidden"
      cursor="pointer"
      onClick={onClick}
      transition="all 0.2s"
      _hover={{
        borderColor: 'green.500',
        _dark: { borderColor: 'green.500' },
        boxShadow: 'xl',
        transform: 'translateY(-4px)',
        bg: 'green.100',
        _dark: { bg: 'green.800' },
      }}
      boxShadow="md"
    >
      {/* Background gradient */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bgGradient="to-b"
        gradientFrom="green.50"
        gradientTo="green.100"
        _dark={{ gradientFrom: 'green.900', gradientTo: 'green.800' }}
        opacity={0.5}
      />

      {/* Content */}
      <Flex
        flex="1"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p={3}
        zIndex={1}
        position="relative"
        gap={2}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="green.600"
          _dark={{ color: 'green.400' }}
        >
          <BsPlus size={48} />
        </Box>
        <Text
          fontSize="xs"
          fontWeight="bold"
          lineHeight="1.2"
          textAlign="center"
          color="green.700"
          _dark={{ color: 'green.300' }}
        >
          {t('uploadBook')}
        </Text>
      </Flex>

      {/* Spine effect on the left */}
      <Box
        position="absolute"
        left="0"
        top="0"
        bottom="0"
        w="4px"
        bg="green.400"
        _dark={{ bg: 'green.600' }}
        opacity={0.5}
      />
    </Box>
  );
}
