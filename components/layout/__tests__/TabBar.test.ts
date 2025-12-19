/**
 * Type validation and interface tests for TabBar component.
 * These tests verify that the type definitions compile correctly and
 * can be used as expected throughout the codebase.
 */

import type { Tab, TabKey } from '../TabBar';

// ============================================================================
// Type Compatibility Tests
// ============================================================================

// Test TabKey type
const validTabKeys: TabKey[] = ['profile', 'opponent', 'rally', 'results', 'howto'];

// Test individual TabKey assignments
const profileTab: TabKey = 'profile';
const opponentTab: TabKey = 'opponent';
const rallyTab: TabKey = 'rally';
const resultsTab: TabKey = 'results';
const howtoTab: TabKey = 'howto';

// Test Tab interface
const basicTab: Tab = {
  key: 'profile',
  label: 'Player'
};

const tabWithShortLabel: Tab = {
  key: 'rally',
  label: 'Rally Configuration',
  shortLabel: 'Rally'
};

const tabWithIcon: Tab = {
  key: 'results',
  label: 'Results',
  icon: null // In real usage, this would be a React node
};

const fullTab: Tab = {
  key: 'howto',
  label: 'How to Use Guide',
  shortLabel: 'Guide',
  icon: null
};

// Test Tab array for TabBar
const tabs: Tab[] = [
  { key: 'profile', label: 'Player', shortLabel: 'Player' },
  { key: 'opponent', label: 'Opponent', shortLabel: 'Opponent' },
  { key: 'rally', label: 'Rally Config', shortLabel: 'Rally' },
  { key: 'results', label: 'Results', shortLabel: 'Results' },
  { key: 'howto', label: 'How-to-Use', shortLabel: 'Guide' }
];

// ============================================================================
// Props Validation Tests
// ============================================================================

// Simulated props interface matching TabBarProps
interface TabBarPropsTest {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  tabs?: Tab[];
  className?: string;
}

// Test props with required fields only
const minimalProps: TabBarPropsTest = {
  activeTab: 'profile',
  onTabChange: (tab: TabKey) => console.log('Tab changed to:', tab)
};

// Test props with all optional fields
const fullProps: TabBarPropsTest = {
  activeTab: 'rally',
  onTabChange: (tab: TabKey) => {
    // Type check: tab should be TabKey
    const validTabs: TabKey[] = ['profile', 'opponent', 'rally', 'results', 'howto'];
    console.assert(validTabs.includes(tab));
  },
  tabs: tabs,
  className: 'custom-class'
};

// ============================================================================
// Callback Type Tests
// ============================================================================

// Test onTabChange callback types
const testTabChangeCallback = () => {
  const handleTabChange = (newTab: TabKey): void => {
    switch (newTab) {
      case 'profile':
        console.log('Switched to Player tab');
        break;
      case 'opponent':
        console.log('Switched to Opponent tab');
        break;
      case 'rally':
        console.log('Switched to Rally Config tab');
        break;
      case 'results':
        console.log('Switched to Results tab');
        break;
      case 'howto':
        console.log('Switched to How-to-Use tab');
        break;
    }
  };

  // Test calling callback with each valid TabKey
  handleTabChange('profile');
  handleTabChange('opponent');
  handleTabChange('rally');
  handleTabChange('results');
  handleTabChange('howto');
};

// ============================================================================
// Type Guard Tests
// ============================================================================

const isValidTabKey = (key: string): key is TabKey => {
  return ['profile', 'opponent', 'rally', 'results', 'howto'].includes(key);
};

const testTypeGuards = () => {
  // Valid tab keys
  console.assert(isValidTabKey('profile') === true);
  console.assert(isValidTabKey('opponent') === true);
  console.assert(isValidTabKey('rally') === true);
  console.assert(isValidTabKey('results') === true);
  console.assert(isValidTabKey('howto') === true);

  // Invalid tab keys
  console.assert(isValidTabKey('invalid') === false);
  console.assert(isValidTabKey('') === false);
  console.assert(isValidTabKey('settings') === false);
};

// ============================================================================
// Export validation
// ============================================================================

export {
  validTabKeys,
  profileTab,
  opponentTab,
  rallyTab,
  resultsTab,
  howtoTab,
  basicTab,
  tabWithShortLabel,
  tabWithIcon,
  fullTab,
  tabs,
  minimalProps,
  fullProps,
  testTabChangeCallback,
  isValidTabKey,
  testTypeGuards
};

console.log('TabBar type definitions validated successfully!');
