import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

const SearchableSelect = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = '-- Select an option --',
  searchPlaceholder = 'Type to search...',
  required = false,
  onAddNew,
  addNewText = '+ Add New',
  icon,
  emptyMessage = 'No matching options found',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Selected Option
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Filter options based on search query
  const filteredOptions = options.filter((opt) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    const labelMatch = opt.label?.toLowerCase().includes(query);
    const subMatch = opt.subtext?.toLowerCase().includes(query);
    const searchExtra = opt.searchText?.toLowerCase().includes(query);
    const badgeMatch = opt.badge?.toLowerCase().includes(query);
    return labelMatch || subMatch || searchExtra || badgeMatch;
  });

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {addNewText}
            </button>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all bg-white ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
            : 'border-slate-200 hover:border-slate-300 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon && <span className="text-base flex-shrink-0">{icon}</span>}
          {selectedOption ? (
            <div className="truncate min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.badge && (
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded flex-shrink-0">
                    {selectedOption.badge}
                  </span>
                )}
              </div>
              {selectedOption.subtext && (
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {selectedOption.subtext}
                </p>
              )}
            </div>
          ) : (
            <span className="text-sm text-slate-400 font-medium truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {selectedOption && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="w-5 h-5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <span className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}>
            <ChevronDown className="w-4 h-4" />
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-80">
          {/* Search Box Header */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto divide-y divide-slate-100 p-1 flex-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 font-medium">{emptyMessage}</p>
                {onAddNew && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onAddNew();
                    }}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
                  >
                    {addNewText}
                  </button>
                )}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {opt.icon && <span className="text-sm">{opt.icon}</span>}
                        <span className="text-xs sm:text-sm font-bold truncate">
                          {opt.label}
                        </span>
                        {opt.badge && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                            isSelected ? 'bg-blue-200 text-blue-900' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.subtext && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate font-normal">
                          {opt.subtext}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <span className="text-blue-600 text-sm font-bold flex-shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
