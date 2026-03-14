import { useState, useRef, useEffect } from 'react';
import './SearchableSelect.css';

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select an option...',
    matchInfo = null
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    // Filter options based on search term
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.value && opt.value.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const selectedOption = options.find(opt => opt.value === value);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setSearchTerm('');
    };

    return (
        <div className="searchable-select-wrapper" ref={wrapperRef}>
            <div
                className={`searchable-select-header ${isOpen ? 'open' : ''}`}
                onClick={toggleOpen}
            >
                <div className="searchable-select-selected">
                    {selectedOption ? selectedOption.label : placeholder}
                </div>
                <div className="searchable-select-arrow" />
            </div>

            {isOpen && (
                <div className="searchable-select-dropdown">
                    <div className="searchable-select-search-wrap">
                        <input
                            type="text"
                            className="searchable-select-input"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <ul className="searchable-select-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <li
                                    key={opt.value}
                                    className={`searchable-select-item ${opt.value === value ? 'selected' : ''}`}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                >
                                    {opt.label}
                                </li>
                            ))
                        ) : (
                            <li className="searchable-select-empty">No options found</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
