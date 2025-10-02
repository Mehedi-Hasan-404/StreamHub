// /src/pages/Admin.tsx - With Stream Validation
import { useState, useEffect } from 'react';
import { Route, Link, useLocation, Switch } from 'wouter';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Category, AdminChannel } from '@/types';
import { Shield, LogOut, Plus, Edit, Trash2, Save, X, Link as LinkIcon, Tv, Users, BarChart3, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from "@/components/ui/sonner";

// Admin Login Component
const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful", {
        description: "Welcome to the admin panel!",
      });
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6">
        <div className="text-center mb-6">
          <Shield size={48} className="text-accent mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-text-secondary">Sign in to manage your IPTV system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="form-input"
              disabled={loading}
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="form-input"
              disabled={loading}
            />
          </div>
          {error && (
            <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Categories Manager Component with Validation
const CategoriesManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ 
    name: '', 
    slug: '', 
    iconUrl: '', 
    m3uUrl: '' 
  });
  const [loading, setLoading] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

  // Helper function to generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesCol = collection(db, 'categories');
      const q = query(categoriesCol, orderBy('name'));
      const snapshot = await getDocs(q);
      const categoriesData = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error("Failed to fetch categories", {
        description: "Please try refreshing the page.",
      });
    }
  };

  const validateM3UUrl = async (url: string): Promise<boolean> => {
    if (!url) {
      setValidationStatus('idle');
      return true; // Empty URL is valid (optional field)
    }
    
    // Basic URL format check
    if (!url.toLowerCase().includes('.m3u8') && !url.toLowerCase().includes('.m3u')) {
      setValidationStatus('invalid');
      toast.warning("URL may not be a valid M3U playlist.", {
        description: "Expected .m3u or .m3u8 extension",
      });
      return true; // Don't block saving, just warn
    }
    
    setValidationStatus('validating');
    try {
      // Using a simple HEAD request to check availability
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      // no-cors means we can't read the status, but if it doesn't throw, the endpoint is likely reachable
      setValidationStatus('valid');
      return true;
    } catch (error) {
      console.error("URL validation error:", error);
      setValidationStatus('invalid');
      return false;
    }
  };

  const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    validateM3UUrl(e.target.value);
  };

  const handleSaveCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Validation Error", {
        description: "Category name is required",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Validate M3U URL if provided
      if (newCategory.m3uUrl.trim()) {
        const isValidM3U = await validateM3UUrl(newCategory.m3uUrl.trim());
        if (!isValidM3U) {
          toast.error("Invalid M3U URL", {
            description: "The M3U playlist URL is not accessible. Please check the URL.",
          });
          setLoading(false);
          return;
        }
      }

      const finalSlug = newCategory.slug.trim() || generateSlug(newCategory.name);
      
      const existingCategory = categories.find(cat => 
        cat.slug === finalSlug && cat.id !== editingCategory?.id
      );
      
      if (existingCategory) {
        toast.error("Duplicate Category", {
          description: "A category with this name/slug already exists. Please choose a different name.",
        });
        setLoading(false);
        return;
      }

      const categoryData = {
        name: newCategory.name.trim(),
        slug: finalSlug,
        iconUrl: newCategory.iconUrl.trim() || '',
        m3uUrl: newCategory.m3uUrl.trim() || '',
      };

      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), categoryData);
        toast.success("Category Updated", {
          description: `${categoryData.name} has been updated successfully.`,
        });
      } else {
        await addDoc(collection(db, 'categories'), categoryData);
        toast.success("Category Added", {
          description: `${categoryData.name} has been added successfully.`,
        });
      }
      
      setNewCategory({ name: '', slug: '', iconUrl: '', m3uUrl: '' });
      setEditingCategory(null);
      await fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error("Save Failed", {
        description: "Failed to save category. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      slug: category.slug,
      iconUrl: category.iconUrl || '',
      m3uUrl: category.m3uUrl || '',
    });
    setValidationStatus('idle');
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;
    
    try {
      await deleteDoc(doc(db, 'categories', id));
      await fetchCategories();
      toast.success("Category Deleted", {
        description: "Category has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error("Delete Failed", {
        description: "Failed to delete category. Please try again.",
      });
    }
  };

  const resetForm = () => {
    setNewCategory({ name: '', slug: '', iconUrl: '', m3uUrl: '' });
    setEditingCategory(null);
    setValidationStatus('idle');
  };

  const handleNameChange = (name: string) => {
    setNewCategory(prev => ({
      ...prev,
      name,
      slug: prev.slug === generateSlug(prev.name) ? generateSlug(name) : prev.slug
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Categories Management</h2>
      
      {/* Add/Edit Form */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category Name *</label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Sports, News, Entertainment, Movies"
              className="form-input"
              disabled={loading}
            />
            <p className="text-xs text-text-secondary mt-1">
              This will be the category that contains channels
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">URL Slug</label>
            <input
              type="text"
              value={newCategory.slug}
              onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
              placeholder="Auto-generated from name"
              className="form-input"
              disabled={loading}
            />
            <p className="text-xs text-text-secondary mt-1">
              Leave empty to auto-generate from name
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category Icon URL (Optional)</label>
            <input
              type="url"
              value={newCategory.iconUrl}
              onChange={(e) => setNewCategory({ ...newCategory, iconUrl: e.target.value })}
              placeholder="https://example.com/icon.png"
              className="form-input"
              disabled={loading}
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium mb-2">
              M3U Playlist URL (Optional)
              <LinkIcon size={14} className="inline ml-1 text-green-500" />
            </label>
            <input
              type="url"
              value={newCategory.m3uUrl}
              onChange={(e) => {
                setNewCategory({ ...newCategory, m3uUrl: e.target.value });
                setValidationStatus('idle');
              }}
              onBlur={handleUrlBlur}
              placeholder="https://example.com/playlist.m3u"
              className="form-input pr-10"
              disabled={loading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {validationStatus === 'validating' && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
              {validationStatus === 'valid' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {validationStatus === 'invalid' && <XCircle className="h-5 w-5 text-red-500" />}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Paste your M3U playlist URL here. All channels will be automatically imported.
            </p>
          </div>
        </div>
        
        {/* Preview */}
        {newCategory.name && (
          <div className="mt-4 p-3 bg-bg-secondary rounded-lg">
            <p className="text-sm text-text-secondary mb-2">Preview:</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-xs">
                {newCategory.iconUrl ? (
                  <img 
                    src={newCategory.iconUrl} 
                    alt="" 
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  newCategory.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="font-medium">{newCategory.name}</div>
                <div className="text-sm text-text-secondary">
                  URL: /category/{newCategory.slug || generateSlug(newCategory.name)}
                  {newCategory.m3uUrl && (
                    <span className="ml-2 text-green-500">• M3U Playlist</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSaveCategory}
            disabled={loading || !newCategory.name.trim()}
            className="btn-primary"
          >
            <Save size={16} />
            {loading ? 'Saving...' : editingCategory ? 'Update Category' : 'Add Category'}
          </button>
          {editingCategory && (
            <button onClick={resetForm} className="btn-secondary" disabled={loading}>
              <X size={16} />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          Existing Categories ({categories.length})
        </h3>
        {categories.length === 0 ? (
          <p className="text-text-secondary text-center py-8">
            No categories created yet. Add your first category above.
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white">
                    {category.iconUrl ? (
                      <img 
                        src={category.iconUrl} 
                        alt={category.name} 
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.textContent = category.name.charAt(0).toUpperCase();
                          }
                        }}
                      />
                    ) : (
                      category.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {category.name}
                      {category.m3uUrl && (
                        <span className="text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded">
                          M3U
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-text-secondary">
                      /category/{category.slug}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                    title="Edit category"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 text-destructive hover:text-red-400 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Channels Manager Component with Validation
const ChannelsManager = () => {
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingChannel, setEditingChannel] = useState<AdminChannel | null>(null);
  const [newChannel, setNewChannel] = useState({
    name: '',
    logoUrl: '',
    streamUrl: '',
    categoryId: '',
    authCookie: '',
  });
  const [loading, setLoading] = useState(false);
  const [streamValidationStatus, setStreamValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

  useEffect(() => {
    fetchChannels();
    fetchCategories();
  }, []);

  const fetchChannels = async () => {
    try {
      const channelsCol = collection(db, 'channels');
      const q = query(channelsCol, orderBy('name'));
      const snapshot = await getDocs(q);
      const channelsData = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as AdminChannel[];
      setChannels(channelsData);
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast.error("Failed to fetch channels", {
        description: "Please try refreshing the page.",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesCol = collection(db, 'categories');
      const q = query(categoriesCol, orderBy('name'));
      const snapshot = await getDocs(q);
      const categoriesData = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error("Failed to fetch categories", {
        description: "Please try refreshing the page.",
      });
    }
  };

  const validateStreamUrl = async (url: string): Promise<boolean> => {
    if (!url) {
      setStreamValidationStatus('idle');
      return true;
    }
    
    // Basic URL format check
    if (!url.toLowerCase().includes('.m3u8') && !url.toLowerCase().includes('.mp4')) {
      setStreamValidationStatus('invalid');
      toast.warning("URL may not be a valid stream format.", {
        description: "Expected .m3u8 or .mp4 extension",
      });
      return true; // Don't block saving, just warn
    }
    
    setStreamValidationStatus('validating');
    try {
      // Using a simple HEAD request to check availability
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      // no-cors means we can't read the status, but if it doesn't throw, the endpoint is likely reachable
      setStreamValidationStatus('valid');
      return true;
    } catch (error) {
      console.error("Stream URL validation error:", error);
      setStreamValidationStatus('invalid');
      return false;
    }
  };

  const handleStreamUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    validateStreamUrl(e.target.value);
  };

  const handleSaveChannel = async () => {
    if (!newChannel.name.trim() || !newChannel.streamUrl.trim() || !newChannel.categoryId) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields (Name, Stream URL, Category)",
      });
      return;
    }
    
    setLoading(true);
    try {
      const category = categories.find(cat => cat.id === newChannel.categoryId);
      if (!category) {
        toast.error("Invalid Category", {
          description: "Please select a valid category",
        });
        setLoading(false);
        return;
      }

      const channelData = {
        name: newChannel.name.trim(),
        logoUrl: newChannel.logoUrl.trim() || '/placeholder.svg',
        streamUrl: newChannel.streamUrl.trim(),
        categoryId: newChannel.categoryId,
        categoryName: category.name,
        authCookie: newChannel.authCookie.trim() || null,
      };

      if (editingChannel) {
        await updateDoc(doc(db, 'channels', editingChannel.id), channelData);
        toast.success("Channel Updated", {
          description: `${channelData.name} has been updated successfully.`,
        });
      } else {
        await addDoc(collection(db, 'channels'), channelData);
        toast.success("Channel Added", {
          description: `${channelData.name} has been added successfully.`,
        });
      }
      
      setNewChannel({ name: '', logoUrl: '', streamUrl: '', categoryId: '', authCookie: '' });
      setEditingChannel(null);
      await fetchChannels();
    } catch (error) {
      console.error('Error saving channel:', error);
      toast.error("Save Failed", {
        description: "Failed to save channel. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditChannel = (channel: AdminChannel) => {
    setEditingChannel(channel);
    setNewChannel({
      name: channel.name,
      logoUrl: channel.logoUrl,
      streamUrl: channel.streamUrl,
      categoryId: channel.categoryId,
      authCookie: channel.authCookie || '',
    });
    setStreamValidationStatus('idle');
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this channel? This action cannot be undone.')) return;
    
    try {
      await deleteDoc(doc(db, 'channels', id));
      await fetchChannels();
      toast.success("Channel Deleted", {
        description: "Channel has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting channel:', error);
      toast.error("Delete Failed", {
        description: "Failed to delete channel. Please try again.",
      });
    }
  };

  const resetForm = () => {
    setNewChannel({ name: '', logoUrl: '', streamUrl: '', categoryId: '', authCookie: '' });
    setEditingChannel(null);
    setStreamValidationStatus('idle');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manual Channels Management</h2>
        <div className="text-sm text-text-secondary">
          Manual channels only. M3U channels are managed via category playlists.
        </div>
      </div>
      
      {/* Add/Edit Form */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingChannel ? 'Edit Channel' : 'Add New Manual Channel'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Channel Name *</label>
            <input
              type="text"
              value={newChannel.name}
              onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
              placeholder="e.g., CNN, BBC News, ESPN"
              className="form-input"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Logo URL</label>
            <input
              type="url"
              value={newChannel.logoUrl}
              onChange={(e) => setNewChannel({ ...newChannel, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="form-input"
              disabled={loading}
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium mb-2">Stream URL (m3u8/mp4) *</label>
            <input
              type="url"
              value={newChannel.streamUrl}
              onChange={(e) => {
                setNewChannel({ ...newChannel, streamUrl: e.target.value });
                setStreamValidationStatus('idle');
              }}
              onBlur={handleStreamUrlBlur}
              placeholder="https://example.com/stream.m3u8"
              className="form-input pr-10"
              disabled={loading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {streamValidationStatus === 'validating' && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
              {streamValidationStatus === 'valid' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {streamValidationStatus === 'invalid' && <XCircle className="h-5 w-5 text-red-500" />}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              value={newChannel.categoryId}
              onChange={(e) => setNewChannel({ ...newChannel, categoryId: e.target.value })}
              className="form-input"
              disabled={loading}
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} {category.m3uUrl && '(Has M3U)'}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Authentication Cookie (Optional)</label>
            <textarea
              value={newChannel.authCookie}
              onChange={(e) => setNewChannel({ ...newChannel, authCookie: e.target.value })}
              placeholder="Cookie string for authenticated streams (if required)"
              className="form-input min-h-[60px] font-mono text-xs"
              rows={2}
              disabled={loading}
            />
          </div>
        </div>
        
        {/* Channel Preview */}
        {newChannel.name && newChannel.categoryId && (
          <div className="mt-4 p-3 bg-bg-secondary rounded-lg">
            <p className="text-sm text-text-secondary mb-2">Preview:</p>
            <div className="flex items-center gap-3">
              <img
                src={newChannel.logoUrl || '/placeholder.svg'}
                alt={newChannel.name}
                className="w-10 h-10 object-contain bg-white rounded"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <div>
                <div className="font-medium">{newChannel.name}</div>
                <div className="text-sm text-text-secondary">
                  {categories.find(c => c.id === newChannel.categoryId)?.name}
                  {newChannel.streamUrl && (
                    <span className="ml-2 text-green-500">• Stream URL provided</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSaveChannel}
            disabled={loading || !newChannel.name.trim() || !newChannel.streamUrl.trim() || !newChannel.categoryId}
            className="btn-primary"
          >
            <Save size={16} />
            {loading ? 'Saving...' : editingChannel ? 'Update Channel' : 'Add Channel'}
          </button>
          {editingChannel && (
            <button onClick={resetForm} className="btn-secondary" disabled={loading}>
              <X size={16} />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Channels List */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          Manual Channels ({channels.length})
        </h3>
        {channels.length === 0 ? (
          <p className="text-text-secondary text-center py-8">
            No manual channels created yet. Add your first channel above.
            <br />
            <span className="text-xs">Note: M3U playlist channels are automatically loaded from category playlists.</span>
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {channels.map(channel => (
              <div key={channel.id} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={channel.logoUrl}
                    alt={channel.name}
                    className="w-10 h-10 object-contain bg-white rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  <div>
                    <div className="font-medium">{channel.name}</div>
                    <div className="text-sm text-text-secondary flex items-center gap-2">
                      <span>{channel.categoryName}</span>
                      <span className="text-blue-500">• Manual</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditChannel(channel)}
                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                    title="Edit channel"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteChannel(channel.id)}
                    className="p-2 text-destructive hover:text-red-400 transition-colors"
                    title="Delete channel"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Admin Dashboard
const AdminDashboard = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalChannels: 0,
    m3uCategories: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const channelsSnapshot = await getDocs(collection(db, 'channels'));
      
      const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
      const m3uCategories = categories.filter(cat => cat.m3uUrl).length;

      setStats({
        totalCategories: categories.length,
        totalChannels: channelsSnapshot.size,
        m3uCategories,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully", {
        description: "You have been logged out of the admin panel.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Logout failed", {
        description: "There was an error logging out. Please try again.",
      });
    }
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
    { path: '/admin/categories', label: 'Categories', icon: Tv },
    { path: '/admin/channels', label: 'Manual Channels', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-accent" />
            <h1 className="text-xl font-bold">IPTV Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-text-secondary text-sm">
              Logged in as: {user?.email}
            </span>
            <button onClick={handleLogout} className="btn-secondary">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-card border border-border rounded-lg p-4">
              <ul className="space-y-2">
                {navItems.map(item => {
                  const isActive = item.exact 
                    ? location === item.path 
                    : location.startsWith(item.path);
                  
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-accent text-white'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                        }`}
                      >
                        <item.icon size={20} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Switch>
              <Route path="/admin">{() => (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Dashboard</h2>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card border border-border rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Total Categories</h3>
                          <div className="text-3xl font-bold text-accent">{stats.totalCategories}</div>
                          <p className="text-sm text-text-secondary mt-1">
                            {stats.m3uCategories} with M3U playlists
                          </p>
                        </div>
                        <Tv size={32} className="text-accent opacity-20" />
                      </div>
                    </div>
                    
                    <div className="bg-card border border-border rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Manual Channels</h3>
                          <div className="text-3xl font-bold text-accent">{stats.totalChannels}</div>
                          <p className="text-sm text-text-secondary mt-1">
                            Manually added channels
                          </p>
                        </div>
                        <Users size={32} className="text-accent opacity-20" />
                      </div>
                    </div>
                    
                    <div className="bg-card border border-border rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">M3U Categories</h3>
                          <div className="text-3xl font-bold text-green-500">{stats.m3uCategories}</div>
                          <p className="text-sm text-text-secondary mt-1">
                            Categories with playlists
                          </p>
                        </div>
                        <LinkIcon size={32} className="text-green-500 opacity-20" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card border border-border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <Link href="/admin/categories" className="btn-secondary w-full justify-start">
                          <Plus size={16} />
                          Add Category with M3U
                        </Link>
                        <Link href="/admin/channels" className="btn-secondary w-full justify-start">
                          <Plus size={16} />
                          Add Manual Channel
                        </Link>
                        <button 
                          onClick={fetchStats}
                          className="btn-secondary w-full justify-start"
                        >
                          <BarChart3 size={16} />
                          Refresh Statistics
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-card border border-border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">System Information</h3>
                      <div className="text-text-secondary space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>IPTV Management System</span>
                          <span className="font-medium">v2.0.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Admin User:</span>
                          <span className="font-medium">{user?.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>M3U Support:</span>
                          <span className="text-green-500 font-medium">Enabled</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Firebase Status:</span>
                          <span className="text-green-500 font-medium">Connected</span>
                        </div>
                        <div className="flex justify-between">
                          <span>System Status:</span>
                          <span className="text-green-500 font-medium">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Important Notes & Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-text-secondary text-sm">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                          <p><strong className="text-text-primary">M3U Playlists:</strong> Add M3U playlist URLs to categories to automatically import channels with their logos and stream URLs.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                          <p><strong className="text-text-primary">Manual Channels:</strong> Use manual channel creation for individual channels or when M3U playlists are not available.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                          <p><strong className="text-text-primary">Stream Formats:</strong> Both M3U8 (HLS) and MP4 formats are supported for streaming.</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                          <p><strong className="text-text-primary">Category Slugs:</strong> Auto-generated from category names for SEO-friendly URLs.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                          <p><strong className="text-text-primary">Video Player:</strong> Built-in HLS.js support for seamless M3U8 stream playback.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                          <p><strong className="text-text-primary">Firebase Integration:</strong> All data is securely stored in Firebase Firestore.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Getting Started</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg">
                        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                        <div>
                          <div className="font-medium">Create Categories</div>
                          <div className="text-sm text-text-secondary">Start by creating categories like "Sports", "News", "Entertainment"</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg">
                        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                        <div>
                          <div className="font-medium">Add M3U Playlists</div>
                          <div className="text-sm text-text-secondary">Paste M3U playlist URLs to automatically import channels</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg">
                        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                        <div>
                          <div className="font-medium">Add Manual Channels</div>
                          <div className="text-sm text-text-secondary">Create individual channels for streams not in playlists</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">✓</div>
                        <div>
                          <div className="font-medium">Ready to Stream</div>
                          <div className="text-sm text-text-secondary">Your IPTV system is ready for users to browse and watch</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}</Route>
              <Route path="/admin/categories"><CategoriesManager /></Route>
              <Route path="/admin/channels"><ChannelsManager /></Route>
            </Switch>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Admin Component
const Admin = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-accent" />
          <p className="text-text-secondary">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
};

export default Admin;
