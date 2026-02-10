import { Download } from 'lucide-react';

export default function AddDeviceCard({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-surface-main/30 rounded-2xl p-6 border-2 border-dashed border-border-main hover:border-primary-main transition-all cursor-pointer flex flex-col items-center justify-center min-h-[250px] group"
    >
      <div className="w-16 h-16 bg-primary-main/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Download className="w-8 h-8 text-primary-main" />
      </div>
      <h3 className="text-lg font-bold text-foreground-main mb-2">
        Add New Device
      </h3>
      <p className="text-muted-main text-xs text-center px-4">
        Download the app to add more phones
      </p>
    </div>
  );
}
