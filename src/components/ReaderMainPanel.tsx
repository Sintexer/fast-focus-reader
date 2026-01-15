import { Box, Text } from "@chakra-ui/react";

export function ReaderMainPanel() {

    return (
          <Box 
            flex="1" 
            display="flex" 
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
            overflow="hidden"
            px={4}
          >
            <Text>Main panel</Text>
          </Box>
    )
}