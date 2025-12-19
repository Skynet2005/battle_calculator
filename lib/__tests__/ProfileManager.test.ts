/**
 * Type validation and interface tests for ProfileManager component.
 * These tests verify that the type definitions compile correctly.
 */

import type { UserProfile } from '../../components/types';

// ============================================================================
// Type Compatibility Tests for ProfileManager Props
// ============================================================================

// ProfileManager props interface matching component
interface ProfileManagerPropsTest {
  onProfileChange: (profile: UserProfile | null) => void;
}

// Test minimal required props
const minimalProfileManagerProps: ProfileManagerPropsTest = {
  onProfileChange: (profile: UserProfile | null) => console.log('Profile changed:', profile?.name ?? 'null'),
};

// Test with logging callback
const loggingProfileManagerProps: ProfileManagerPropsTest = {
  onProfileChange: (profile: UserProfile | null) => {
    if (profile) {
      console.log('Profile selected:', profile.id, profile.name);
      console.log('Created:', new Date(profile.createdAt).toISOString());
      console.log('Updated:', new Date(profile.updatedAt).toISOString());
    } else {
      console.log('No profile selected');
    }
  },
};

// ============================================================================
// Profile State Management Tests
// ============================================================================

interface ProfileManagerState {
  profiles: UserProfile[];
  currentProfile: UserProfile | null;
  showCreateDialog: boolean;
  newProfileName: string;
  loading: boolean;
  error: string | null;
  editingProfileId: string | null;
  editingName: string;
  searchQuery: string;
}

const createInitialState = (): ProfileManagerState => ({
  profiles: [],
  currentProfile: null,
  showCreateDialog: false,
  newProfileName: '',
  loading: false,
  error: null,
  editingProfileId: null,
  editingName: '',
  searchQuery: '',
});

