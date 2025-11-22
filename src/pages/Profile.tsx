import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Shield, Flag, Edit } from 'lucide-react';

export default function Profile() {
  const { profile, signOut, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    pronouns: profile?.pronouns || '',
    age: profile?.age?.toString() || '',
    location: profile?.location || '',
    bio: profile?.bio || '',
  });

  const handleSave = async () => {
    await updateProfile({
      name: formData.name,
      pronouns: formData.pronouns,
      age: parseInt(formData.age),
      location: formData.location,
      bio: formData.bio,
    });
    setIsEditing(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="relative h-48 bg-gradient-to-r from-pink-500 to-purple-500">
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              <div className="w-32 h-32 rounded-full bg-white p-2 shadow-xl">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                    <span className="text-4xl font-bold text-pink-600">
                      {profile.name[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-20 pb-8 px-6">
            {!isEditing ? (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{profile.name}</h1>
                  {profile.pronouns && (
                    <p className="text-gray-600 mb-2">{profile.pronouns}</p>
                  )}
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                    {profile.age && <span>{profile.age} years old</span>}
                    {profile.location && <span>• {profile.location}</span>}
                  </div>
                </div>

                {profile.bio && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
                    <p className="text-gray-600">{profile.bio}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition flex items-center justify-center gap-2"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Profile
                  </button>

                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <Shield className="w-5 h-5" />
                    Safety & Privacy
                  </button>

                  <button
                    onClick={signOut}
                    className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-100 transition flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pronouns</label>
                  <input
                    type="text"
                    value={formData.pronouns}
                    onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Safety & Privacy</h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-pink-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Community Guidelines</h3>
                  <p className="text-sm text-gray-600">
                    We're committed to creating a safe and inclusive space for everyone.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Flag className="w-5 h-5 text-pink-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Report Issues</h3>
                  <p className="text-sm text-gray-600">
                    Report any inappropriate behavior or content you encounter.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowReportModal(false)}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
