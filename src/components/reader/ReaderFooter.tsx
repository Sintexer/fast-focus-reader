import { Box, Text, HStack, Flex, IconButton } from '@chakra-ui/react';
import { BsFileText, BsGear, BsFire, BsArrowUp } from 'react-icons/bs';
import { Tooltip } from '../ui/tooltip';
import { useI18n } from '../../i18n/useI18n';
import type { Settings } from '../../utils/db';
import { useState, useEffect, useRef } from 'react';

export interface ReaderFooterProps {
  currentSentenceIndex: number;
  maxSentenceIndex: number;
  wpm: number;
  settings?: Settings | null;
  showChapterView?: boolean;
  onToggleChapterView?: () => void;
  onOpenSettings?: () => void;
  onWPMClick?: () => void;
}

/**
 * Footer component for the reader
 * Displays playback state information (sentence number, WPM) with toggle buttons
 * Autonomous component with its own padding
 */

export function ReaderFooter({
  currentSentenceIndex,
  maxSentenceIndex,
  wpm,
  settings,
  showChapterView = false,
  onToggleChapterView,
  onOpenSettings,
  onWPMClick,
}: ReaderFooterProps) {
  const { t } = useI18n();
  const prevWPMRef = useRef<number>(wpm);
  const [animationTrigger, setAnimationTrigger] = useState(0);
  
  // Check if dynamic mode is enabled and WPM is at max
  const isDynamic = settings?.dynamicWPMEnabled ?? false;
  const maxWPM = settings?.maxWPMRange ?? 1200;
  const isAtMax = isDynamic && wpm >= maxWPM;
  
  // Detect WPM increase and trigger animation by incrementing trigger key
  useEffect(() => {
    if (wpm > prevWPMRef.current && isDynamic) {
      setAnimationTrigger(prev => prev + 1);
    }
    prevWPMRef.current = wpm;
  }, [wpm, isDynamic]);
  
  return (
    <Box w="100%" py={2} px={2}>
      <HStack justifyContent="center" alignItems="center" gap={2} w="100%">
        {/* Left flex: space-between with settings button and sentence number */}
        <Flex flex="1" justifyContent="space-between" alignItems="center" gap={2}>
          {/* Settings button */}
          {onOpenSettings && (
            <Tooltip content={t('openSettings')}>
              <IconButton
                aria-label={t('openSettings')}
                onClick={onOpenSettings}
                size="xs"
                variant="ghost"
                colorPalette="gray"
                minW="auto"
                h="auto"
                p={0}
                opacity={0.4}
                _hover={{ opacity: 1 }}
              >
                <BsGear />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Sentence number */}
          <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
            {t('sentence')} {currentSentenceIndex + 1} {t('of')} {maxSentenceIndex + 1}
          </Text>
        </Flex>

        {/* Middle div: dot divider */}
        <Box fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }} px={1}>
          •
        </Box>

        {/* Right flex: WPM and chapter toggle button */}
        <Flex flex="1" justifyContent="space-between" alignItems="center" gap={2}>
          {/* WPM - clickable */}
          <HStack gap={1} alignItems="center">
            <Text
              key={`wpm-text-${animationTrigger}`}
              fontSize="xs"
              color="gray.500"
              _dark={{ color: 'gray.400' }}
              cursor={onWPMClick ? 'pointer' : 'default'}
              onClick={onWPMClick}
              _hover={onWPMClick ? { textDecoration: 'underline' } : {}}
            >
              {t('speed')}: {wpm} {t('wpm')}
            </Text>
            {isAtMax ? (
              <Box
                as={BsFire}
                fontSize="xs"
                opacity={0.2}
                display="inline-flex"
                alignItems="center"
                lineHeight="1"
              />
            ) : animationTrigger > 0 ? (
              <Box
                key={`arrow-${animationTrigger}`}
                as={BsArrowUp}
                fontSize="xs"
                color="green.700"
                display="inline-flex"
                alignItems="center"
                lineHeight="1"
                animation="fade-out 0.7s ease-out forwards"
              />
            ) : null}
          </HStack>

          {/* Toggle button for chapter view */}
          {onToggleChapterView && (
            <Tooltip content={showChapterView ? t('hideChapterView') : t('showChapterView')}>
              <IconButton
                aria-label={showChapterView ? t('hideChapterView') : t('showChapterView')}
                onClick={onToggleChapterView}
                size="xs"
                variant="ghost"
                colorPalette="gray"
                minW="auto"
                h="auto"
                p={0}
                opacity={showChapterView ? 1 : 0.4}
                _hover={{ opacity: 1 }}
              >
                <BsFileText />
              </IconButton>
            </Tooltip>
          )}
        </Flex>
      </HStack>
    </Box>
  );
}
