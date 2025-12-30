import React, { useState } from 'react';
import { Camera, X, AlertTriangle } from 'lucide-react';

const ImageUpload = ({ images, onImagesChange, maxImages = 5 }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Simple validation for inappropriate content
  const validateImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple skin tone detection (very basic)
        let skinPixels = 0;
        let totalPixels = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Basic skin tone detection
          if (r > 95 && g > 40 && b > 20 &&
              r > g && r > b &&
              Math.abs(r - g) > 15 &&
              r - b > 15) {
            skinPixels++;
          }
        }
        
        const skinPercentage = (skinPixels / totalPixels) * 100;
        
        // If more than 40% skin tones, flag as potentially inappropriate
        if (skinPercentage > 40) {
          reject(new Error('Image may contain inappropriate content. Please choose a different photo.'));
        } else {
          resolve(true);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUploading(true);
    setError('');

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          throw new Error('Only image files are allowed');
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          throw new Error('Image size must be less than 5MB');
        }

        // Validate for inappropriate content
        await validateImage(file);

        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target.result;
          onImagesChange([...images, imageUrl]);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={image}
                alt={`Profile ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
            {index === 0 && (
              <div className="absolute bottom-2 left-2 bg-primary-500 text-white px-2 py-1 rounded text-xs">
                Main Photo
              </div>
            )}
          </div>
        ))}
        
        {images.length < maxImages && (
          <label className="aspect-square bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
            <Camera className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">Add Photo</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        )}
      </div>
      
      {uploading && (
        <div className="text-center text-sm text-gray-600">
          Validating and uploading images...
        </div>
      )}
      
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
        <p className="text-sm">
          <strong>Photo Guidelines:</strong>
        </p>
        <ul className="text-xs mt-1 space-y-1">
          <li>• Maximum {maxImages} photos</li>
          <li>• File size must be less than 5MB</li>
          <li>• First photo will be your main profile picture</li>
          <li>• Photos are automatically screened for appropriate content</li>
          <li>• Please use clear, recent photos of yourself</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageUpload;