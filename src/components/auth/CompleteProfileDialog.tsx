import { useRef, useState } from 'react';
import { Camera, Save } from 'lucide-react';

interface CompleteProfileDialogProps {
  open: boolean;
  defaultName: string;
  defaultAvatar: string;
  onSubmit: (displayName: string, avatarUrl: string) => Promise<{ error: any }>;
}

const CompleteProfileDialog = ({ open, defaultName, defaultAvatar, onSubmit }: CompleteProfileDialogProps) => {
  const [displayName, setDisplayName] = useState(defaultName);
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatar);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarUrl((ev.target?.result as string) || '');
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setError('');

    if (!displayName.trim()) {
      setError('يرجى إدخال الاسم');
      return;
    }

    if (!avatarUrl.trim()) {
      setError('يرجى اختيار صورة');
      return;
    }

    setSaving(true);
    const { error: saveError } = await onSubmit(displayName, avatarUrl);
    if (saveError) setError(saveError.message || 'تعذر حفظ الملف الشخصي');
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/25 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm glass ios-shadow-lg rounded-2xl p-6 border border-border/70 animate-scale-in">
        <h2 className="text-lg font-semibold text-foreground mb-1">أكمل ملفك الشخصي</h2>
        <p className="text-sm text-muted-foreground mb-5">أضف الاسم والصورة قبل البدء</p>

        <div className="flex justify-center mb-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-2xl bg-secondary border border-border overflow-hidden flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-6 h-6 text-muted-foreground" />
            )}
            <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Camera className="w-3.5 h-3.5" />
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
        </div>

        <input
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
          placeholder="الاسم"
          className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />

        {error && <p className="text-xs text-destructive mt-3">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? '...' : 'حفظ والمتابعة'}
        </button>
      </div>
    </div>
  );
};

export default CompleteProfileDialog;
