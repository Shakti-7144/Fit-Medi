import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, User } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", gender: "", phone: "", avatar_url: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm({
        name: data.name ?? "", age: data.age?.toString() ?? "", gender: data.gender ?? "",
        phone: data.phone ?? "", avatar_url: data.avatar_url ?? "",
      });
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id, email: user.email,
      name: form.name || null,
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender || null,
      phone: form.phone || null,
      avatar_url: form.avatar_url || null,
    });
    if (error) toast.error(error.message); else toast.success("Profile saved");
    setSaving(false);
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setForm(f => ({ ...f, avatar_url: data.publicUrl }));
      await supabase.from("profiles").upsert({ id: user.id, email: user.email, avatar_url: data.publicUrl });
      toast.success("Avatar updated");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  if (loading) return <div className="grid place-items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <p className="text-sm text-primary font-medium">Account</p>
      <h1 className="font-display text-4xl md:text-5xl text-foreground mt-1">Profile settings</h1>
      <p className="mt-2 text-muted-foreground">Manage your personal info{role ? ` · signed in as ${role}` : ""}.</p>

      <Card className="mt-8 p-6 md:p-8 border-0 shadow-soft rounded-3xl">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 ring-4 ring-secondary">
            <AvatarImage src={form.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground"><User className="h-8 w-8" /></AvatarFallback>
          </Avatar>
          <div>
            <label className="inline-flex items-center cursor-pointer gradient-hero text-primary-foreground rounded-2xl h-11 px-5 shadow-elegant text-sm font-medium">
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Change photo
            </label>
            <p className="text-xs text-muted-foreground mt-2">PNG/JPG up to 5MB</p>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div><Label>Full name</Label><Input className="mt-1.5 h-11 rounded-xl" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Email</Label><Input className="mt-1.5 h-11 rounded-xl" value={user?.email ?? ""} disabled /></div>
          <div><Label>Age</Label><Input type="number" className="mt-1.5 h-11 rounded-xl" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} /></div>
          <div>
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
              <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="prefer-not">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>Phone</Label><Input className="mt-1.5 h-11 rounded-xl" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        </div>

        <Button onClick={save} disabled={saving} className="mt-6 gradient-hero text-primary-foreground rounded-2xl h-12 px-6 shadow-elegant">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Save changes
        </Button>
      </Card>
    </div>
  );
};

export default Profile;
