import React from 'react';
import {
    inputGroupStyle,
    errorStyle,
    formContainerStyle,
    buttonStyle,
    cancelButtonStyle
} from '../styles/styles';

const PatientForm = ({
                         form,
                         formErrors,
                         onChange,
                         onSubmit,
                         onCancel,
                         editing
                     }) => (
    <form onSubmit={onSubmit} style={formContainerStyle}>
        <h3>{editing ? 'Edit Patient' : 'Create New Patient'}</h3>

        <div style={inputGroupStyle}>
            <label>Given Name:</label>
            <input type="text" name="given" value={form.given} onChange={onChange} required />
            {formErrors.given && <span style={errorStyle}>{formErrors.given}</span>}
        </div>

        <div style={inputGroupStyle}>
            <label>Family Name:</label>
            <input type="text" name="family" value={form.family} onChange={onChange} required />
            {formErrors.family && <span style={errorStyle}>{formErrors.family}</span>}
        </div>

        <div style={inputGroupStyle}>
            <label>Gender:</label>
            <select name="gender" value={form.gender} onChange={onChange} required>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
            </select>
            {formErrors.gender && <span style={errorStyle}>{formErrors.gender}</span>}
        </div>

        <div style={inputGroupStyle}>
            <label>Date of Birth:</label>
            <input type="date" name="birthDate" value={form.birthDate} onChange={onChange} required />
            {formErrors.birthDate && <span style={errorStyle}>{formErrors.birthDate}</span>}
        </div>

        <div style={inputGroupStyle}>
            <label>Phone Number:</label>
            <input type="tel" name="phone" value={form.phone} onChange={onChange} required />
            {formErrors.phone && <span style={errorStyle}>{formErrors.phone}</span>}
        </div>

        <button type="submit" style={buttonStyle}>{editing ? 'Update' : 'Submit'}</button>
        <button type="button" onClick={onCancel} style={cancelButtonStyle}>Cancel</button>
    </form>
);

export default PatientForm;
