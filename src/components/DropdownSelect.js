import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

const DropdownSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  multiSelect = false,
  allowOther = false,
  otherValue = '',
  onOtherChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (multiSelect) {
      if (Array.isArray(value)) {
        if (value.includes(option)) {
          onChange(value.filter(item => item !== option));
        } else {
          onChange([...value, option]);
        }
      } else {
        onChange([option]);
      }
    } else {
      onChange(option);
      setIsOpen(false);
    }
  };

  const handleRemove = (option) => {
    if (Array.isArray(value)) {
      onChange(value.filter(item => item !== option));
    }
  };

  const handleOtherSelect = () => {
    setShowOtherInput(true);
    setIsOpen(false);
  };

  const displayValue = multiSelect 
    ? (Array.isArray(value) && value.length > 0 ? value.join(', ') : value)
    : (Array.isArray(value) ? '' : value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent flex items-center justify-between"
      >
        <span className={displayValue ? 'text-gray-900' : 'text-gray-500'}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => handleSelect(option)}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
                multiSelect && Array.isArray(value) && value.includes(option) ? 'bg-blue-50' : ''
              }`}
            >
              <span>{option}</span>
              {multiSelect && Array.isArray(value) && value.includes(option) && (
                <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          ))}
          
          {allowOther && (
            <div
              onClick={handleOtherSelect}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-t border-gray-200"
            >
              Other...
            </div>
          )}
        </div>
      )}

      {showOtherInput && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={otherValue}
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder="Enter custom value..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={() => {
              if (otherValue.trim()) {
                handleSelect(otherValue.trim());
              }
              setShowOtherInput(false);
              onOtherChange('');
            }}
            className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowOtherInput(false);
              onOtherChange('');
            }}
            className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      )}

      {multiSelect && Array.isArray(value) && value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-sm"
            >
              {item}
              <button
                onClick={() => handleRemove(item)}
                className="hover:text-primary-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownSelect;
