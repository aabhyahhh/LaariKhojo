import React, { useState } from 'react';

// Example: get user from context or localStorage
const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const AdminPage: React.FC = () => {
  const user = getUser();
  const [vendorId, setVendorId] = useState('');
  const [displayPicture, setDisplayPicture] = useState<File | null>(null);
  const [carouselImages, setCarouselImages] = useState<FileList | null>(null);
  const [message, setMessage] = useState('');

  if (!user || (user.role !== 'admin' && user.role !== 'super admin')) {
    return <div style={{ padding: 32, color: 'red' }}>Access denied. Admins only.</div>;
  }

  const handleDisplayPictureUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayPicture || !vendorId) return;
    const formData = new FormData();
    formData.append('displayPicture', displayPicture);
    formData.append('vendorId', vendorId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/upload-display-picture', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      setMessage(data.message || 'Display picture uploaded!');
    } catch (err) {
      setMessage('Error uploading display picture');
    }
  };

  const handleCarouselImagesUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carouselImages || !vendorId) return;
    const token = localStorage.getItem('token');
    let lastMsg = '';
    for (let i = 0; i < carouselImages.length; i++) {
      const formData = new FormData();
      formData.append('image', carouselImages[i]);
      formData.append('vendorId', vendorId);
      try {
        const res = await fetch('/api/admin/upload-vendor-image', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        lastMsg = data.message || 'Image uploaded!';
      } catch (err) {
        lastMsg = 'Error uploading image';
      }
    }
    setMessage(lastMsg);
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Admin: Vendor Image Upload</h2>
      <div style={{ marginBottom: 24 }}>
        <label>Vendor ID: <input value={vendorId} onChange={e => setVendorId(e.target.value)} style={{ width: 300 }} /></label>
      </div>
      <form onSubmit={handleDisplayPictureUpload} style={{ marginBottom: 32 }}>
        <h4>Upload Display Picture</h4>
        <input type="file" accept="image/*" onChange={e => setDisplayPicture(e.target.files?.[0] || null)} />
        <button type="submit" style={{ marginLeft: 16 }}>Upload</button>
      </form>
      <form onSubmit={handleCarouselImagesUpload}>
        <h4>Upload Carousel Images</h4>
        <input type="file" accept="image/*" multiple onChange={e => setCarouselImages(e.target.files)} />
        <button type="submit" style={{ marginLeft: 16 }}>Upload</button>
      </form>
      {message && <div style={{ marginTop: 24, color: 'green' }}>{message}</div>}
    </div>
  );
};

export default AdminPage; 