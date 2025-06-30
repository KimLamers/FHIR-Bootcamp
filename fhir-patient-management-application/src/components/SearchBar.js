import React from 'react';
import { inputGroupStyle, buttonStyle, cancelButtonStyle } from '../styles/styles';

const SearchBar = ({ params, onChange, onSearch, onClear }) => {
    const handleInputChange = (e) => {
        onChange({ ...params, [e.target.name]: e.target.value });
    };

    return (
        <form onSubmit={onSearch} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={inputGroupStyle}>
                    <label>Given Name</label>
                    <input
                        type="text"
                        name="given"
                        value={params?.given || ''}
                        onChange={handleInputChange}
                    />
                </div>
                <div style={inputGroupStyle}>
                    <label>Family Name</label>
                    <input
                        type="text"
                        name="family"
                        value={params?.family || ''}
                        onChange={handleInputChange}
                    />
                </div>
                <div style={inputGroupStyle}>
                    <label>Phone</label>
                    <input
                        type="text"
                        name="phone"
                        value={params?.phone || ''}
                        onChange={handleInputChange}
                    />
                </div>
            </div>
            <button type="submit" style={buttonStyle}>Search</button>
            <button type="button" onClick={onClear} style={cancelButtonStyle}>Clear</button>
        </form>
    );
};

export default SearchBar;