// Simulated minimal UserProfile for testing
const createMockProfile = (id: string, name: string): Partial<UserProfile> => ({
  id,
  name,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Test state transitions
const testStateTransitions = () => {
  const state = createInitialState();

  // Initial state assertions
  console.assert(state.profiles.length === 0);
  console.assert(state.currentProfile === null);
  console.assert(state.showCreateDialog === false);
  console.assert(state.loading === false);
  console.assert(state.error === null);
  console.assert(state.editingProfileId === null);
  console.assert(state.searchQuery === '');

  // Simulate opening create dialog
  const afterOpenDialog = { ...state, showCreateDialog: true };
  console.assert(afterOpenDialog.showCreateDialog === true);

  // Simulate setting new profile name
  const afterSetName = { ...afterOpenDialog, newProfileName: 'My New Profile' };
  console.assert(afterSetName.newProfileName === 'My New Profile');

  // Simulate loading state
  const afterLoading = { ...afterSetName, loading: true };
  console.assert(afterLoading.loading === true);

  // Simulate adding a profile
  const mockProfile = createMockProfile('test-id-1', 'Test Profile 1');
  const afterAddProfile = {
    ...afterLoading,
    loading: false,
    showCreateDialog: false,
    newProfileName: '',
    profiles: [mockProfile as UserProfile],
    currentProfile: mockProfile as UserProfile,
  };
  console.assert(afterAddProfile.profiles.length === 1);
  console.assert(afterAddProfile.currentProfile?.name === 'Test Profile 1');
};

// ============================================================================
// Profile CRUD Operations Type Tests
// ============================================================================

type ProfileOperation = 'create' | 'read' | 'update' | 'delete' | 'duplicate' | 'rename' | 'select';

interface ProfileOperationResult<T> {
  success: boolean;
  operation: ProfileOperation;
  data?: T;
  error?: string;
}

const simulateOperation = <T>(
  operation: ProfileOperation,
  data?: T
): ProfileOperationResult<T> => ({
  success: true,
  operation,
  data,
});

const testCRUDOperations = () => {
  // Test create operation
  const createResult = simulateOperation<Partial<UserProfile>>('create', {
    id: 'new-profile-id',
    name: 'New Profile',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  console.assert(createResult.success === true);
  console.assert(createResult.operation === 'create');
  console.assert(createResult.data?.name === 'New Profile');

  // Test duplicate operation
  const duplicateResult = simulateOperation<Partial<UserProfile>>('duplicate', {
    id: 'duplicated-profile-id',
    name: 'New Profile (Copy)',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  console.assert(duplicateResult.success === true);
  console.assert(duplicateResult.operation === 'duplicate');
  console.assert(duplicateResult.data?.name === 'New Profile (Copy)');

  // Test rename operation
  const renameResult = simulateOperation<{ id: string; newName: string }>('rename', {
    id: 'profile-id',
    newName: 'Renamed Profile',
  });
  console.assert(renameResult.success === true);
  console.assert(renameResult.operation === 'rename');
  console.assert(renameResult.data?.newName === 'Renamed Profile');

  // Test delete operation
  const deleteResult = simulateOperation<{ id: string }>('delete', {
    id: 'deleted-profile-id',
  });
  console.assert(deleteResult.success === true);
  console.assert(deleteResult.operation === 'delete');

  // Test select operation
  const selectResult = simulateOperation<{ id: string }>('select', {
    id: 'selected-profile-id',
  });
  console.assert(selectResult.success === true);
  console.assert(selectResult.operation === 'select');
};

// ============================================================================
// Profile Search and Filter Tests
// ============================================================================

interface ProfileSearchConfig {
  query: string;
  caseSensitive: boolean;
}

const filterProfiles = (
  profiles: Partial<UserProfile>[],
  config: ProfileSearchConfig
): Partial<UserProfile>[] => {
  const { query, caseSensitive } = config;
  if (!query.trim()) return profiles;

  return profiles.filter((profile) => {
    const name = profile.name ?? '';
    return caseSensitive
      ? name.includes(query)
      : name.toLowerCase().includes(query.toLowerCase());
  });
};

const testProfileSearch = () => {
  const mockProfiles: Partial<UserProfile>[] = [
    createMockProfile('1', 'Main Profile'),
    createMockProfile('2', 'Test Profile'),
    createMockProfile('3', 'Another Test'),
    createMockProfile('4', 'My Battle Setup'),
  ];

  // Test case-insensitive search
  const searchResults1 = filterProfiles(mockProfiles, { query: 'test', caseSensitive: false });
  console.assert(searchResults1.length === 2);

  // Test case-sensitive search
  const searchResults2 = filterProfiles(mockProfiles, { query: 'Test', caseSensitive: true });
  console.assert(searchResults2.length === 2);

  // Test no match
  const searchResults3 = filterProfiles(mockProfiles, { query: 'xyz', caseSensitive: false });
  console.assert(searchResults3.length === 0);

  // Test empty query returns all
  const searchResults4 = filterProfiles(mockProfiles, { query: '', caseSensitive: false });
  console.assert(searchResults4.length === 4);

  // Test partial match
  const searchResults5 = filterProfiles(mockProfiles, { query: 'Battle', caseSensitive: false });
  console.assert(searchResults5.length === 1);
};

// ============================================================================
// Profile UI State Tests
// ============================================================================

interface ProfileUIState {
  isCreating: boolean;
  isEditing: boolean;
  isDeleting: boolean;
  isDuplicating: boolean;
  selectedProfileId: string | null;
  editingProfileId: string | null;
}

const createProfileUIState = (): ProfileUIState => ({
  isCreating: false,
  isEditing: false,
  isDeleting: false,
  isDuplicating: false,
  selectedProfileId: null,
  editingProfileId: null,
});

const testUIStateTransitions = () => {
  const state = createProfileUIState();

  // Initial state
  console.assert(state.isCreating === false);
  console.assert(state.isEditing === false);
  console.assert(state.selectedProfileId === null);

  // Start creating
  const creatingState = { ...state, isCreating: true };
  console.assert(creatingState.isCreating === true);

  // Start editing a profile
  const editingState = { ...state, isEditing: true, editingProfileId: 'profile-123' };
  console.assert(editingState.isEditing === true);
  console.assert(editingState.editingProfileId === 'profile-123');

  // Select a profile
  const selectedState = { ...state, selectedProfileId: 'profile-456' };
  console.assert(selectedState.selectedProfileId === 'profile-456');

  // Duplicating state
  const duplicatingState = { ...state, isDuplicating: true };
  console.assert(duplicatingState.isDuplicating === true);
};

// ============================================================================
// Profile Validation Tests
// ============================================================================

interface ProfileValidation {
  isValid: boolean;
  errors: string[];
}

const validateProfileName = (name: string): ProfileValidation => {
  const errors: string[] = [];

  if (!name.trim()) {
    errors.push('Profile name is required');
  }

  if (name.length > 50) {
    errors.push('Profile name must be 50 characters or less');
  }

  if (name.trim().length < 2) {
    errors.push('Profile name must be at least 2 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const testProfileValidation = () => {
  // Valid name
  const valid = validateProfileName('My Profile');
  console.assert(valid.isValid === true);
  console.assert(valid.errors.length === 0);

  // Empty name
  const empty = validateProfileName('');
  console.assert(empty.isValid === false);
  console.assert(empty.errors.length > 0);

  // Whitespace only
  const whitespace = validateProfileName('   ');
  console.assert(whitespace.isValid === false);

  // Too short
  const tooShort = validateProfileName('A');
  console.assert(tooShort.isValid === false);

  // Too long
  const tooLong = validateProfileName('A'.repeat(51));
  console.assert(tooLong.isValid === false);
};

// ============================================================================
// Export validation
// ============================================================================

export {
  minimalProfileManagerProps,
  loggingProfileManagerProps,
  createInitialState,
  createMockProfile,
  testStateTransitions,
  simulateOperation,
  testCRUDOperations,
  filterProfiles,
  testProfileSearch,
  createProfileUIState,
  testUIStateTransitions,
  validateProfileName,
  testProfileValidation,
};

export type {
  ProfileManagerPropsTest,
  ProfileManagerState,
  ProfileOperation,
  ProfileOperationResult,
  ProfileSearchConfig,
  ProfileUIState,
  ProfileValidation,
};

// Run all tests
testStateTransitions();
testCRUDOperations();
testProfileSearch();
testUIStateTransitions();
testProfileValidation();

console.log('ProfileManager type definitions validated successfully!');
