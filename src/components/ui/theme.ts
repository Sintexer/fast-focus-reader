import { createSystem, defaultConfig } from "@chakra-ui/react"

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      // Keep default tokens, we're just customizing the default color palette
    },
  },
  // Set green as the default color palette for components
  globalCss: {
    // This will make green the default for buttons and other components
    // Components can still override with colorPalette prop
  },
})
