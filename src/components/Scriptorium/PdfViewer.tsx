"use client"
export function PdfViewer({ url }: { url: string | null }) {
  if (!url) return (
    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 m-4 rounded-lg text-med-muted">
      <p className="font-serif italic text-sm">Bir parşömen seçilmedi...</p>
    </div>
  );

  return (
    <div className="h-full w-full bg-black">
      <iframe src={`${url}#toolbar=0&navpanes=0`} className="w-full h-full border-none opacity-90 invert-[0.05]" />
    </div>
  );
}