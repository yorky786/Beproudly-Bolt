import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Shield, Flag, Edit, Camera, X, Plus, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SUGGESTED_INTERESTS = [
  'Music', 'Travel', 'Art', 'Fitness', 'Gaming', 'Cooking',
  'Photography', 'Reading', 'Dancing', 'Hiking', 'Fashion', 'Movies'
];

export default function Profile() {
  const { profile, signOut, updateProfile, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddInterest, setShowAddInterest] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    pronouns: profile?.pronouns || '',
    age: profile?.age?.toString() || '',
    location: profile?.location || '',
    bio: profile?.bio || '',
    interests: profile?.interests || [],
  });

  const calculateCompletion = () => {
    const fields = [
      formData.name,
      formData.age,
      formData.location,
      formData.bio,
      profile?.profile_image_url,
      profile?.profile_video_url,
      formData.interests?.length > 0
    ];
    const filledFields = fields.filter(Boolean).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  const handleImageClick = () => {
    if (!isEditing) return;
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `profile-images/${user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      await updateProfile({ profile_image_url: urlData.publicUrl });
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;

    const interests = formData.interests || [];
    if (interests.length >= 10) {
      alert('Maximum 10 interests allowed');
      return;
    }

    if (!interests.includes(newInterest.trim())) {
      setFormData({
        ...formData,
        interests: [...interests, newInterest.trim()]
      });
    }

    setNewInterest('');
    setShowAddInterest(false);
  };

  const handleRemoveInterest = (interest: string) => {
    setFormData({
      ...formData,
      interests: (formData.interests || []).filter(i => i !== interest)
    });
  };

  const handleQuickAddInterest = (interest: string) => {
    const interests = formData.interests || [];
    if (interests.includes(interest)) {
      handleRemoveInterest(interest);
    } else if (interests.length < 10) {
      setFormData({
        ...formData,
        interests: [...interests, interest]
      });
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.age) {
      alert('Name and age are required');
      return;
    }

    const age = parseInt(formData.age);
    if (age < 18 || age > 100) {
      alert('Age must be between 18 and 100');
      return;
    }

    setSaving(true);
    try {
      const { error } = await updateProfile({
        name: formData.name.trim(),
        pronouns: formData.pronouns.trim(),
        age: parseInt(formData.age),
        location: formData.location.trim(),
        bio: formData.bio.trim(),
        interests: formData.interests,
        profile_completion_percentage: calculateCompletion(),
      });

      if (error) throw error;
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff5555] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#2a2a2a] rounded-3xl shadow-2xl overflow-hidden border border-[#ff5555]/20">
          <div className="relative h-48 bg-gradient-to-r from-[#ff5555] to-[#ff9500]">
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              <div className="relative">
                <div
                  className={`w-32 h-32 rounded-full bg-[#2a2a2a] p-2 shadow-2xl ${
                    isEditing ? 'cursor-pointer hover:ring-4 hover:ring-[#ff5555]/50' : ''
                  } transition-all`}
                  onClick={handleImageClick}
                  role={isEditing ? 'button' : undefined}
                  aria-label={isEditing ? 'Click to upload profile image' : undefined}
                >
                  {profile.profile_image_url ? (
                    <img
                      src={profile.profile_image_url}
                      alt={profile.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#ff5555] to-[#ff9500] flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {profile.name[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage || !isEditing}
                />
              </div>
            </div>
          </div>

          <div className="pt-20 pb-8 px-6">
            {completionPercentage < 100 && !isEditing && (
              <div className="mb-6 bg-[#1a1a1a]/50 rounded-xl p-4 border border-[#ff5555]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Profile Completion</span>
                  <span className="text-sm font-bold text-[#ff5555]">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-[#3a3a3a] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ff5555] to-[#ff9500] transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-white/70 mt-2">
                  Complete your profile to increase visibility
                </p>
              </div>
            )}

            {!isEditing ? (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold text-white mb-1">{profile.name}</h1>
                  {profile.pronouns && (
                    <p className="text-white/70 mb-2">{profile.pronouns}</p>
                  )}
                  <div className="flex items-center justify-center gap-4 text-sm text-white/70">
                    {profile.age && <span>{profile.age} years old</span>}
                    {profile.location && <span>• {profile.location}</span>}
                  </div>
                </div>

                {profile.bio && (
                  <div className="mb-6 bg-[#1a1a1a]/50 rounded-xl p-4 border border-[#ff5555]/20">
                    <h3 className="text-sm font-semibold text-white mb-2">About</h3>
                    <p className="text-white/70">{profile.bio}</p>
                  </div>
                )}

                {profile.interests && profile.interests.length > 0 && (
                  <div className="mb-6 bg-[#1a1a1a]/50 rounded-xl p-4 border border-[#ff5555]/20">
                    <h3 className="text-sm font-semibold text-white mb-3">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gradient-to-r from-[#ff5555]/20 to-[#ff9500]/20 border border-[#ff5555]/30 rounded-full text-sm text-white"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#ff5555]/50 transition flex items-center justify-center gap-2"
                    aria-label="Edit profile"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Profile
                  </button>

                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full bg-[#3a3a3a] text-white/90 py-3 rounded-xl font-semibold hover:bg-[#4a4a4a] transition flex items-center justify-center gap-2 border border-[#ff5555]/20"
                    aria-label="Open safety and privacy settings"
                  >
                    <Shield className="w-5 h-5" />
                    Safety & Privacy
                  </button>

                  <button
                    onClick={signOut}
                    className="w-full bg-red-500/20 text-red-400 py-3 rounded-xl font-semibold hover:bg-red-500/30 transition flex items-center justify-center gap-2 border border-red-500/30"
                    aria-label="Sign out of your account"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-white/90 mb-2">
                    Name *
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#ff5555]/30 text-white rounded-xl focus:ring-2 focus:ring-[#ff5555] focus:border-transparent outline-none transition placeholder:text-white/40"
                    maxLength={50}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-pronouns" className="block text-sm font-medium text-white/90 mb-2">
                    Pronouns
                  </label>
                  <input
                    id="edit-pronouns"
                    type="text"
                    value={formData.pronouns}
                    onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#ff5555]/30 text-white rounded-xl focus:ring-2 focus:ring-[#ff5555] focus:border-transparent outline-none transition placeholder:text-white/40"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label htmlFor="edit-age" className="block text-sm font-medium text-white/90 mb-2">
                    Age *
                  </label>
                  <input
                    id="edit-age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#ff5555]/30 text-white rounded-xl focus:ring-2 focus:ring-[#ff5555] focus:border-transparent outline-none transition placeholder:text-white/40"
                    min="18"
                    max="100"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-location" className="block text-sm font-medium text-white/90 mb-2">
                    Location
                  </label>
                  <input
                    id="edit-location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#ff5555]/30 text-white rounded-xl focus:ring-2 focus:ring-[#ff5555] focus:border-transparent outline-none transition placeholder:text-white/40"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label htmlFor="edit-bio" className="block text-sm font-medium text-white/90 mb-2">
                    Bio <span className="text-white/50 text-xs">({formData.bio.length}/500)</span>
                  </label>
                  <textarea
                    id="edit-bio"
                    value={formData.bio}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setFormData({ ...formData, bio: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#ff5555]/30 text-white rounded-xl focus:ring-2 focus:ring-[#ff5555] focus:border-transparent outline-none resize-none transition placeholder:text-white/40"
                    rows={4}
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Interests (max 10)
                  </label>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {SUGGESTED_INTERESTS.map((interest) => {
                      const isSelected = formData.interests?.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleQuickAddInterest(interest)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white'
                              : 'bg-[#3a3a3a] text-white/70 border border-[#ff5555]/20 hover:bg-[#4a4a4a]'
                          }`}
                          disabled={!isSelected && (formData.interests?.length || 0) >= 10}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {interest}
                        </button>
                      );
                    })}
                  </div>

                  {formData.interests && formData.interests.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-white/50 mb-2">Your interests:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.interests.map((interest, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gradient-to-r from-[#ff5555]/20 to-[#ff9500]/20 border border-[#ff5555]/30 rounded-full text-sm text-white flex items-center gap-2"
                          >
                            {interest}
                            <button
                              type="button"
                              onClick={() => handleRemoveInterest(interest)}
                              className="hover:text-red-400 transition"
                              aria-label={`Remove ${interest}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!showAddInterest ? (
                    <button
                      type="button"
                      onClick={() => setShowAddInterest(true)}
                      disabled={(formData.interests?.length || 0) >= 10}
                      className="w-full py-2 border border-dashed border-[#ff5555]/30 rounded-xl text-white/70 hover:border-[#ff5555]/50 hover:text-white transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Add Custom Interest
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                        placeholder="Type interest..."
                        className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#ff5555]/30 text-white rounded-xl text-sm focus:ring-2 focus:ring-[#ff5555] focus:border-transparent outline-none placeholder:text-white/40"
                        maxLength={20}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddInterest}
                        className="px-4 py-2 bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white rounded-xl hover:shadow-lg transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddInterest(false);
                          setNewInterest('');
                        }}
                        className="px-4 py-2 bg-[#3a3a3a] text-white rounded-xl hover:bg-[#4a4a4a] transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving || !formData.name || !formData.age}
                    className="flex-1 bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#ff5555]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-busy={saving}
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: profile?.name || '',
                        pronouns: profile?.pronouns || '',
                        age: profile?.age?.toString() || '',
                        location: profile?.location || '',
                        bio: profile?.bio || '',
                        interests: profile?.interests || [],
                      });
                    }}
                    disabled={saving}
                    className="flex-1 bg-[#3a3a3a] text-white/90 py-3 rounded-xl font-semibold hover:bg-[#4a4a4a] transition border border-[#ff5555]/20 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#2a2a2a] rounded-3xl shadow-2xl p-6 max-w-md w-full border border-[#ff5555]/20">
            <h2 className="text-2xl font-bold text-white mb-4">Safety & Privacy</h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 p-3 bg-[#1a1a1a]/50 rounded-xl border border-[#ff5555]/20">
                <Shield className="w-5 h-5 text-[#ff5555] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white">Community Guidelines</h3>
                  <p className="text-sm text-white/70">
                    We're committed to creating a safe and inclusive space for everyone.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#1a1a1a]/50 rounded-xl border border-[#ff5555]/20">
                <Flag className="w-5 h-5 text-[#ff5555] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white">Report Issues</h3>
                  <p className="text-sm text-white/70">
                    Report any inappropriate behavior or content you encounter.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowReportModal(false)}
              className="w-full bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#ff5555]/50 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
