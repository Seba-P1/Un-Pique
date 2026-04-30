import { useWindowDimensions, Platform } from 'react-native'
import React from 'react'

const SIDEBAR_WIDTH_EXPANDED = 260
const SIDEBAR_WIDTH_COLLAPSED = 60

export function useResponsive() {
  const { width, height } = useWindowDimensions()

  // El sidebar aparece en web cuando la ventana >= 768px
  // Usar el sidebar expandido como valor conservador
  const sidebarWidth = (Platform.OS === 'web' && width >= 768)
    ? SIDEBAR_WIDTH_EXPANDED
    : 0

  const contentWidth = width - sidebarWidth

  const isMobile = contentWidth < 640
  const isTablet = contentWidth >= 640 && contentWidth < 900
  const isDesktop = contentWidth >= 900
  const isWidescreen = contentWidth >= 1100

  const maxContentWidth = isWidescreen ? 1200
    : isDesktop ? 960
    : isTablet ? 720
    : contentWidth

  const businessCols = isWidescreen ? 4 : isDesktop ? 3 : isTablet ? 2 : 1
  const productCols = isWidescreen ? 5 : isDesktop ? 4 : isTablet ? 3 : 2
  const horizontalPadding = isDesktop ? 32 : isTablet ? 24 : 16

  return {
    width,
    height,
    contentWidth,
    isMobile,
    isTablet,
    isDesktop,
    isWidescreen,
    maxContentWidth,
    businessCols,
    productCols,
    horizontalPadding,
  }
}

interface ResponsiveContainerProps {
  children: React.ReactNode
  style?: import('react-native').ViewStyle
}

export function ResponsiveContainer({ children, style }: ResponsiveContainerProps) {
  const { maxContentWidth, horizontalPadding } = useResponsive()
  const { View } = require('react-native')

  return (
    <View
      style={[
        {
          width: '100%',
          maxWidth: maxContentWidth,
          alignSelf: 'center' as const,
          paddingHorizontal: horizontalPadding,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
