import { useState, useEffect } from 'react';
import { X, Copy, Link, Users, Trash2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShareBoardDialogProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  boardName: string;
  isOwner: boolean;
  t?: (key: string) => string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  display_name: string;
}

const ShareBoardDialog = ({ open, onClose, boardId, boardName, isOwner, t }: ShareBoardDialogProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !boardId) return;
    loadMembers();
  }, [open, boardId]);

  const loadMembers = async () => {
    const { data } = await supabase
      .from('board_members')
      .select('id, user_id, role')
      .eq('board_id', boardId);

    if (data) {
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);
      setMembers(data.map(m => ({
        ...m,
        display_name: profileMap.get(m.user_id) || 'Unknown',
      })));
    }
  };

  const generateInviteLink = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('board_invites')
      .insert({ board_id: boardId, role: 'editor' })
      .select('token')
      .single();

    if (data && !error) {
      const link = `${window.location.origin}?invite=${data.token}`;
      setInviteLink(link);
    }
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeMember = async (memberId: string) => {
    await supabase.from('board_members').delete().eq('id', memberId);
    loadMembers();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass ios-shadow-lg rounded-2xl p-6 w-96 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">
            <Users className="w-4 h-4 inline-block mr-2" />
            {t?.('shareBoard') || 'Share Board'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">{boardName}</p>

        {/* Generate invite link */}
        {isOwner && (
          <div className="mb-4">
            {!inviteLink ? (
              <button onClick={generateInviteLink} disabled={loading}
                className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50">
                <Link className="w-4 h-4" />
                {loading ? '...' : (t?.('generateLink') || 'Generate Invite Link')}
              </button>
            ) : (
              <div className="flex gap-2">
                <input readOnly value={inviteLink}
                  className="flex-1 px-3 py-2 rounded-xl bg-secondary text-xs text-foreground outline-none" />
                <button onClick={copyLink}
                  className="p-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Members list */}
        <label className="block text-xs font-medium text-muted-foreground mb-2">
          {t?.('members') || 'Members'} ({members.length})
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-secondary/50">
              <div>
                <p className="text-sm font-medium text-foreground">{m.display_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
              </div>
              {isOwner && m.role === 'editor' && (
                <button onClick={() => removeMember(m.id)} className="p-1 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShareBoardDialog;
