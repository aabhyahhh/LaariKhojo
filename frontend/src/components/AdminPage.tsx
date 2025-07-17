import React, { useState, useEffect } from 'react';
import { API_URL } from "../api/config";
import { api, Vendor } from '../api/client';

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
  console.log("API_URL in AdminPage:", API_URL);
  const user = getUser();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [displayPicture, setDisplayPicture] = useState<File | null>(null);
  const [carouselImages, setCarouselImages] = useState<FileList | null>(null);
  const [message, setMessage] = useState('');
  const [displayImage, setDisplayImage] = useState<string | null>(null);
  const [businessImages, setBusinessImages] = useState<{ _id: string; imageUrl: string }[]>([]);

  useEffect(() => {
    api.getAllUsers().then(res => {
      if (res.success && res.data) setVendors(res.data);
    });
  }, []);

  useEffect(() => {
    if (!vendorId) {
      setDisplayImage(null);
      setBusinessImages([]);
      return;
    }
    const token = localStorage.getItem('token');
    // Fetch display picture
    fetch(`${API_URL}/api/admin/display-picture/${vendorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setDisplayImage(data.displayPicture || null))
      .catch(() => setDisplayImage(null));
    // Fetch business images
    fetch(`${API_URL}/api/admin/vendor-images/${vendorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBusinessImages(Array.isArray(data) ? data : []))
      .catch(() => setBusinessImages([]));
  }, [vendorId, message]);

  const filteredVendors = vendors.filter(v =>
    (v.name || '').toLowerCase().includes(vendorSearch.toLowerCase()) ||
    (v.email || '').toLowerCase().includes(vendorSearch.toLowerCase()) ||
    (v.contactNumber || '').toLowerCase().includes(vendorSearch.toLowerCase())
  );

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
      const res = await fetch(`${API_URL}/api/admin/upload-display-picture`, {
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
        const res = await fetch(`${API_URL}/api/admin/upload-vendor-image`, {
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

  const handleDeleteDisplay = async () => {
    if (!vendorId) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/admin/display-picture/${vendorId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setMessage('Display picture deleted');
  };

  const handleDeleteBusinessImage = async (imageId: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/admin/vendor-image/${imageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setMessage('Business image deleted');
  };

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      setMessage('Please select a vendor.');
      return;
    }
    const token = localStorage.getItem('token');
    let msg = '';
    // Upload display picture if selected
    if (displayPicture) {
      const formData = new FormData();
      formData.append('displayPicture', displayPicture);
      formData.append('vendorId', vendorId);
      try {
        const res = await fetch(`${API_URL}/api/admin/upload-display-picture`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        msg += (data.message || 'Display picture uploaded!') + ' ';
      } catch (err) {
        msg += 'Error uploading display picture. ';
      }
    }
    // Upload carousel images if selected
    if (carouselImages && carouselImages.length > 0) {
      for (let i = 0; i < carouselImages.length; i++) {
        const formData = new FormData();
        formData.append('image', carouselImages[i]);
        formData.append('vendorId', vendorId);
        try {
          const res = await fetch(`${API_URL}/api/admin/upload-vendor-image`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          const data = await res.json();
          msg += (data.message || 'Image uploaded!') + ' ';
        } catch (err) {
          msg += 'Error uploading image. ';
        }
      }
    }
    if (!displayPicture && (!carouselImages || carouselImages.length === 0)) {
      msg = 'Please select at least one image to upload.';
    }
    setMessage(msg.trim());
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Admin: Vendor Image Upload</h2>
      <div style={{ marginBottom: 24 }}>
        <label>Vendor:
          <input
            type="text"
            placeholder="Search by name, email, or contact"
            value={vendorSearch}
            onChange={e => setVendorSearch(e.target.value)}
            style={{ width: 300, marginRight: 8 }}
          />
          <select
            value={vendorId}
            onChange={e => setVendorId(e.target.value)}
            style={{ width: 300 }}
          >
            <option value="">Select a vendor</option>
            {filteredVendors.map(v => (
              <option key={v._id} value={v._id}>
                {v.name || v.email || v.contactNumber}
              </option>
            ))}
          </select>
        </label>
      </div>
      {/* Image Preview Section */}
      {vendorId && (
        <div style={{ marginBottom: 32 }}>
          <h4>Current Display Picture</h4>
          {displayImage ? (
            <div style={{ marginBottom: 8 }}>
              <img src={displayImage} alt="Display" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '50%' }} />
              <button onClick={handleDeleteDisplay} style={{ marginLeft: 16, color: 'red' }}>Delete</button>
            </div>
          ) : (
            <div style={{ color: '#888' }}>No display picture</div>
          )}
          <h4>Current Business Images</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {businessImages.length > 0 ? businessImages.map(img => (
              <div key={img._id} style={{ position: 'relative' }}>
                <img src={img.imageUrl} alt="Business" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                <button onClick={() => handleDeleteBusinessImage(img._id)} style={{ position: 'absolute', top: 2, right: 2, color: 'red', background: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}>×</button>
              </div>
            )) : <div style={{ color: '#888' }}>No business images</div>}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmitAll}>
        <h4>Upload Display Picture</h4>
        <input type="file" accept="image/*" onChange={e => setDisplayPicture(e.target.files?.[0] || null)} />
        <h4>Upload Carousel Images</h4>
        <input type="file" accept="image/*" multiple onChange={e => setCarouselImages(e.target.files)} />
        <button type="submit" style={{ marginTop: 24 }}>Submit</button>
      </form>
      {message && <div style={{ marginTop: 24, color: 'green' }}>{message}</div>}
    </div>
  );
};

export default AdminPage; 