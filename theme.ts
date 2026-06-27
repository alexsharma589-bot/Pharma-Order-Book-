import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Pharmaceutical blue/white brand palette
const brandBlue = '#0D5BBD'; // primary
const brandBlueDark = '#0A3D7A';
const accentTeal = '#00A99D';

export const PharmaLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brandBlue,
    onPrimary: '#FFFFFF',
    primaryContainer: '#D7E6FB',
    secondary: accentTeal,
    background: '#FAFBFE',
    surface: '#FFFFFF',
    surfaceVariant: '#EEF3FB',
    error: '#C62828',
    outline: '#C7D3E6',
  },
  roundness: 14,
};

export const PharmaDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#7FB1F2',
    onPrimary: '#04254A',
    primaryContainer: brandBlueDark,
    secondary: accentTeal,
    background: '#0E1420',
    surface: '#161D2B',
    surfaceVariant: '#1E2738',
    error: '#FF8A80',
    outline: '#2D3A52',
  },
  roundness: 14,
};

export const categoryColor = (category: string): string => {
  const map: Record<string, string> = {
    Tablets: '#0D5BBD',
    Capsules: '#7C4DFF',
    Syrups: '#00A99D',
    Injections: '#C62828',
    Ointments: '#6D4C41',
    'Protein Powders': '#F9A825',
    Nutraceuticals: '#2E7D32',
    Cardiac: '#D81B60',
    Diabetic: '#5E35B1',
    Analgesics: '#EF6C00',
    Antibiotics: '#00838F',
    Others: '#616161',
  };
  return map[category] || '#616161';
};
