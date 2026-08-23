import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showBadge?: boolean;
  className?: string;
}

export function DotvexLogo({ size = 'md', showText = false, showBadge = true }: Props) {
  const sizeMap = {
    sm: { icon: 28, text: 13, sub: 10 },
    md: { icon: 36, text: 16, sub: 12 },
    lg: { icon: 48, text: 22, sub: 14 },
    xl: { icon: 64, text: 28, sub: 16 },
  };

  const { icon, text, sub } = sizeMap[size];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <LinearGradient
        colors={['#10a37f', '#0d946e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: icon,
          height: icon,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <View style={{ width: icon * 0.6, height: icon * 0.6, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: icon * 0.18, height: icon * 0.18, borderRadius: icon * 0.09, backgroundColor: 'white' }} />
        </View>
      </LinearGradient>

      {showText && (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontWeight: 'bold', fontSize: text, color: '#ececec', letterSpacing: -0.3 }}>
              DOTVEX
            </Text>
            {showBadge && (
              <View style={{ backgroundColor: '#10a37f', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ color: 'white', fontSize: 9, fontWeight: 'bold' }}>2.0</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: sub, color: '#737373', marginTop: 1 }}>
            by Dotman
          </Text>
        </View>
      )}
    </View>
  );
}
