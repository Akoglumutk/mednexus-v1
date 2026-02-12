import NexusManager from '@/components/NexusManager';

export const metadata = {
  title: 'MedNexus | Observatory',
  description: 'Visual Anatomy & Histology Lab',
};

export default function ScriptoriumPage() {
  // Observatory (Görsel/Occlusion) modunu başlat
  return <NexusManager moduleType="OBSERVATORY" />;
}