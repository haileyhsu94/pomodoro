import { useState } from 'react';
import { useAuthStore } from '../lib/stores/auth-store';
import { useThemeStore } from '../lib/stores/theme-store';
import { LogOut, User, X, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { AvatarSelection, avatars } from './avatar-selection';

export function ProfileMenu() {
  const { user, signOut, updateProfile } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.user_metadata?.avatar_id || 'earth');
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ 
        full_name: fullName,
        avatar_id: selectedAvatar 
      });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = () => {
    const avatar = avatars.find(a => a.id === (user?.user_metadata?.avatar_id || 'earth'));
    return avatar?.url || avatars[0].url;
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Profile</h3>
          <button
            onClick={() => setIsEditing(false)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-[#9F353A] dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Choose Planet Avatar
            </label>
            <AvatarSelection
              selected={selectedAvatar}
              onSelect={setSelectedAvatar}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#9F353A] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
      <div className="flex items-center space-x-3 mb-4">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
          <img
            src={getAvatarUrl()}
            alt="Profile avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {user?.user_metadata?.full_name || 'Anonymous User'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</div>
        </div>
      </div>
      <div className="space-y-2">
        <button
          onClick={() => setIsEditing(true)}
          className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          <span className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Edit Profile
          </span>
        </button>
        <button
          onClick={toggleTheme}
          className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          <span className="flex items-center gap-2">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 text-left text-[#9F353A] bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          <span className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );
}