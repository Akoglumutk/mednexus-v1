import NexusManager from "@/components/NexusManager";

export const metadata = {
  title: 'MedNexus | Scriptorium',
  description: 'Advanced Medical Knowledge Base',
};

export default function ScriptoriumPage() {
  // Scriptorium  modunu başlat
  return <NexusManager moduleType='SCRIPTORIUM' />;
}