import React, { useEffect, useState } from 'react';
import PatientTable from './components/PatientTable';
import PatientForm from './components/PatientForm';
import SearchBar from './components/SearchBar';
import { fetchPatients as fetchFromAPI } from './utils/patientAPI';
import {
    appContainerStyle,
    createButtonStyle
} from './styles/styles';

function App() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ given: '', family: '', gender: '', birthDate: '', phone: '' });
    const [formErrors, setFormErrors] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [searchParams, setSearchParams] = useState({ given: '', family: '', phone: '' });

    const loadPatients = async () => {
        setLoading(true);
        const data = await fetchFromAPI(searchParams);
        setPatients(data);
        setLoading(false);
    };

    useEffect(() => {
        loadPatients();
    }, []);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setFormErrors({ ...formErrors, [e.target.name]: '' });
    };

    const validateForm = () => {
        const errors = {};
        const namePattern = /^[a-zA-Z\s'-]+$/;
        const phonePattern = /^[+]?[\d\s\-().]{7,}$/;

        if (!form.given.trim()) errors.given = 'Given name is required.';
        else if (!namePattern.test(form.given)) errors.given = 'Invalid characters in given name.';

        if (!form.family.trim()) errors.family = 'Family name is required.';
        else if (!namePattern.test(form.family)) errors.family = 'Invalid characters in family name.';

        if (!form.gender) errors.gender = 'Gender is required.';
        if (!form.birthDate) errors.birthDate = 'Date of birth is required.';
        else if (new Date(form.birthDate) > new Date()) errors.birthDate = 'Invalid birth date.';

        if (!form.phone.trim()) errors.phone = 'Phone is required.';
        else if (!phonePattern.test(form.phone)) errors.phone = 'Invalid phone number.';

        return errors;
    };

    const buildPatientResource = () => ({
        resourceType: "Patient",
        name: [{
            use: "official",
            family: form.family,
            given: [form.given]
        }],
        gender: form.gender,
        birthDate: form.birthDate,
        telecom: [{ system: "phone", value: form.phone }]
    });

    const validateWithFHIR = async (patientResource) => {
        const response = await fetch("https://hapi.fhir.org/baseR4/Patient/$validate", {
            method: "POST",
            headers: { "Content-Type": "application/fhir+json" },
            body: JSON.stringify(patientResource)
        });

        if (!response.ok) {
            const error = await response.json();
            const issues = error.issue || [];
            const messages = issues.map(i => i.diagnostics).join('\n');
            throw new Error(messages || "FHIR validation failed");
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const patientData = buildPatientResource();

        try {
            await validateWithFHIR(editingId ? { ...patientData, id: editingId } : patientData);

            const res = await fetch(`https://hapi.fhir.org/baseR4/Patient${editingId ? `/${editingId}` : ''}`, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/fhir+json' },
                body: JSON.stringify(editingId ? { ...patientData, id: editingId } : patientData)
            });

            if (!res.ok) {
                alert(`Error saving patient: ${res.status}`);
                return;
            }

            setShowForm(false);
            setEditingId(null);
            setForm({ given: '', family: '', gender: '', birthDate: '', phone: '' });
            loadPatients();
        } catch (err) {
            alert(`Validation error:\n${err.message}`);
        }
    };

    const handleEdit = (patient) => {
        setForm({
            given: patient.given,
            family: patient.family,
            gender: patient.gender,
            birthDate: patient.birthDate,
            phone: patient.phone
        });
        setEditingId(patient.id);
        setShowForm(true);
    };

    return (
        <div style={appContainerStyle}>
            <h2>FHIR Patient Manager</h2>

            <SearchBar
                params={searchParams}
                onChange={setSearchParams}
                onSearch={e => { e.preventDefault(); loadPatients(); }}
                onClear={() => {
                    setSearchParams({ given: '', family: '', phone: '' });
                    loadPatients();
                }}
            />

            <button
                onClick={() => {
                    setShowForm(true);
                    setEditingId(null);
                    setForm({ given: '', family: '', gender: '', birthDate: '', phone: '' });
                    setFormErrors({});
                }}
                style={createButtonStyle}
            >
                Create New Patient
            </button>

            {showForm && (
                <PatientForm
                    form={form}
                    formErrors={formErrors}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowForm(false)}
                    editing={!!editingId}
                />
            )}

            {loading ? <p>Loading...</p> : <PatientTable patients={patients} onEdit={handleEdit} />}
        </div>
    );
}

export default App;
