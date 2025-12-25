'use client';

import { SectionCard } from '@/components/ui';

export default function ProfileHeaderCard({
  profileName,
  createdAt,
  updatedAt,
  onSave
}: {
  profileName: string;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
  onSave: () => void;
}) {
  return (
    <SectionCard
      title={`Profile: ${profileName}`}
      description={`Created: ${new Date(createdAt).toLocaleString()} • Last Updated: ${new Date(updatedAt).toLocaleString()}`}
      headerActions={
        <button className="button" onClick={onSave}>
          Save Profile
        </button>
      }
    >
      <div className="mt-4" />
    </SectionCard>
  );
}
