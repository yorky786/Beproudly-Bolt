import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Flame } from 'lucide-react';
import VideoRecorder from '../components/VideoRecorder';
import { uploadVideo } from '../utils/video';

export default function ProfileSetup() {
  const { updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    pronouns: '',
    age: '',
    location: '',
    bio: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await updateProfile({
        name: formData.name,
        pronouns: formData.pronouns,
        age: parseInt(formData.age),
        location: formData.location,
        bio: formData.bio,
      });

      if (error) throw error;
      setStep(2);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center p-4">
        <div className="bg-[#2a2a2a] rounded-3xl shadow-2xl border border-[#ff5555]/20 p-8 w-full max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-[#ff5555] to-[#ff9500] rounded-full p-3 shadow-lg shadow-[#ff5555]/50">
              <Flame className="w-6 h-6 text-white" fill="white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff5555] to-[#ff9500] bg-clip-text text-transparent">
                Create Your Profile
              </h2>
              <p className="text-white/70 text-sm">Tell us about yourself</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#ff5555]/30 text-white rounded-xl focus:ring-2 focus:ring-[#ff5555] focus:border-transparent outline-none transition placeholder:text-white/40"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Pronouns
              </label>
              <input
                type="text"
                value={formData.pronouns}
                onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#ff5555]/30 text-white rounded-xl focus:ring-2 focus:ring-[#ff5555] focus:border-transparent outline-none transition placeholder:text-white/40"
                placeholder="e.g., she/her, he/him, they/them"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Age *
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#ff5555]/30 text-white rounded-xl focus:ring-2 focus:ring-[#ff5555] focus:border-transparent outline-none transition placeholder:text-white/40"
                placeholder="18"
                required
                min="18"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#ff5555]/30 text-white rounded-xl focus:ring-2 focus:ring-[#ff5555] focus:border-transparent outline-none transition placeholder:text-white/40"
                placeholder="City, State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#ff5555]/30 text-white rounded-xl focus:ring-2 focus:ring-[#ff5555] focus:border-transparent outline-none resize-none transition placeholder:text-white/40"
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#ff5555] to-[#ff9500] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#ff5555]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleVideoRecorded = async (blob: Blob, duration: number) => {
    if (!formData.name) {
      alert('Please complete the first step before adding video');
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await updateProfile.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: uploadData, error: uploadError } = await uploadVideo(
        blob,
        user.id,
        'profiles'
      );

      if (uploadError || !uploadData) throw uploadError;

      const { error: updateError } = await updateProfile({
        profile_video_url: uploadData.url,
        video_thumbnail_url: uploadData.thumbnailUrl,
        video_duration: duration,
      });

      if (updateError) throw updateError;

      window.location.reload();
    } catch (err) {
      console.error('Error uploading video:', err);
      alert('Failed to upload video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center p-4">
      <div className="bg-[#2a2a2a] rounded-3xl shadow-2xl border border-[#ff5555]/20 p-8 w-full max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff5555] to-[#ff9500] bg-clip-text text-transparent mb-2">
            Add Your Profile Video
          </h2>
          <p className="text-white/70 text-sm">
            Stand out with a video introduction
          </p>
        </div>

        <VideoRecorder
          onVideoRecorded={handleVideoRecorded}
          maxDuration={60}
          minDuration={10}
          theme="dark"
        />

        <button
          onClick={handleSkip}
          disabled={loading}
          className="w-full mt-4 bg-[#3a3a3a] text-white/70 py-3 rounded-xl font-medium hover:bg-[#4a4a4a] transition disabled:opacity-50 border border-[#ff5555]/20"
        >
          {loading ? 'Uploading...' : 'Skip for Now'}
        </button>
      </div>
    </div>
  );
}
