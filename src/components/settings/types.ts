export type AutoStopMode = 'disabled' | 'sentence' | 'paragraph';

/**
 * Props for SettingsDrawer component
 */
export interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  autoStopMode: AutoStopMode;
  onAutoStopModeChange: (mode: AutoStopMode) => void;
  showControls: boolean;
  onShowControlsChange: (show: boolean) => void;
}

/**
 * Props for AutoStopSettings component
 */
export interface AutoStopSettingsProps {
  autoStopMode: AutoStopMode;
  onAutoStopModeChange: (mode: AutoStopMode) => void;
}
