import NexusManager from '@/components/NexusManager';

export const metadata = {
  title: 'MedNexus | Trials',
  description: 'Exam Simulation & Question Bank',
};

export default function TrialsPage() {
  // Trials (Sınav/Zamanlayıcı) modunu başlat
  return <NexusManager moduleType="TRIALS" />;
}