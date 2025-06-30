import React from 'react';
import { thStyle, tdStyle, tableStyle, editButtonStyle } from '../styles/styles';

const PatientTable = ({ patients, onEdit }) => (
    <table style={tableStyle}>
        <thead>
        <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Given</th>
            <th style={thStyle}>Family</th>
            <th style={thStyle}>Gender</th>
            <th style={thStyle}>Date of Birth</th>
            <th style={thStyle}>Phone</th>
            <th style={thStyle}>Actions</th>
        </tr>
        </thead>
        <tbody>
        {patients.length > 0 ? (
            patients.map(patient => (
                <tr key={patient.id}>
                    <td style={tdStyle}>{patient.id}</td>
                    <td style={tdStyle}>{patient.given || 'N/A'}</td>
                    <td style={tdStyle}>{patient.family || 'N/A'}</td>
                    <td style={tdStyle}>{patient.gender || 'N/A'}</td>
                    <td style={tdStyle}>{patient.birthDate || 'N/A'}</td>
                    <td style={tdStyle}>{patient.phone || 'N/A'}</td>
                    <td style={tdStyle}>
                        <button style={editButtonStyle} onClick={() => onEdit(patient)}>Edit</button>
                    </td>
                </tr>
            ))
        ) : (
            <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No patients found.</td>
            </tr>
        )}
        </tbody>
    </table>
);

export default PatientTable;
